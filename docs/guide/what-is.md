# What is weixin-ts?

weixin-ts is a framework-agnostic WeChat Bot SDK for TypeScript, designed for building WeChat bots that run anywhere — Node.js, Deno, Bun, and browsers.

## Features

### 🤖 Bot SDK (`@weixin-ts/bot`)

High-level event-driven bot client:
- Long-poll message receiving
- Text, image, video, and file sending
- Typing indicators
- Automatic context token management

### 🔒 CDN Encryption (`@weixin-ts/cdn`)

Cross-platform WeChat CDN operations:
- AES-128-ECB encryption/decryption via WebCrypto
- Full upload pipeline (hash → encrypt → CDN)
- Download and decrypt media files

### 🌍 Cross-Platform

Built on Web standard APIs only:
- `fetch` for HTTP
- `crypto.subtle` for encryption
- No `node:` dependencies in core

### 📝 TypeScript First

Full type safety with:
- Typed event emitter (`bot.on('message', msg => ...)`)
- Protocol types for all API messages
- TypeDoc-generated API reference

### 📦 Zero Dependencies

No runtime dependencies — only Web APIs used:
- `fetch`, `crypto.subtle`, `TextEncoder`
- Works in Node.js 18+, Deno, Bun, modern browsers

## Packages

| Package | Description |
|---------|-------------|
| `@weixin-ts/bot` | Core bot SDK (polling, messaging, events) |
| `@weixin-ts/cdn` | CDN upload/download with AES-ECB encryption |

## Quick Example

```ts
import { WeixinBot } from '@weixin-ts/bot'

const bot = new WeixinBot({ token: 'YOUR_TOKEN' })

bot.on('message', (msg) => {
  const text = msg.item_list?.find(i => i.type === 1)?.text_item?.text
  if (text)
    bot.sendText({ to: msg.from_user_id!, text: `Echo: ${text}` })
})

await bot.start()
```

## Next Steps

- [Getting Started](/guide/getting-started) — Install and set up
- [Examples](/guide/examples) — Run and explore demos
- [Configuration](/guide/configuration) — Customize behavior
- [Design Principles](/guide/design-principles) — Why it's built this way
- [API Reference](/api/) — Full API documentation
