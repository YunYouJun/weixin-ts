# Configuration

## WeixinBot Options

```ts
import { WeixinBot } from '@weixin-ts/bot'

const bot = new WeixinBot({
  // Bot token (can be obtained via login())
  token: 'YOUR_TOKEN',

  // API base URL (usually no need to change)
  baseUrl: 'https://ilinkai.weixin.qq.com',

  // CDN base URL (media upload/download)
  cdnBaseUrl: 'https://novac2c.cdn.weixin.qq.com/c2c',

  // iLink App ID
  appId: 'bot',

  // Client version
  version: '1.0.0',

  // Long-poll timeout (ms)
  longPollTimeoutMs: 35000,

  // Normal API request timeout (ms)
  apiTimeoutMs: 15000,
})
```

## Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `token` | `string` | — | Bot token (can be obtained via `login()`) |
| `baseUrl` | `string` | `https://ilinkai.weixin.qq.com` | API base URL |
| `cdnBaseUrl` | `string` | `https://novac2c.cdn.weixin.qq.com/c2c` | CDN base URL |
| `appId` | `string` | `'bot'` | iLink App ID |
| `version` | `string` | SDK version | Client version |
| `longPollTimeoutMs` | `number` | `35000` | Long-poll timeout |
| `apiTimeoutMs` | `number` | `15000` | Normal request timeout |
| `session` | `SessionStorage` | — | Session storage backend. Use `fileSession(path)` from `@weixin-ts/bot/node` for file storage. |

## Login Callbacks

```ts
const result = await bot.login({
  // Called when QR code is ready; display the URL wherever you like
  onQrCode: url => console.log('Scan:', url),

  // User scanned, waiting for confirmation in WeChat
  onScanned: () => console.log('Confirm in WeChat...'),

  // QR code expired and auto-refreshed
  onQrRefresh: url => console.log('QR refreshed:', url),
})

if (!result.success)
  throw new Error(result.message)
```

For more control over login timeout, polling interval, or bot type, use the low-level `requestQRCode()`.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `message` | `WeixinMessage` | New message received |
| `error` | `Error` | Polling error (non-fatal, auto-retries) |
| `connected` | — | Polling started |
| `disconnected` | — | Polling stopped |
| `session:expired` | — | Session expired (errcode -14); local session file is deleted automatically when `session` is configured |

## Message Types

| Type | Value | Constant |
|------|-------|----------|
| Text | `1` | `MessageItemType.TEXT` |
| Image | `2` | `MessageItemType.IMAGE` |
| Voice | `3` | `MessageItemType.VOICE` |
| File | `4` | `MessageItemType.FILE` |
| Video | `5` | `MessageItemType.VIDEO` |
