import type { SessionData } from './auth/session'

/**
 * WeChat Bot protocol types.
 *
 * These types mirror the Weixin iLink Bot API protocol.
 * All bytes fields (buffers, keys) are represented as base64 strings in JSON.
 *
 * @module
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Message sender type */
export const MessageType = {
  NONE: 0,
  USER: 1,
  BOT: 2,
} as const
export type MessageType = typeof MessageType[keyof typeof MessageType]

/** Content type of a message item */
export const MessageItemType = {
  NONE: 0,
  TEXT: 1,
  IMAGE: 2,
  VOICE: 3,
  FILE: 4,
  VIDEO: 5,
} as const
export type MessageItemType = typeof MessageItemType[keyof typeof MessageItemType]

/** Message generation state */
export const MessageState = {
  NEW: 0,
  GENERATING: 1,
  FINISH: 2,
} as const
export type MessageState = typeof MessageState[keyof typeof MessageState]

/** Typing indicator status */
export const TypingStatus = {
  TYPING: 1,
  CANCEL: 2,
} as const
export type TypingStatus = typeof TypingStatus[keyof typeof TypingStatus]

/** Media type for CDN upload */
export const UploadMediaType = {
  IMAGE: 1,
  VIDEO: 2,
  FILE: 3,
  VOICE: 4,
} as const
export type UploadMediaType = typeof UploadMediaType[keyof typeof UploadMediaType]

// ---------------------------------------------------------------------------
// Protocol Message Types
// ---------------------------------------------------------------------------

/** Common request metadata attached to every CGI request. */
export interface BaseInfo {
  channel_version?: string
}

/** CDN media reference; `aes_key` is base64-encoded bytes in JSON. */
export interface CDNMedia {
  /** Encrypted download parameter from CDN upload */
  encrypt_query_param?: string
  /** AES key, base64-encoded */
  aes_key?: string
  /** Encryption type: 0 = encrypt fileid only, 1 = packed with thumbnail/mid info */
  encrypt_type?: number
  /** Full download URL (returned by server directly) */
  full_url?: string
}

export interface TextItem {
  text?: string
}

export interface ImageItem {
  /** Original image CDN reference */
  media?: CDNMedia
  /** Thumbnail CDN reference */
  thumb_media?: CDNMedia
  /** Raw AES-128 key as hex string (16 bytes) */
  aeskey?: string
  url?: string
  mid_size?: number
  thumb_size?: number
  thumb_height?: number
  thumb_width?: number
  hd_size?: number
}

export interface VoiceItem {
  media?: CDNMedia
  /** Voice encoding: 1=pcm 2=adpcm 3=feature 4=speex 5=amr 6=silk 7=mp3 8=ogg-speex */
  encode_type?: number
  bits_per_sample?: number
  /** Sample rate in Hz */
  sample_rate?: number
  /** Voice duration in milliseconds */
  playtime?: number
  /** Voice-to-text content */
  text?: string
}

export interface FileItem {
  media?: CDNMedia
  file_name?: string
  md5?: string
  /** File size as string */
  len?: string
}

export interface VideoItem {
  media?: CDNMedia
  video_size?: number
  play_length?: number
  video_md5?: string
  thumb_media?: CDNMedia
  thumb_size?: number
  thumb_height?: number
  thumb_width?: number
}

/** A quoted/referenced message */
export interface RefMessage {
  message_item?: MessageItem
  /** Summary text */
  title?: string
}

/** A single content item within a message */
export interface MessageItem {
  type?: MessageItemType
  create_time_ms?: number
  update_time_ms?: number
  is_completed?: boolean
  msg_id?: string
  ref_msg?: RefMessage
  text_item?: TextItem
  image_item?: ImageItem
  voice_item?: VoiceItem
  file_item?: FileItem
  video_item?: VideoItem
}

/** A complete Weixin message (proto: WeixinMessage) */
export interface WeixinMessage {
  seq?: number
  message_id?: number
  from_user_id?: string
  to_user_id?: string
  client_id?: string
  create_time_ms?: number
  update_time_ms?: number
  delete_time_ms?: number
  session_id?: string
  group_id?: string
  message_type?: MessageType
  message_state?: MessageState
  item_list?: MessageItem[]
  context_token?: string
}

// ---------------------------------------------------------------------------
// API Request/Response Types
// ---------------------------------------------------------------------------

/** getUpdates request payload */
export interface GetUpdatesReq {
  /** Full context buf cached locally; send empty string on first request. */
  get_updates_buf?: string
}

/** getUpdates response payload */
export interface GetUpdatesResp {
  ret?: number
  /** Server error code (e.g. -14 = session timeout) */
  errcode?: number
  errmsg?: string
  msgs?: WeixinMessage[]
  /** Full context buf to cache locally and send on next request */
  get_updates_buf?: string
  /** Server-suggested timeout (ms) for the next long-poll */
  longpolling_timeout_ms?: number
}

