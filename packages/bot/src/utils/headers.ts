/**
 * HTTP header construction utilities for WeChat Bot API.
 *
 * @module
 */

import { DEFAULT_APP_ID, SDK_VERSION } from '../constants'
import { randomWechatUin } from './random'

export interface HeaderOptions {
  /** Bot token for Authorization header */
  token?: string
  /** iLink App ID */
  appId?: string
  /** Client version string (e.g. '1.0.0') */
  version?: string
}

/**
 * Encode a semver version string into a uint32: `0x00MMNNPP`.
 * High 8 bits fixed to 0; remaining: major<<16 | minor<<8 | patch.
 *
 * @example
 * ```ts
 * buildClientVersion('1.0.11') // => 65547 (0x0001000B)
 * ```
 */
export function buildClientVersion(version: string): number {
  const parts = version.split('.').map(p => Number.parseInt(p, 10))
  const major = parts[0] ?? 0
  const minor = parts[1] ?? 0
  const patch = parts[2] ?? 0
  return ((major & 0xFF) << 16) | ((minor & 0xFF) << 8) | (patch & 0xFF)
}

/**
 * Build common headers shared by all API requests.
 */
export function buildCommonHeaders(options?: HeaderOptions): Record<string, string> {
  const appId = options?.appId ?? DEFAULT_APP_ID
  const version = options?.version ?? SDK_VERSION
  return {
    'iLink-App-Id': appId,
    'iLink-App-ClientVersion': String(buildClientVersion(version)),
  }
}

/**
 * Build full headers for a POST request with auth and body info.
 */
export function buildPostHeaders(body: string, options?: HeaderOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'AuthorizationType': 'ilink_bot_token',
    'X-WECHAT-UIN': randomWechatUin(),
    ...buildCommonHeaders(options),
  }

  if (options?.token?.trim()) {
    headers.Authorization = `Bearer ${options.token.trim()}`
  }

  return headers
}
