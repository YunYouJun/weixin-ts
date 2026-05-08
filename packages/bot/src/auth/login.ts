/**
 * QR code login flow for WeChat Bot.
 *
 * Provides a cross-platform QR login implementation using only `fetch`.
 * No terminal rendering dependencies — the SDK returns the QR URL and
 * the caller decides how to display it (terminal, browser, etc.).
 *
 * @module
 */

import { DEFAULT_BASE_URL } from '../constants'
import { buildCommonHeaders } from '../utils/headers'

/** QR login configuration */
export interface QRLoginOptions {
  /** API base URL @default 'https://ilinkai.weixin.qq.com' */
  baseUrl?: string
  /** Bot type identifier @default '3' */
  botType?: string
  /** iLink App ID */
  appId?: string
  /** Client version string */
  version?: string
  /** Timeout for the entire login flow in ms @default 300000 (5 min) */
  timeoutMs?: number
  /** Timeout for each long-poll request in ms @default 35000 */
  pollTimeoutMs?: number
  /** Max QR code refresh attempts when expired @default 3 */
  maxQrRefresh?: number
}

/** Result from requestQRCode */
export interface QRCodeResult {
  /** QR code content URL (for rendering as QR image) */
  qrcodeUrl: string
  /** Raw qrcode token (internal, used for polling) */
  qrcodeToken: string
  /**
   * Poll for scan confirmation. Resolves when user confirms or times out.
   * Call this after displaying the QR code to the user.
   *
   * @param callbacks - Optional callbacks for status updates
   */
  poll: (callbacks?: QRPollCallbacks) => Promise<LoginResult>
}

/** Callbacks during QR polling */
export interface QRPollCallbacks {
  /** Called when the QR code is scanned (user needs to confirm) */
  onScanned?: () => void
  /** Called on IDC redirect (informational) */
  onRedirect?: (newHost: string) => void
  /** Called when QR code is refreshed after expiry (new URL to display) */
  onQrRefresh?: (newQrcodeUrl: string) => void
}

/** Final login result */
export interface LoginResult {
  /** Whether login succeeded */
  success: boolean
  /** Bot token for API authentication */
  botToken?: string
  /** Bot account ID (ilink_bot_id) */
  accountId?: string
  /** API base URL (may differ from default after login) */
  baseUrl?: string
  /** User ID of the person who scanned the QR code */
  userId?: string
  /** Human-readable status message */
  message: string
}

interface QRCodeResponse {
  qrcode: string
  qrcode_img_content: string
}

interface StatusResponse {
  status: 'wait' | 'scaned' | 'confirmed' | 'expired' | 'scaned_but_redirect'
  bot_token?: string
  ilink_bot_id?: string
  baseurl?: string
  ilink_user_id?: string
  redirect_host?: string
}

const DEFAULT_BOT_TYPE = '3'
const DEFAULT_LOGIN_TIMEOUT_MS = 5 * 60_000
const DEFAULT_POLL_TIMEOUT_MS = 35_000

/**
 * Request a QR code for WeChat bot login.
 *
 * Returns the QR URL and a `poll()` function to wait for scan confirmation.
 * This is the entry point for the login flow.
 *
 * @example
 * ```ts
 * import { requestQRCode } from '@weixin-ts/bot'
 *
 * const { qrcodeUrl, poll } = await requestQRCode()
 *
 * // Display QR however you want (terminal, web page, etc.)
 * console.log('Scan this:', qrcodeUrl)
 *
 * // Wait for user to scan and confirm
 * const result = await poll({
 *   onScanned: () => console.log('Scanned! Please confirm in WeChat.'),
 * })
 *
 * if (result.success) {
 *   console.log('Token:', result.botToken)
 * }
 * ```
 */
