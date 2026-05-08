/**
 * Fetch bot config via the getConfig API.
 *
 * @module
 */

import type { GetConfigResp } from '../types'
import type { ApiClientOptions } from './client'
import { DEFAULT_CONFIG_TIMEOUT_MS } from '../constants'
import { apiPost, buildBaseInfo } from './client'

export interface GetConfigOptions extends ApiClientOptions {
  /** Target user's iLink user ID */
  ilinkUserId: string
  /** Context token from previous message (optional) */
  contextToken?: string
}

/**
 * Fetch bot configuration for a specific user.
 * Returns config including the `typing_ticket` needed for `sendTyping`.
 *
 * @returns Bot config response including typing ticket
 */
export async function getConfig(options: GetConfigOptions): Promise<GetConfigResp> {
  return await apiPost<GetConfigResp>({
    baseUrl: options.baseUrl,
    endpoint: 'ilink/bot/getconfig',
    body: {
      ilink_user_id: options.ilinkUserId,
      context_token: options.contextToken,
      base_info: buildBaseInfo(options.version),
    },
    token: options.token,
    timeoutMs: options.timeoutMs ?? DEFAULT_CONFIG_TIMEOUT_MS,
    appId: options.appId,
    version: options.version,
  })
}
