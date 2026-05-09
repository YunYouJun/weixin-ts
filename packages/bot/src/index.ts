/**
 * @weixin-ts/bot — Framework-agnostic WeChat Bot SDK
 *
 * A cross-platform TypeScript SDK for interacting with the WeChat iLink Bot API.
 * Works in Node.js, Deno, Bun, and browsers.
 *
 * @example
 * ```ts
 * import { WeixinBot } from '@weixin-ts/bot'
 *
 * const bot = new WeixinBot({ token: 'YOUR_TOKEN' })
 *
 * bot.on('message', (msg) => {
 *   console.log('Received:', msg)
 * })
 *
 * bot.start()
 * ```
 *
 * @packageDocumentation
 */

// Low-level API (namespace export for advanced users)
export * as api from './api'

// Auth / Login
export { requestQRCode } from './auth/login'
export type {
  LoginResult,
  QRCodeResult,
  QRLoginOptions,
  QRPollCallbacks,
} from './auth/login'
export { deleteSession, loadSession, saveSession } from './auth/session'
export type { SessionData } from './auth/session'

// Main class
export { WeixinBot } from './bot'

// Constants
export {
  DEFAULT_API_TIMEOUT_MS,
  DEFAULT_BASE_URL,
  DEFAULT_CDN_BASE_URL,
  DEFAULT_CONFIG_TIMEOUT_MS,
  DEFAULT_LONG_POLL_TIMEOUT_MS,
  SDK_VERSION,
} from './constants'

// Event system
export { TypedEventEmitter } from './events'

export type { EventHandler } from './events'

// Types
export type {
  // Protocol types
  BaseInfo,
  BotEventMap,
  CDNMedia,
  FileItem,
  GetConfigResp,
  // API request/response
  GetUpdatesReq,
  GetUpdatesResp,
  GetUploadUrlReq,
  GetUploadUrlResp,
  ImageItem,
  // SDK options
  LoginCallbacks,
  MessageItem,
  RefMessage,
  SendMediaOptions,
  SendMessageReq,
  SendTextOptions,
  SendTypingReq,
  SendTypingResp,
  TextItem,
  VideoItem,
  VoiceItem,
  WeixinBotOptions,
  WeixinMessage,
} from './types'
// Enums (runtime values)
export {
  MessageItemType,
  MessageState,
  MessageType,
  TypingStatus,
  UploadMediaType,
} from './types'
