/**
 * Long-poll for new messages via the getUpdates API.
 *
 * @module
 */

import type { GetUpdatesResp } from '../types'
import type { ApiClientOptions } from './client'
import { DEFAULT_LONG_POLL_TIMEOUT_MS } from '../constants'
import { apiPost, buildBaseInfo } from './client'

export interface GetUpdatesOptions extends ApiClientOptions {
  /** Cached context buf from previous response (empty string for first call) */
  getUpdatesBuf?: string
}

/**
 * Long-poll for new messages. The server holds the request until new messages arrive
 * or the timeout expires.
 *
 * On client-side timeout (AbortError), returns an empty response with `ret=0`
 * so the caller can simply retry. This is normal long-poll behavior.
 *
 * @returns The getUpdates response containing messages and updated context buffer
 */
export async function getUpdates(options: GetUpdatesOptions): Promise<GetUpdatesResp> {
  const timeout = options.timeoutMs ?? DEFAULT_LONG_POLL_TIMEOUT_MS

  try {
    return await apiPost<GetUpdatesResp>({
      baseUrl: options.baseUrl,
      endpoint: 'ilink/bot/getupdates',
      body: {
        get_updates_buf: options.getUpdatesBuf ?? '',
        base_info: buildBaseInfo(options.version),
      },
      token: options.token,
      timeoutMs: timeout,
      appId: options.appId,
      version: options.version,
    })
  }
  catch (err) {
    // Long-poll timeout is normal; return empty response so caller retries
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        ret: 0,
        msgs: [],
        get_updates_buf: options.getUpdatesBuf,
      }
    }
    throw err
  }
}
