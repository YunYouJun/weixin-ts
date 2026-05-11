import type { WeixinMessage } from '../../src/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Poller } from '../../src/polling/poller'
import { MessageItemType, MessageType } from '../../src/types'

const mockFetch = vi.fn()

beforeEach(() => {
  mockFetch.mockReset()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function mockJsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response
}

describe('poller', () => {
  it('should emit connection lifecycle and incoming messages', async () => {
    const message: WeixinMessage = {
      from_user_id: 'user-id',
      message_type: MessageType.USER,
      item_list: [{ type: MessageItemType.TEXT, text_item: { text: 'hello' } }],
    }
    const onConnected = vi.fn()
    const onDisconnected = vi.fn()
    const onError = vi.fn()
    let poller: Poller

    mockFetch.mockResolvedValue(mockJsonResponse({
      ret: 0,
      get_updates_buf: 'next-buf',
      msgs: [message],
    }))

    const received = await new Promise<WeixinMessage[]>((resolve) => {
      poller = new Poller(
        { baseUrl: 'https://api.example.com', token: 'bot-token', longPollTimeoutMs: 100 },
        {
          onMessages: (msgs) => {
            poller.stop()
            resolve(msgs)
          },
          onError,
          onConnected,
          onDisconnected,
        },
      )
      poller.start()
    })

    expect(received).toEqual([message])
    expect(onConnected).toHaveBeenCalledOnce()
    expect(onDisconnected).toHaveBeenCalledOnce()
    expect(onError).not.toHaveBeenCalled()
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toMatchObject({
      get_updates_buf: '',
      base_info: { channel_version: '0.1.0' },
    })
  })

  it('should stop and notify when session expires', async () => {
    const onSessionExpired = vi.fn()
    let poller: Poller

    mockFetch.mockResolvedValueOnce(mockJsonResponse({ errcode: -14, errmsg: 'expired' }))

    await new Promise<void>((resolve) => {
      poller = new Poller(
        { baseUrl: 'https://api.example.com', token: 'bot-token', longPollTimeoutMs: 100 },
        {
          onMessages: vi.fn(),
          onError: vi.fn(),
          onSessionExpired: () => {
            onSessionExpired()
            resolve()
          },
        },
      )
      poller.start()
    })

    expect(onSessionExpired).toHaveBeenCalledOnce()
    expect(poller!.isRunning).toBe(false)
  })
})
