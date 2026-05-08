# Getting Started

## Platform Support

| Platform | Support | Notes |
|----------|---------|-------|
| **Node.js** ≥18 | ✅ Full | Recommended for production bots |
| **Bun** | ✅ Full | Native Web API compatibility |
| **Deno** | ✅ Full | Use `--allow-net` flag |
| **Browser** | ⚠️ Partial | Single API calls work; long-polling impractical due to CORS |

The SDK uses only Web standard APIs (`fetch`, `crypto.subtle`, `TextEncoder`) — no platform-specific dependencies.

## Installation

::: code-group

```bash [pnpm]
pnpm add @weixin-ts/bot
```

```bash [npm]
npm install @weixin-ts/bot
```

```bash [bun]
bun add @weixin-ts/bot
```

```bash [deno]
deno add npm:@weixin-ts/bot
```

:::

For media upload/download (images, videos, files):

```bash
pnpm add @weixin-ts/cdn
```

## Quick Start: QR Login + Echo Bot

The simplest way to get a bot running — no pre-existing token needed:

```ts
import { MessageItemType, WeixinBot } from '@weixin-ts/bot'

const bot = new WeixinBot({
  // Session persistence: auto-save token, skip QR on next run
  session: '.weixin-bot.session.json',
})

// Login (loads saved session or triggers QR scan)
const result = await bot.login({
  onQrCode: url => console.log('📱 Scan:', url),
  onScanned: () => console.log('👀 Confirm in WeChat...'),
})
if (!result.success)
  throw new Error(result.message)

// Echo bot
bot.on('message', async (msg) => {
  const text = msg.item_list?.find(i => i.type === MessageItemType.TEXT)?.text_item?.text
  if (text) {
    await bot.sendText({ to: msg.from_user_id!, text: `Echo: ${text}` })
  }
})

bot.on('error', console.error)

// 3. Start polling
await bot.start()
```

## Quick Start: With Existing Token

If you already have a bot token:

```ts
import { WeixinBot } from '@weixin-ts/bot'

const bot = new WeixinBot({ token: process.env.WEIXIN_BOT_TOKEN })

bot.on('message', (msg) => { /* ... */ })
await bot.start()
```

## How Login Works

```
┌──────────┐    GET /get_bot_qrcode     ┌──────────┐
│  Your    │ ──────────────────────────► │  WeChat  │
│  Code    │ ◄────────────────────────── │  Server  │
│          │    { qrcode, qrcode_url }   │          │
│          │                             │          │
│  Display │    User scans QR            │          │
│  QR code │    with WeChat app          │          │
│          │                             │          │
│          │    GET /get_qrcode_status   │          │
│          │ ──────────────────────────► │          │
│          │ ◄────────────────────────── │          │
│          │    { status: "confirmed",   │          │
│          │      bot_token: "..." }     │          │
└──────────┘                             └──────────┘
```

The SDK handles the polling loop internally. You just:
1. Call `bot.login({ onQrCode })`
2. Display the QR URL from `onQrCode` however you want (terminal, web page, etc.)
3. Await the returned `LoginResult`, which resolves after confirmation or timeout

## Sending Media

```ts
// Send an image
const img = await fetch('https://example.com/photo.jpg').then(r => r.arrayBuffer())
await bot.sendImage({ to: userId, file: new Uint8Array(img) })

// Send a file with caption
await bot.sendFile({
  to: userId,
  file: pdfBuffer,
  fileName: 'report.pdf',
  text: 'Here is the report',
})
```

## Project Structure

```
@weixin-ts/bot          # Core SDK (API + polling + events + login)
@weixin-ts/cdn          # CDN encryption (AES-ECB upload/download)
```

## Next Steps

- [Configuration](/guide/configuration) — Customize timeouts, URLs, error handling
- [API Reference](/api/) — Full TypeDoc-generated documentation
