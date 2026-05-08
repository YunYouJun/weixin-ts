/**
 * Types shared by the CDN package.
 * Re-exported from the main package for convenience.
 *
 * @module
 */

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
