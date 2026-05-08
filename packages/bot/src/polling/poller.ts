/**
 * Long-poll loop for receiving messages from the WeChat Bot API.
 *
 * @module
 */

import type { GetUpdatesResp, WeixinMessage } from '../types'
import { getUpdates } from '../api/get-updates'
import { DEFAULT_LONG_POLL_TIMEOUT_MS, DEFAULT_RETRY_DELAY_MS, SESSION_EXPIRED_ERRCODE, SESSION_INVALID_ERRCODE } from '../constants'

/** Configuration for the polling loop */
export interface PollerOptions {
  /** API base URL */
  baseUrl: string
  /** Bot authentication token */
  token?: string
  /** Long-poll timeout in ms */
  longPollTimeoutMs?: number
  /** Retry delay after errors in ms */
  retryDelayMs?: number
  /** iLink App ID */
  appId?: string
  /** Client version */
  version?: string
}

/** Callbacks for poller events */
export interface PollerCallbacks {
  /** Called with each batch of new messages */
  onMessages: (msgs: WeixinMessage[]) => void
  /** Called when a poll error occurs (non-fatal) */
  onError: (err: Error) => void
  /** Called when the session expires */
  onSessionExpired?: () => void
  /** Called when polling starts */
  onConnected?: () => void
  /** Called when polling stops */
  onDisconnected?: () => void
}

/**
 * A long-poll loop manager that continuously fetches updates from the API.
 * Handles timeouts gracefully (expected in long-polling) and retries on errors.
 *
 * @example
 * ```ts
 * const poller = new Poller(
 *   { baseUrl: 'https://ilinkai.weixin.qq.com', token: '...' },
 *   {
 *     onMessages: (msgs) => console.log('Got', msgs.length, 'messages'),
 *     onError: (err) => console.error(err),
 *   },
 * )
 * await poller.start()
 * // Later...
 * poller.stop()
 * ```
 */
export class Poller {
  private abortController: AbortController | null = null
  private updatesBuf = ''
  private running = false

  constructor(
    private options: PollerOptions,
    private callbacks: PollerCallbacks,
  ) {}

  /** Whether the poller is currently running */
  get isRunning(): boolean {
    return this.running
  }

  /**
   * Start the long-poll loop.
   * Resolves immediately after the loop begins — polling runs in the background.
   * The loop runs indefinitely until `stop()` is called.
   */
  start(): void {
    if (this.running)
      return

    this.running = true
    this.abortController = new AbortController()
    this.callbacks.onConnected?.()

    // Fire-and-forget: run poll loop in background
    void this.pollLoop()
  }

  /**
   * Stop the polling loop gracefully.
   * The current in-flight request will be aborted.
   */
  stop(): void {
    this.running = false
    this.abortController?.abort()
    this.abortController = null
    this.callbacks.onDisconnected?.()
  }

  /** Reset the updates buffer (e.g. after session expiry) */
  resetBuffer(): void {
    this.updatesBuf = ''
  }

  private async pollLoop(): Promise<void> {
    while (this.running && !this.abortController?.signal.aborted) {
      try {
        const resp = await this.poll()

        if (!this.running)
          break

        if (resp.errcode === SESSION_EXPIRED_ERRCODE || resp.errcode === SESSION_INVALID_ERRCODE) {
          this.callbacks.onSessionExpired?.()
          this.stop()
          break
        }

        if (resp.get_updates_buf) {
          this.updatesBuf = resp.get_updates_buf
        }

        if (resp.msgs?.length) {
          this.callbacks.onMessages(resp.msgs)
        }
      }
      catch (err) {
        if (!this.running)
          break

        this.callbacks.onError(
          err instanceof Error ? err : new Error(String(err)),
        )

        // Wait before retrying
        await this.sleep(this.options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS)
      }
    }
  }

  private async poll(): Promise<GetUpdatesResp> {
    return await getUpdates({
      baseUrl: this.options.baseUrl,
      token: this.options.token,
      timeoutMs: this.options.longPollTimeoutMs ?? DEFAULT_LONG_POLL_TIMEOUT_MS,
      getUpdatesBuf: this.updatesBuf,
      appId: this.options.appId,
      version: this.options.version,
    })
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, ms)
      // Allow abort to interrupt sleep
      this.abortController?.signal.addEventListener('abort', () => {
        clearTimeout(timer)
        resolve()
      }, { once: true })
    })
  }
}
