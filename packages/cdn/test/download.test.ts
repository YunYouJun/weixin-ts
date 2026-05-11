import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { encryptAesEcb } from '../src/aes-ecb'
import { downloadMedia } from '../src/download'
import { toBase64, toHex } from '../src/utils'

const mockFetch = vi.fn()

beforeEach(() => {
  mockFetch.mockReset()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function mockBinaryResponse(data: Uint8Array): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    arrayBuffer: () => Promise.resolve(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)),
  } as unknown as Response
}

describe('downloadMedia', () => {
  it('should decrypt media.aes_key encoded as base64 raw bytes', async () => {
    const plaintext = new TextEncoder().encode('hello media')
    const key = globalThis.crypto.getRandomValues(new Uint8Array(16))
    const ciphertext = await encryptAesEcb(plaintext, key)
    mockFetch.mockResolvedValueOnce(mockBinaryResponse(ciphertext))

    const result = await downloadMedia({
      media: {
        encrypt_query_param: 'download-param',
        aes_key: toBase64(key),
      },
      cdnBaseUrl: 'https://cdn.example.com/c2c',
    })

    expect(result).toEqual(plaintext)
    expect(mockFetch).toHaveBeenCalledWith('https://cdn.example.com/c2c/download?download-param')
  })

  it('should decrypt media.aes_key encoded as base64 hex string', async () => {
    const plaintext = new TextEncoder().encode('hello image')
    const key = globalThis.crypto.getRandomValues(new Uint8Array(16))
    const keyHex = toHex(key)
    const ciphertext = await encryptAesEcb(plaintext, key)
    mockFetch.mockResolvedValueOnce(mockBinaryResponse(ciphertext))

    const result = await downloadMedia({
      media: {
        encrypt_query_param: 'download-param',
        aes_key: toBase64(new TextEncoder().encode(keyHex)),
      },
      cdnBaseUrl: 'https://cdn.example.com/c2c',
    })

    expect(result).toEqual(plaintext)
  })
})
