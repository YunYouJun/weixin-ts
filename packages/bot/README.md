# @weixin-ts/bot

Framework-agnostic WeChat Bot SDK — cross-platform, type-safe, zero dependencies.

## Platform Support

| Platform | Support | Notes |
|----------|---------|-------|
| Node.js ≥18 | ✅ Full | Recommended for production |
| Bun | ✅ Full | Native Web API compatibility |
| Deno | ✅ Full | `--allow-net` required |
| Browser | ⚠️ Partial | API calls work, long-polling impractical (CORS) |

## Features

- **Cross-platform**: Uses only Web APIs (`fetch`, `crypto.subtle`) — works everywhere
- **Type-safe**: Full TypeScript with typed events
- **Zero dependencies**: No runtime deps
- **QR Login**: Built-in scan-to-login flow (`bot.login()`)
- **Event-driven**: `bot.on('message', handler)` pattern
- **Media support**: Send images, videos, files via CDN (with `@weixin-ts/cdn`)
- **Low-level access**: Raw API functions exported for advanced use

## Install

```bash
pnpm add @weixin-ts/bot
```

## Quick Start (with QR Login)

```ts
import { MessageItemType, WeixinBot } from '@weixin-ts/bot'
import { fileSession } from '@weixin-ts/bot/node'

const bot = new WeixinBot({ session: fileSession('.weixin-bot.session.json') })

// 1. QR scan login (or load saved session)
const result = await bot.login({
  onQrCode: url => console.log('Scan this QR code:', url),
  onScanned: () => console.log('Scanned! Confirm in WeChat...'),
})

if (!result.success)
  throw new Error(result.message)

// 2. Listen for messages
bot.on('message', (msg) => {
  const text = msg.item_list?.find(i => i.type === MessageItemType.TEXT)?.text_item?.text
  if (text) {
    bot.sendText({ to: msg.from_user_id!, text: `Echo: ${text}` })
  }
})

bot.on('error', console.error)
await bot.start()
```

## Quick Start (with Token)

If you already have a bot token:

```ts
const bot = new WeixinBot({ token: 'YOUR_BOT_TOKEN' })

bot.on('message', (msg) => { /* ... */ })
await bot.start()
```

## API

### `WeixinBot`

```ts
const options: WeixinBotOptions | undefined = undefined
const bot = new WeixinBot(options)
await bot.start()
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `token` | `string` | — | Bot token (can be obtained via `login()`) |
| `baseUrl` | `string` | `https://ilinkai.weixin.qq.com` | API base URL |
| `cdnBaseUrl` | `string` | `https://novac2c.cdn.weixin.qq.com/c2c` | CDN base URL |
| `appId` | `string` | `'bot'` | iLink App ID |
| `longPollTimeoutMs` | `number` | `35000` | Long-poll timeout |
| `apiTimeoutMs` | `number` | `15000` | Regular API timeout |

#### Login

```ts
const result = await bot.login({
  // Display the QR URL however you want
  onQrCode: url => console.log('Scan:', url),
  onScanned: () => console.log('Scanned! Confirm in WeChat...'),
})
// result.success, result.botToken, result.accountId, result.userId
```

#### Messaging

```ts
await bot.sendText({ to, text })
await bot.sendImage({ to, file: uint8Array })
await bot.sendVideo({ to, file: uint8Array })
await bot.sendFile({ to, file: uint8Array, fileName: 'doc.pdf' })
await bot.sendTyping(userId)
```

#### Events

```ts
bot.on('message', (msg: WeixinMessage) => {
  console.log(msg)
})
bot.on('error', (error: Error) => {
  console.error(error)
})
bot.on('connected', () => {})
bot.on('disconnected', () => {})
bot.on('session:loaded', (session) => {})
bot.on('session:expired', () => {})
```

#### Lifecycle

```ts
await bot.start() // Start long-polling
bot.stop() // Stop polling
bot.isPolling // boolean
```

### Standalone Login (without WeixinBot instance)

```ts
import { requestQRCode } from '@weixin-ts/bot'

const { qrcodeUrl, poll } = await requestQRCode()
const result = await poll()
// Use result.botToken with new WeixinBot({ token: result.botToken })
```

### Low-level API

```ts
import { api } from '@weixin-ts/bot'

await api.getUpdates({ baseUrl, token, getUpdatesBuf: '' })
await api.sendMessage({ baseUrl, token, body: { msg: {} } })
await api.sendTyping({ baseUrl, token, body: { status: 1, to_user_id: '...' } })
await api.getConfig({ baseUrl, token, ilinkUserId: '...' })
await api.getUploadUrl({ baseUrl, token, mediaType: 1, fileMd5: '...', fileSize: 1024 })
```

## Message Types

| Type | Value | Constant |
|------|-------|----------|
| Text | `1` | `MessageItemType.TEXT` |
| Image | `2` | `MessageItemType.IMAGE` |
| Voice | `3` | `MessageItemType.VOICE` |
| File | `4` | `MessageItemType.FILE` |
| Video | `5` | `MessageItemType.VIDEO` |

## Related

- [`@weixin-ts/cdn`](../cdn) — CDN upload/download with AES-ECB encryption

## License

MIT
