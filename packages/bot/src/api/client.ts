/**
 * Low-level HTTP client for WeChat Bot API.
 * Uses `globalThis.fetch` for cross-platform compatibility.
 *
 * @module
 */

import type { BaseInfo } from '../types'
import { SDK_VERSION } from '../constants'
import { buildCommonHeaders, buildPostHeaders } from '../utils/headers'

/** Common options for API requests */
export interface ApiClientOptions {
  /** API base URL */
  baseUrl: string
  /** Bot authentication token */
  token?: string
  /** Request timeout in ms */
  timeoutMs?: number
  /** iLink App ID */
  appId?: string
  /** Client version */
  version?: string
}

/** Build the `base_info` payload included in every API request. */
export function buildBaseInfo(version?: string): BaseInfo {
  return { channel_version: version ?? SDK_VERSION }
}

function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

/**
 * Perform a POST request to a WeChat Bot API endpoint.
 * Handles timeout via AbortController, returns parsed JSON response.
 *
 * @throws Error if the request fails or returns non-2xx status
 */
export async function apiPost<T>(params: {
  baseUrl: string
  endpoint: string
  body: Record<string, unknown>
  token?: string
  timeoutMs: number
  appId?: string
  version?: string
}): Promise<T> {
  const base = ensureTrailingSlash(params.baseUrl)
  const url = new URL(params.endpoint, base)
  const bodyStr = JSON.stringify(params.body)
  const headers = buildPostHeaders(bodyStr, {
    token: params.token,
    appId: params.appId,
    version: params.version,
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), params.timeoutMs)

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: bodyStr,
      signal: controller.signal,
    })
    clearTimeout(timer)

    const text = await res.text()
    if (!res.ok) {
      throw new Error(`API ${params.endpoint} ${res.status}: ${text}`)
    }
    return JSON.parse(text) as T
  }
  catch (err) {
    clearTimeout(timer)
    throw err
  }
}

/**
 * Perform a GET request to a WeChat Bot API endpoint.
 *
 * @throws Error if the request fails or returns non-2xx status
 */
export async function apiGet(params: {
  baseUrl: string
  endpoint: string
  timeoutMs?: number
  appId?: string
  version?: string
}): Promise<string> {
  const base = ensureTrailingSlash(params.baseUrl)
  const url = new URL(params.endpoint, base)
  const headers = buildCommonHeaders({
    appId: params.appId,
    version: params.version,
  })

  const timeoutMs = params.timeoutMs
  const controller = timeoutMs != null && timeoutMs > 0 ? new AbortController() : undefined
  const timer = controller && timeoutMs
    ? setTimeout(() => controller.abort(), timeoutMs)
    : undefined

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers,
      ...(controller ? { signal: controller.signal } : {}),
    })
    if (timer !== undefined)
      clearTimeout(timer)

    const text = await res.text()
    if (!res.ok) {
      throw new Error(`API GET ${params.endpoint} ${res.status}: ${text}`)
    }
    return text
  }
  catch (err) {
    if (timer !== undefined)
      clearTimeout(timer)
    throw err
  }
}
