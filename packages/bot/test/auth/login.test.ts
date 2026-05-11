import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requestQRCode } from '../../src/auth/login'

const mockFetch = vi.fn()

beforeEach(() => {
  mockFetch.mockReset()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function mockJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    json: () => Promise.resolve(body),
  } as unknown as Response
}

describe('requestQRCode', () => {
  it('should request QR code and poll confirmed login result', async () => {
    mockFetch
      .mockResolvedValueOnce(mockJsonResponse({
        qrcode: 'qr-token',
        qrcode_img_content: 'https://example.com/qr.png',
      }))
      .mockResolvedValueOnce(mockJsonResponse({
        status: 'confirmed',
        bot_token: 'bot-token',
        ilink_bot_id: 'bot-id',
        baseurl: 'https://redirect.example.com',
        ilink_user_id: 'user-id',
      }))

    const qr = await requestQRCode({ baseUrl: 'https://api.example.com/', appId: 'bot', version: '0.1.0' })
    const result = await qr.poll()

    expect(qr.qrcodeUrl).toBe('https://example.com/qr.png')
    expect(qr.qrcodeToken).toBe('qr-token')
    expect(result).toEqual({
      success: true,
      botToken: 'bot-token',
      accountId: 'bot-id',
      baseUrl: 'https://redirect.example.com',
      userId: 'user-id',
      message: 'Login successful',
    })
    expect(mockFetch.mock.calls[0][0]).toBe('https://api.example.com/ilink/bot/get_bot_qrcode?bot_type=3')
    expect(mockFetch.mock.calls[1][0]).toBe('https://api.example.com/ilink/bot/get_qrcode_status?qrcode=qr-token')
  })

  it('should fail when QR response is invalid', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ qrcode: 'qr-token' }))

    await expect(requestQRCode({ baseUrl: 'https://api.example.com' }))
      .rejects
      .toThrow('Invalid QR code response from server')
  })

  it('should stop after configured QR expiry limit', async () => {
    mockFetch
      .mockResolvedValueOnce(mockJsonResponse({
        qrcode: 'qr-token',
        qrcode_img_content: 'https://example.com/qr.png',
      }))
      .mockResolvedValueOnce(mockJsonResponse({ status: 'expired' }))

    const qr = await requestQRCode({ baseUrl: 'https://api.example.com', maxQrRefresh: 1 })
    const result = await qr.poll()

    expect(result).toEqual({ success: false, message: 'QR code expired 1 times, giving up' })
  })
})
