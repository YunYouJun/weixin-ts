/**
 * CDN upload pipeline for WeChat media files.
 *
 * Handles the full flow: hash → encrypt → request upload URL → POST to CDN.
 *
 * @module
 */

import { aesEcbPaddedSize, encryptAesEcb } from './aes-ecb'
import { md5Hex, randomBytes, toHex } from './utils'

/** Result of a successful media upload */
export interface UploadedMedia {
  /** Unique file key for this upload */
  filekey: string
  /** CDN download parameter (encrypt_query_param for message construction) */
  downloadParam: string
  /** AES key used for encryption (hex-encoded) */
  aesKeyHex: string
  /** Plaintext file size in bytes */
  fileSize: number
  /** Ciphertext file size in bytes (after AES-ECB encryption) */
  fileSizeCiphertext: number
}

/** Options for the upload pipeline */
export interface UploadMediaOptions {
  /** File content to upload */
  file: Uint8Array | ArrayBuffer
  /** Recipient user ID */
  toUserId: string
  /** Media type: 'image' | 'video' | 'file' | 'voice' */
  mediaType: 'image' | 'video' | 'file' | 'voice'
  /** API options for getUploadUrl */
  apiOptions: {
    baseUrl: string
    token?: string
    timeoutMs?: number
    /** SDK version string for channel_version @default '0.0.1' */
    version?: string
  }
  /** CDN base URL for upload */
  cdnBaseUrl: string
}

const MEDIA_TYPE_MAP = {
  image: 1,
  video: 2,
  file: 3,
  voice: 4,
} as const

/**
 * Upload a media file to the WeChat CDN.
 *
 * This handles the full upload pipeline:
 * 1. Compute file hash (MD5)
 * 2. Generate AES-128 key and file key
 * 3. Request pre-signed upload URL from the API
 * 4. Encrypt file with AES-128-ECB
 * 5. Upload encrypted file to CDN
 * 6. Return upload info for message construction
 *
 * @param options - Upload configuration
 * @returns Upload result with CDN parameters for message construction
 *
 * @example
 * ```ts
 * import { uploadMedia } from '@weixin-ts/cdn'
 *
 * const result = await uploadMedia({
 *   file: imageBuffer,
 *   toUserId: 'recipient_id',
 *   mediaType: 'image',
 *   apiOptions: { baseUrl: 'https://ilinkai.weixin.qq.com', token: '...' },
 *   cdnBaseUrl: 'https://novac2c.cdn.weixin.qq.com/c2c',
 * })
 * // Use result.downloadParam in message construction
 * ```
 */
export async function uploadMedia(options: UploadMediaOptions): Promise<UploadedMedia> {
  const data = options.file instanceof Uint8Array
    ? options.file
    : new Uint8Array(options.file)

  // 1. Compute hash and sizes
  const rawsize = data.length
  const rawfilemd5 = await md5Hex(data)
  const filesize = aesEcbPaddedSize(rawsize)

  // 2. Generate keys
  const aesKey = randomBytes(16)
  const filekey = toHex(randomBytes(16))

  // 3. Get upload URL from API
  const uploadUrlResp = await requestUploadUrl({
    ...options.apiOptions,
    filekey,
    mediaType: MEDIA_TYPE_MAP[options.mediaType],
    toUserId: options.toUserId,
    rawsize,
    rawfilemd5,
    filesize,
    aeskeyHex: toHex(aesKey),
    version: options.apiOptions.version,
  })

  const uploadFullUrl = uploadUrlResp.upload_full_url?.trim()
  const uploadParam = uploadUrlResp.upload_param

  if (!uploadFullUrl && !uploadParam) {
    throw new Error('getUploadUrl returned no upload URL')
  }

  // 4. Encrypt the file
  const ciphertext = await encryptAesEcb(data, aesKey)

  // 5. Upload to CDN
  const downloadParam = await uploadToCdn({
    ciphertext,
    uploadFullUrl: uploadFullUrl || undefined,
    uploadParam: uploadParam || undefined,
    filekey,
    cdnBaseUrl: options.cdnBaseUrl,
  })

  return {
    filekey,
    downloadParam,
    aesKeyHex: toHex(aesKey),
    fileSize: rawsize,
    fileSizeCiphertext: filesize,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface UploadUrlResp {
  upload_param?: string
  thumb_upload_param?: string
  upload_full_url?: string
}

async function requestUploadUrl(params: {
  baseUrl: string
  token?: string
  timeoutMs?: number
  filekey: string
  mediaType: number
  toUserId: string
  rawsize: number
  rawfilemd5: string
  filesize: number
  aeskeyHex: string
  version?: string
}): Promise<UploadUrlResp> {
  const body = JSON.stringify({
    filekey: params.filekey,
    media_type: params.mediaType,
    to_user_id: params.toUserId,
    rawsize: params.rawsize,
    rawfilemd5: params.rawfilemd5,
    filesize: params.filesize,
    no_need_thumb: true,
    aeskey: params.aeskeyHex,
    base_info: { channel_version: params.version ?? '0.0.1' },
  })

  const baseUrl = params.baseUrl.endsWith('/') ? params.baseUrl : `${params.baseUrl}/`
  const url = new URL('ilink/bot/getuploadurl', baseUrl)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), params.timeoutMs ?? 15000)

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AuthorizationType': 'ilink_bot_token',
        ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
      },
      body,
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`getUploadUrl ${res.status}: ${text}`)
    }

    return await res.json() as UploadUrlResp
  }
  catch (err) {
    clearTimeout(timer)
    throw err
  }
}

async function uploadToCdn(params: {
  ciphertext: Uint8Array
  uploadFullUrl?: string
  uploadParam?: string
  filekey: string
  cdnBaseUrl: string
}): Promise<string> {
  const uploadUrl = params.uploadFullUrl
    ?? `${params.cdnBaseUrl}/upload?upload_param=${encodeURIComponent(params.uploadParam ?? '')}`

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    body: params.ciphertext,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`CDN upload failed ${res.status}: ${text}`)
  }

  const resp = await res.json() as { download_param?: string, encrypt_query_param?: string }
  return resp.download_param ?? resp.encrypt_query_param ?? ''
}
