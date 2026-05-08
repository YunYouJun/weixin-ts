/**
 * Send a typing indicator via the sendTyping API.
 *
 * @module
 */

import type { SendTypingReq, SendTypingResp } from '../types'
import type { ApiClientOptions } from './client'
import { DEFAULT_CONFIG_TIMEOUT_MS } from '../constants'
import { apiPost, buildBaseInfo } from './client'

export interface SendTypingOptions extends ApiClientOptions {
  /** The typing request body */
  body: SendTypingReq
}

/**
 * Send a typing indicator to show the bot is processing.
 * Use `TypingStatus.TYPING` to start and `TypingStatus.CANCEL` to stop.
 *
 * @throws Error if the request fails
 */
export async function sendTyping(options: SendTypingOptions): Promise<SendTypingResp> {
  return await apiPost<SendTypingResp>({
    baseUrl: options.baseUrl,
    endpoint: 'ilink/bot/sendtyping',
    body: {
      ...options.body,
      base_info: buildBaseInfo(options.version),
    },
    token: options.token,
    timeoutMs: options.timeoutMs ?? DEFAULT_CONFIG_TIMEOUT_MS,
    appId: options.appId,
    version: options.version,
  })
}
