/**
 * Default values and constants for the WeChat Bot SDK.
 *
 * @module
 */

/** Default API base URL */
export const DEFAULT_BASE_URL = 'https://ilinkai.weixin.qq.com'

/** Default CDN base URL */
export const DEFAULT_CDN_BASE_URL = 'https://novac2c.cdn.weixin.qq.com/c2c'

/** Default long-poll timeout for getUpdates (ms) */
export const DEFAULT_LONG_POLL_TIMEOUT_MS = 35_000

/** Default timeout for regular API requests (ms) */
export const DEFAULT_API_TIMEOUT_MS = 15_000

/** Default timeout for lightweight API requests like getConfig, sendTyping (ms) */
export const DEFAULT_CONFIG_TIMEOUT_MS = 10_000

/** Default retry delay when polling encounters errors (ms) */
export const DEFAULT_RETRY_DELAY_MS = 3_000

/** Session expired error code from the server */
export const SESSION_EXPIRED_ERRCODE = -14

/** Session invalid error code from the server */
export const SESSION_INVALID_ERRCODE = -13

/** SDK version (for channel_version header) */
export const SDK_VERSION = '0.0.1'

/** Default iLink App ID */
export const DEFAULT_APP_ID = 'bot'
