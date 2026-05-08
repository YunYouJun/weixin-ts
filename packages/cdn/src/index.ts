/**
 * @weixin-ts/cdn — WeChat CDN upload/download with AES-ECB encryption
 *
 * Cross-platform CDN media handling using WebCrypto API.
 * Works in Node.js 18+, Deno, Bun, and modern browsers.
 *
 * @example
 * ```ts
 * import { uploadMedia, downloadMedia, encryptAesEcb, decryptAesEcb } from '@weixin-ts/cdn'
 *
 * // Upload media
 * const result = await uploadMedia({
 *   file: imageBuffer,
 *   toUserId: 'user_id',
 *   mediaType: 'image',
 *   apiOptions: { baseUrl: '...', token: '...' },
 *   cdnBaseUrl: '...',
 * })
 *
 * // Download media
 * const data = await downloadMedia({ media: msg.image_item.media })
 * ```
 *
 * @packageDocumentation
 */

// AES-ECB encryption
export {
  aesEcbPaddedSize,
  decryptAesEcb,
  encryptAesEcb,
  pkcs7Pad,
  pkcs7Unpad,
} from './aes-ecb'

// Download pipeline
export { downloadMedia } from './download'
export type { DownloadMediaOptions } from './download'

// Types
export type { CDNMedia } from './types'
// Upload pipeline
export { uploadMedia } from './upload'

export type { UploadedMedia, UploadMediaOptions } from './upload'

// Utilities
export { fromBase64, fromHex, md5Hex, randomBytes, toBase64, toHex } from './utils'
