import type { GetUpdatesResp, WeixinMessage } from '../src/types'
import { Buffer } from 'node:buffer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WeixinBot } from '../src/bot'
import { MessageItemType, MessageType } from '../src/types'

// Mock global fetch
const mockFetch = vi.fn()

beforeEach(() => {
  mockFetch.mockReset()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.restoreAllMocks()
})

function mockFetchResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  )
  const text = typeof body === 'string' ? body : JSON.stringify(body)

  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => normalizedHeaders[name.toLowerCase()] ?? null,
    },
    text: () => Promise.resolve(text),
    json: () => Promise.resolve(body),
  })
}

describe('weixinBot', () => {
  describe('sendText', () => {
    it('should send a text message', async () => {
      mockFetch.mockReturnValueOnce(mockFetchResponse({}))

      const bot = new WeixinBot({ token: 'test-token' })
      const msgId = await bot.sendText({ to: 'user123', text: 'Hello!' })

      expect(msgId).toMatch(/^weixin-bot-/)
      expect(mockFetch).toHaveBeenCalledOnce()

      const [url, opts] = mockFetch.mock.calls[0]
      expect(url).toContain('ilink/bot/sendmessage')
      expect(opts.method).toBe('POST')

      const body = JSON.parse(opts.body)
      expect(body.msg.to_user_id).toBe('user123')
      expect(body.msg.item_list[0].text_item.text).toBe('Hello!')
      expect(body.msg.message_type).toBe(MessageType.BOT)
    })

    it('should include cached context token', async () => {
      const bot = new WeixinBot({ token: 'test-token' })
      // Simulate receiving a message with context token
      const msg: WeixinMessage = {
        from_user_id: 'user123',
        context_token: 'ctx-abc',
        item_list: [{ type: MessageItemType.TEXT, text_item: { text: 'hi' } }],
      }
      // Trigger internal caching
      ;(bot as any).handleMessages([msg])

      // Verify token was cached
      expect(bot.getContextToken('user123')).toBe('ctx-abc')

      // Clear and re-mock fetch for the sendMessage call
      mockFetch.mockReset()
      mockFetch.mockImplementation(() => mockFetchResponse({}))

      // Send - should include the cached token automatically
      await bot.sendText({ to: 'user123', text: 'reply' })

      expect(mockFetch).toHaveBeenCalled()
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.msg.context_token).toBe('ctx-abc')
    })
  })

  describe('sendImage', () => {
    it('should send media aes_key as base64-encoded hex string', async () => {
      mockFetch
        .mockReturnValueOnce(mockFetchResponse({ upload_param: 'upload-param' }))
        .mockReturnValueOnce(mockFetchResponse('', 200, { 'x-encrypted-param': 'download-param' }))
        .mockReturnValueOnce(mockFetchResponse({}))

      const bot = new WeixinBot({ token: 'test-token' })
      await bot.sendImage({
        to: 'user123',
        file: new TextEncoder().encode('hello image'),
      })

      expect(mockFetch).toHaveBeenCalledTimes(3)
      const body = JSON.parse(mockFetch.mock.calls[2][1].body)
      const imageItem = body.msg.item_list[0].image_item
      const aesKeyHex = Buffer.from(imageItem.media.aes_key, 'base64').toString('utf8')

      expect(imageItem.media.encrypt_query_param).toBe('download-param')
      expect(aesKeyHex).toMatch(/^[\da-f]{32}$/)
      expect(imageItem).not.toHaveProperty('aeskey')
      expect(imageItem.mid_size).toBe(16)
    })
  })

  describe('event emission', () => {
    it('should emit message events', () => {
      const bot = new WeixinBot({ token: 'test-token' })
      const received: WeixinMessage[] = []

      bot.on('message', (msg) => {
        received.push(msg)
      })

      const msg: WeixinMessage = {
        from_user_id: 'user1',
        item_list: [{ type: MessageItemType.TEXT, text_item: { text: 'test' } }],
      }

      ;(bot as any).handleMessages([msg])

      expect(received).toHaveLength(1)
      expect(received[0].from_user_id).toBe('user1')
    })

    it('should cache context tokens from incoming messages', () => {
      const bot = new WeixinBot({ token: 'test-token' })

      const msg: WeixinMessage = {
        from_user_id: 'user1',
        context_token: 'token-xyz',
      }

      ;(bot as any).handleMessages([msg])

      expect(bot.getContextToken('user1')).toBe('token-xyz')
    })
  })

  describe('sendTyping', () => {
    it('should fetch config and send typing', async () => {
      // Mock all fetch calls
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('getconfig')) {
          return mockFetchResponse({ ret: 0, typing_ticket: 'ticket-123' })
        }
        if (url.includes('sendtyping')) {
          return mockFetchResponse({ ret: 0 })
        }
        return mockFetchResponse({})
      })

      const bot = new WeixinBot({ token: 'test-token' })
      await bot.sendTyping('user123')

      // Verify at least one getConfig and one sendTyping call
      const urls = mockFetch.mock.calls.map((call: any[]) => call[0] as string)
      expect(urls.some((u: string) => u.includes('getconfig'))).toBe(true)
      expect(urls.some((u: string) => u.includes('sendtyping'))).toBe(true)
    })
  })

  describe('getUpdates', () => {
    it('should return messages from manual getUpdates call', async () => {
      const resp: GetUpdatesResp = {
        ret: 0,
        msgs: [
          { from_user_id: 'user1', item_list: [{ type: MessageItemType.TEXT, text_item: { text: 'hello' } }] },
        ],
        get_updates_buf: 'buf123',
      }
      mockFetch.mockReturnValueOnce(mockFetchResponse(resp))

      const bot = new WeixinBot({ token: 'test-token' })
      const msgs = await bot.getUpdates()

      expect(msgs).toHaveLength(1)
      expect(msgs[0].from_user_id).toBe('user1')
    })
  })

  describe('constructor', () => {
    it('should use default base URLs', () => {
      const bot = new WeixinBot({ token: 'test' })
      expect(bot.baseUrl).toBe('https://ilinkai.weixin.qq.com')
      expect(bot.cdnBaseUrl).toBe('https://novac2c.cdn.weixin.qq.com/c2c')
    })

    it('should allow custom base URLs', () => {
      const bot = new WeixinBot({
        token: 'test',
        baseUrl: 'https://custom.api.com',
        cdnBaseUrl: 'https://custom.cdn.com',
      })
      expect(bot.baseUrl).toBe('https://custom.api.com')
      expect(bot.cdnBaseUrl).toBe('https://custom.cdn.com')
    })

    it('should not be polling initially', () => {
      const bot = new WeixinBot({ token: 'test' })
      expect(bot.isPolling).toBe(false)
    })
  })
})
