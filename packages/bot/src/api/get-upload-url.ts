/**
 * Get a pre-signed CDN upload URL via the getUploadUrl API.
 *
 * @module
 */

import type { GetUploadUrlReq, GetUploadUrlResp } from '../types'
import type { ApiClientOptions } from './client'
import { DEFAULT_API_TIMEOUT_MS } from '../constants'
import { apiPost, buildBaseInfo } from './client'

export type GetUploadUrlOptions = ApiClientOptions & GetUploadUrlReq

/**
 * Request a pre-signed upload URL from the CDN.
 * This URL is used to upload encrypted media files.
 *
 * @returns Response containing the upload URL and parameters
 */
export async function getUploadUrl(options: GetUploadUrlOptions): Promise<GetUploadUrlResp> {
  const {
    baseUrl,
    token,
    timeoutMs,
    appId,
    version,
    ...reqBody
  } = options

  return await apiPost<GetUploadUrlResp>({
    baseUrl,
    endpoint: 'ilink/bot/getuploadurl',
    body: {
      ...reqBody,
      base_info: buildBaseInfo(version),
    },
    token,
    timeoutMs: timeoutMs ?? DEFAULT_API_TIMEOUT_MS,
    appId,
    version,
  })
}