export async function requestQRCode(options?: QRLoginOptions): Promise<QRCodeResult> {
  const baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL
  const botType = options?.botType ?? DEFAULT_BOT_TYPE
  const headers = buildCommonHeaders({ appId: options?.appId, version: options?.version })

  const url = `${ensureNoTrailingSlash(baseUrl)}/ilink/bot/get_bot_qrcode?bot_type=${encodeURIComponent(botType)}`

  const res = await fetch(url, { headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to get QR code: ${res.status} ${text}`)
  }

  const data = await res.json() as QRCodeResponse

  if (!data.qrcode || !data.qrcode_img_content) {
    throw new Error('Invalid QR code response from server')
  }

  return {
    qrcodeUrl: data.qrcode_img_content,
    qrcodeToken: data.qrcode,
    poll: callbacks => pollForLogin({
      baseUrl,
      qrcode: data.qrcode,
      timeoutMs: options?.timeoutMs ?? DEFAULT_LOGIN_TIMEOUT_MS,
      pollTimeoutMs: options?.pollTimeoutMs ?? DEFAULT_POLL_TIMEOUT_MS,
      appId: options?.appId,
      version: options?.version,
      botType: options?.botType,
      maxQrRefresh: options?.maxQrRefresh,
      callbacks,
    }),
  }
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

async function pollForLogin(params: {
  baseUrl: string
  qrcode: string
  timeoutMs: number
  pollTimeoutMs: number
  appId?: string
  version?: string
  botType?: string
  maxQrRefresh?: number
  callbacks?: QRPollCallbacks
}): Promise<LoginResult> {
  const deadline = Date.now() + params.timeoutMs
  let currentBaseUrl = params.baseUrl
  let currentQrcode = params.qrcode
  let scannedNotified = false
  let refreshCount = 0
  const maxRefresh = params.maxQrRefresh ?? 3
  const headers = buildCommonHeaders({ appId: params.appId, version: params.version })

  while (Date.now() < deadline) {
    const status = await pollStatus(currentBaseUrl, currentQrcode, params.pollTimeoutMs, headers)

    switch (status.status) {
      case 'wait':
        break

      case 'scaned':
        if (!scannedNotified) {
          params.callbacks?.onScanned?.()
          scannedNotified = true
        }
        break

      case 'scaned_but_redirect':
        if (status.redirect_host) {
          currentBaseUrl = `https://${status.redirect_host}`
          params.callbacks?.onRedirect?.(status.redirect_host)
        }
        break

      case 'confirmed':
        if (!status.ilink_bot_id) {
          return { success: false, message: 'Server did not return bot ID' }
        }
        return {
          success: true,
          botToken: status.bot_token,
          accountId: status.ilink_bot_id,
          baseUrl: status.baseurl,
          userId: status.ilink_user_id,
          message: 'Login successful',
        }

      case 'expired':
        refreshCount++
        if (refreshCount >= maxRefresh) {
          return { success: false, message: `QR code expired ${maxRefresh} times, giving up` }
        }
        // Auto-refresh QR code
        try {
          const botType = params.botType ?? DEFAULT_BOT_TYPE
          const url = `${ensureNoTrailingSlash(params.baseUrl)}/ilink/bot/get_bot_qrcode?bot_type=${encodeURIComponent(botType)}`
          const res = await fetch(url, { headers })
          if (res.ok) {
            const data = await res.json() as QRCodeResponse
            if (data.qrcode) {
              currentQrcode = data.qrcode
              scannedNotified = false
              params.callbacks?.onQrRefresh?.(data.qrcode_img_content)
            }
          }
        }
        catch {
          return { success: false, message: 'Failed to refresh QR code' }
        }
        break
    }

    await sleep(1000)
  }

  return { success: false, message: 'Login timed out' }
}

async function pollStatus(baseUrl: string, qrcode: string, timeoutMs: number, headers: Record<string, string>): Promise<StatusResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const url = `${ensureNoTrailingSlash(baseUrl)}/ilink/bot/get_qrcode_status?qrcode=${encodeURIComponent(qrcode)}`
    const res = await fetch(url, { signal: controller.signal, headers })
    clearTimeout(timer)

    if (!res.ok) {
      return { status: 'wait' }
    }
    return await res.json() as StatusResponse
  }
  catch {
    clearTimeout(timer)
    return { status: 'wait' }
  }
}

function ensureNoTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
