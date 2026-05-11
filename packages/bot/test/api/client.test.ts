import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiPost } from '../../src/api/client'
import { buildClientVersion, buildCommonHeaders, buildPostHeaders } from '../../src/utils/headers'

const mockFetch = vi.fn()

beforeEach(() => {
  mockFetch.mockReset()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function mockResponse(text: string, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(text),
  } as unknown as Response
}

describe('headers', () => {
  describe('buildClientVersion', () => {
    it('should encode version string to uint32', () => {
      expect(buildClientVersion('1.0.11')).toBe(0x0001000B)
      expect(buildClientVersion('1.0.0')).toBe(0x00010000)
      expect(buildClientVersion('2.1.7')).toBe(0x00020107)
      expect(buildClientVersion('0.0.1')).toBe(0x00000001)
    })

    it('should handle partial versions', () => {
      expect(buildClientVersion('1')).toBe(0x00010000)
      expect(buildClientVersion('1.2')).toBe(0x00010200)
    })
  })

  describe('buildCommonHeaders', () => {
    it('should include app id and version', () => {
      const headers = buildCommonHeaders({ appId: 'mybot', version: '1.0.0' })
      expect(headers['iLink-App-Id']).toBe('mybot')
      expect(headers['iLink-App-ClientVersion']).toBe(String(0x00010000))
    })

    it('should use defaults when no options provided', () => {
      const headers = buildCommonHeaders()
      expect(headers['iLink-App-Id']).toBe('bot')
      expect(headers['iLink-App-ClientVersion']).toBeDefined()
    })
  })

  describe('buildPostHeaders', () => {
    it('should include content type and auth headers', () => {
      const headers = buildPostHeaders('{"test":true}', { token: 'my-token' })
      expect(headers['Content-Type']).toBe('application/json')
      expect(headers.AuthorizationType).toBe('ilink_bot_token')
      expect(headers.Authorization).toBe('Bearer my-token')
      expect(headers['X-WECHAT-UIN']).toBeDefined()
    })

    it('should not include Authorization when token is empty', () => {
      const headers = buildPostHeaders('{}', { token: '' })
      expect(headers.Authorization).toBeUndefined()
    })

    it('should not include Authorization when token is undefined', () => {
      const headers = buildPostHeaders('{}', {})
      expect(headers.Authorization).toBeUndefined()
    })
  })
})

describe('apiPost', () => {
  const baseParams = {
    baseUrl: 'https://api.example.com',
    endpoint: 'ilink/bot/test',
    body: { hello: 'world' },
    timeoutMs: 1000,
  }

  it('should parse JSON responses', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse('{"ok":true}'))

    const result = await apiPost<{ ok: boolean }>(baseParams)

    expect(result).toEqual({ ok: true })
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch.mock.calls[0][0]).toBe('https://api.example.com/ilink/bot/test')
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({ hello: 'world' })
  })

  it('should return an empty object for empty successful responses', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(''))

    const result = await apiPost<Record<string, never>>(baseParams)

    expect(result).toEqual({})
  })

  it('should throw contextual errors for invalid JSON responses', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse('OK'))

    await expect(apiPost(baseParams)).rejects.toThrow(
      'API ilink/bot/test invalid JSON (status=200): OK',
    )
  })

  it('should throw contextual errors for non-2xx responses', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse('bad request', 400))

    await expect(apiPost(baseParams)).rejects.toThrow(
      'API ilink/bot/test 400: bad request',
    )
  })
})