/** sendMessage request payload */
export interface SendMessageReq {
  msg?: WeixinMessage
}

/** sendTyping request payload */
export interface SendTypingReq {
  ilink_user_id?: string
  typing_ticket?: string
  /** 1 = typing (default), 2 = cancel typing */
  status?: TypingStatus
}

export interface SendTypingResp {
  ret?: number
  errmsg?: string
}

/** getConfig response payload */
export interface GetConfigResp {
  ret?: number
  errmsg?: string
  /** Base64-encoded typing ticket for sendTyping */
  typing_ticket?: string
}

/** getUploadUrl request payload */
export interface GetUploadUrlReq {
  filekey?: string
  /** Media type, see UploadMediaType */
  media_type?: UploadMediaType
  to_user_id?: string
  /** Raw plaintext file size in bytes */
  rawsize?: number
  /** Raw plaintext file MD5 hex string */
  rawfilemd5?: string
  /** Ciphertext file size (AES-128-ECB encrypted) */
  filesize?: number
  /** Thumbnail plaintext size (required for IMAGE/VIDEO) */
  thumb_rawsize?: number
  /** Thumbnail plaintext MD5 (required for IMAGE/VIDEO) */
  thumb_rawfilemd5?: string
  /** Thumbnail ciphertext size (required for IMAGE/VIDEO) */
  thumb_filesize?: number
  /** Skip thumbnail upload URL, defaults to false */
  no_need_thumb?: boolean
  /** AES encryption key (hex) */
  aeskey?: string
}

/** getUploadUrl response payload */
export interface GetUploadUrlResp {
  /** Upload parameter for original file */
  upload_param?: string
  /** Upload parameter for thumbnail (empty if no thumbnail) */
  thumb_upload_param?: string
  /** Full upload URL (server-provided, no client assembly needed) */
  upload_full_url?: string
}

// ---------------------------------------------------------------------------
// SDK Options Types
// ---------------------------------------------------------------------------

/** Configuration options for the WeixinBot client */
export interface WeixinBotOptions {
  /** Bot authentication token (can be obtained via login()) */
  token?: string
  /** API base URL @default 'https://ilinkai.weixin.qq.com' */
  baseUrl?: string
  /** CDN base URL @default 'https://novac2c.cdn.weixin.qq.com/c2c' */
  cdnBaseUrl?: string
  /** iLink App ID */
  appId?: string
  /** Client version string (e.g. '1.0.0') */
  version?: string
  /** Long-poll timeout in ms @default 35000 */
  longPollTimeoutMs?: number
  /** Regular API timeout in ms @default 15000 */
  apiTimeoutMs?: number
  /**
   * Session file path for token persistence.
   * When set, token is automatically saved after login and loaded on next start.
   * Avoids repeated QR scanning across restarts.
   * The file is automatically deleted when the server reports the session is expired.
   *
   * @example
   * ```ts
   * const bot = new WeixinBot({ session: '.weixin-bot.session.json' })
   * ```
   */
  session?: string
}

/** Options for sending a text message */
export interface SendTextOptions {
  /** Recipient user ID */
  to: string
  /** Text content */
  text: string
  /** Context token (for session continuity) */
  contextToken?: string
}

/** Callbacks for the login flow */
export interface LoginCallbacks {
  /** Called with QR URL when login requires scanning */
  onQrCode?: (qrcodeUrl: string) => void
  /** Called when the QR code is scanned (user needs to confirm in WeChat) */
  onScanned?: () => void
  /** Called when QR code is refreshed after expiry (new URL) */
  onQrRefresh?: (newQrcodeUrl: string) => void
}

/** Options for sending a media message */
export interface SendMediaOptions {
  /** Recipient user ID */
  to: string
  /** File content as Uint8Array or ArrayBuffer */
  file: Uint8Array | ArrayBuffer
  /** Optional file name (used for FILE type) */
  fileName?: string
  /** Optional text caption */
  text?: string
  /** Context token (for session continuity) */
  contextToken?: string
}

// ---------------------------------------------------------------------------
// Event Types
// ---------------------------------------------------------------------------

/** Event map for the WeixinBot event emitter */
export interface BotEventMap {
  /** Fired for each new inbound message */
  'message': [message: WeixinMessage]
  /** Fired when polling encounters an error (non-fatal, will retry) */
  'error': [error: Error]
  /** Fired when polling starts successfully */
  'connected': []
  /** Fired when polling stops */
  'disconnected': []
  /** Fired when a saved session is loaded */
  'session:loaded': [session: SessionData]
  /** Fired on session expiry after the persisted session file is deleted, if configured */
  'session:expired': []
}
