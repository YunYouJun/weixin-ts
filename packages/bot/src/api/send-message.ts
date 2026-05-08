/**
 * Send a message via the sendMessage API.
 *
 * @module
 */

import type { SendMessageReq } from '../types'
import type { ApiClientOptions } from './client'
import { DEFAULT_API_TIMEOUT_MS } from '../constants'
import { apiPost, buildBaseInfo } from './client'

export interface SendMessageOptions extends ApiClientOptions {
  /** The message request body */
  body: SendMessageReq
}

/**
 * Send a single message downstream to a user.
 *
 * @throws Error if the request fails
 */
export async function sendMessage(options: SendMessageOptions): Promise<void> {
  await apiPost<Record<string, unknown>>({
    baseUrl: options.baseUrl,
    endpoint: 'ilink/bot/sendmessage',
    body: {
      ...options.body,
      base_info: buildBaseInfo(options.version),
    },
    token: options.token,
    timeoutMs: options.timeoutMs ?? DEFAULT_API_TIMEOUT_MS,
    appId: options.appId,
    version: options.version,
  })
}
