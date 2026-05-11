/**
 * CDN media download and decryption.
 *
 * @module
 */

import type { CDNMedia } from './types'
import { decryptAesEcb } from './aes-ecb'
import { fromBase64, fromHex } from './utils'

/** Options for downloading media */
export interface DownloadMediaOptions {
  /** CDN media reference from a received message */
  media: CDNMedia
  /** CDN base URL @default 'https://novac2c.cdn.weixin.qq.com/c2c' */
  cdnBaseUrl?: string
  /** AES key override (hex string). If not provided, uses media.aes_key (base64) */
  aesKeyHex?: string
}

const DEFAULT_CDN_BASE_URL = 'https://novac2c.cdn.weixin.qq.com/c2c'

function parseAesKey(aesKeyBase64: string): Uint8Array {
  const decoded = fromBase64(aesKeyBase64)
  if (decoded.length === 16)
    return decoded

  const hex = String.fromCharCode(...decoded)
  if (decoded.length === 32 && /^[\da-f]{32}$/i.test(hex))
    return fromHex(hex)

  throw new Error(`Invalid AES key: expected 16 raw bytes or 32-character hex string, got ${decoded.length} bytes`)
}

/**
 * Download and decrypt a media file from the WeChat CDN.
 *
 * @param options - Download configuration
 * @returns Decrypted file content as Uint8Array
 *
 * @example
 * ```ts
 * import { downloadMedia } from '@weixin-ts/cdn'
 *
 * // From an incoming message's image_item.media
 * const imageData = await downloadMedia({
 *   media: message.item_list[0].image_item.media,
 *   aesKeyHex: message.item_list[0].image_item.aeskey,
 * })
 * ```
 */
export async function downloadMedia(options: DownloadMediaOptions): Promise<Uint8Array> {
  const { media, cdnBaseUrl } = options

  // Resolve download URL
  let url: string
  if (media.full_url) {
    url = media.full_url
  }
  else if (media.encrypt_query_param) {
    const base = cdnBaseUrl ?? DEFAULT_CDN_BASE_URL
    url = `${base}/download?${media.encrypt_query_param}`
  }
  else {
    throw new Error('CDN media has no download URL (neither full_url nor encrypt_query_param)')
  }

  // Download encrypted data
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`CDN download failed ${res.status}: ${res.statusText}`)
  }

  const ciphertext = new Uint8Array(await res.arrayBuffer())

  // Resolve AES key
  let aesKey: Uint8Array
  if (options.aesKeyHex) {
    aesKey = fromHex(options.aesKeyHex)
  }
  else if (media.aes_key) {
    aesKey = parseAesKey(media.aes_key)
  }
  else {
    throw new Error('No AES key available for decryption')
  }

  // Decrypt
  return await decryptAesEcb(ciphertext, aesKey)
}
