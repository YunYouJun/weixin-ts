import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { aesEcbPaddedSize } from '../src/aes-ecb'
import { uploadMedia } from '../src/upload'

const mockFetch = vi.fn()

beforeEach(() => {
  mockFetch.mockReset()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function mockResponse(text: string, status = 200, headers: Record<string, string> = {}): Response {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  )

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: {
      get: (name: string) => normalizedHeaders[name.toLowerCase()] ?? null,
    },
    text: () => Promise.resolve(text),
  } as unknown as Response
}

function createUploadOptions() {
  return {
    file: new TextEncoder().encode('hello media'),
    toUserId: 'user123',
    mediaType: 'image' as const,
    apiOptions: {
      baseUrl: 'https://api.example.com',
      token: 'token',
      timeoutMs: 1000,
      version: '1.0.0',
    },
    cdnBaseUrl: 'https://cdn.example.com/c2c',
  }
}

describe('uploadMedia', () => {
  it('should upload media and return CDN parameters from JSON response', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(JSON.stringify({ upload_param: 'upload-param' })))
      .mockResolvedValueOnce(mockResponse(JSON.stringify({ download_param: 'download-param' })))

    const result = await uploadMedia(createUploadOptions())

    expect(result.downloadParam).toBe('download-param')
    expect(result.fileSize).toBe(11)
    expect(result.fileSizeCiphertext).toBe(aesEcbPaddedSize(11))
    expect(result.aesKeyHex).toMatch(/^[\da-f]{32}$/)
    expect(result.filekey).toMatch(/^[\da-f]{32}$/)
    expect(mockFetch).toHaveBeenCalledTimes(2)

    const [getUploadUrl, getUploadUrlOptions] = mockFetch.mock.calls[0]
    expect(getUploadUrl).toBe('https://api.example.com/ilink/bot/getuploadurl')
    expect(JSON.parse(getUploadUrlOptions.body).to_user_id).toBe('user123')

    const [cdnUploadUrl, cdnUploadOptions] = mockFetch.mock.calls[1]
    expect(cdnUploadUrl).toContain('https://cdn.example.com/c2c/upload')
    expect(cdnUploadUrl).toContain('encrypted_query_param=upload-param')
    expect(cdnUploadOptions.body).toBeInstanceOf(Uint8Array)
  })

  it('should use upload_full_url when provided by getUploadUrl', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(JSON.stringify({ upload_param: 'upload-param', upload_full_url: 'https://upload.example.com/full' })))
      .mockResolvedValueOnce(mockResponse(JSON.stringify({ encrypt_query_param: 'encrypt-query-param' })))

    const result = await uploadMedia(createUploadOptions())

    expect(result.downloadParam).toBe('encrypt-query-param')
    expect(mockFetch.mock.calls[1][0]).toBe('https://upload.example.com/full')
  })

  it('should throw when CDN upload returns empty body and no download header', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(JSON.stringify({ upload_param: 'upload-param' })))
      .mockResolvedValueOnce(mockResponse(''))

    await expect(uploadMedia(createUploadOptions())).rejects.toThrow(
      'CDN upload succeeded (200) but returned no download_param',
    )
  })

  it('should throw when CDN upload returns non-JSON text and no download header', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(JSON.stringify({ upload_param: 'upload-param' })))
      .mockResolvedValueOnce(mockResponse('OK'))

    await expect(uploadMedia(createUploadOptions())).rejects.toThrow(
      'CDN upload succeeded (200) but returned no download_param',
    )
  })

  it('should prefer CDN response headers as fallback download param', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(JSON.stringify({ upload_param: 'upload-param' })))
      .mockResolvedValueOnce(mockResponse('', 200, { 'x-encrypted-param': 'header-param' }))

    const result = await uploadMedia(createUploadOptions())

    expect(result.downloadParam).toBe('header-param')
  })

  it('should throw when getUploadUrl returns an empty body', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(''))

    await expect(uploadMedia(createUploadOptions())).rejects.toThrow(
      'getUploadUrl 200: empty response',
    )
  })

  it('should throw when getUploadUrl returns invalid JSON', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse('OK'))

    await expect(uploadMedia(createUploadOptions())).rejects.toThrow(
      'getUploadUrl 200: invalid JSON response: OK',
    )
  })

  it('should throw when getUploadUrl fails', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse('bad gateway', 502))

    await expect(uploadMedia(createUploadOptions())).rejects.toThrow(
      'getUploadUrl 502: bad gateway',
    )
  })

  it('should throw when getUploadUrl returns no upload URL', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(JSON.stringify({})))

    await expect(uploadMedia(createUploadOptions())).rejects.toThrow(
      'getUploadUrl returned no upload URL',
    )
  })

  it('should throw when CDN upload fails', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(JSON.stringify({ upload_param: 'upload-param' })))
      .mockResolvedValueOnce(mockResponse('upload failed', 500, { 'x-error-message': 'cdn rejected' }))

    await expect(uploadMedia(createUploadOptions())).rejects.toThrow(
      'CDN upload failed 500: cdn rejected',
    )
  })

  it('should throw when CDN upload returns empty body and no fallback download_param', async () => {
    // getUploadUrl returns upload_full_url (no upload_param), CDN returns empty body + no headers
    mockFetch
      .mockResolvedValueOnce(mockResponse(JSON.stringify({ upload_full_url: 'https://upload.example.com/full' })))
      .mockResolvedValueOnce(mockResponse(''))

    await expect(uploadMedia(createUploadOptions())).rejects.toThrow(
      'CDN upload succeeded (200) but returned no download_param',
    )
  })
})
