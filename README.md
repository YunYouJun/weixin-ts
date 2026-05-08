# weixin-ts

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

Cross-platform, type-safe, zero-dependency WeChat Bot SDK for TypeScript.

跨平台、类型安全、零依赖的微信 Bot TypeScript SDK。

## 📚 Documentation | 文档

- English: https://weixin-ts.yunyoujun.cn
- 中文: https://weixin-ts.yunyoujun.cn/zh/
- Mirror: https://weixin-ts.pages.dev

## ✨ Features | 特性

- 🤖 **Bot SDK** — Event-driven bot with long-polling, message send/receive, typing indicators
- 🌍 **Cross-Platform** — Node.js, Bun, Deno, Browser (Web standard APIs only)
- 📱 **QR Login** — Built-in scan-to-login flow, no pre-existing token needed
- 🔒 **CDN Encryption** — AES-128-ECB media upload/download via WebCrypto
- 📝 **TypeScript First** — Full type safety with typed events and auto-generated API docs
- 🪶 **Zero Dependencies** — No runtime deps, pure Web APIs, tree-shakeable ESM

## 📦 Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@weixin-ts/bot`](./packages/bot) | [![bot version](https://img.shields.io/npm/v/@weixin-ts/bot?style=flat&colorA=080f12&colorB=07C160)](https://npmjs.com/package/@weixin-ts/bot) | Core Bot SDK — polling, messaging, events, login |
| [`@weixin-ts/cdn`](./packages/cdn) | [![cdn version](https://img.shields.io/npm/v/@weixin-ts/cdn?style=flat&colorA=080f12&colorB=07C160)](https://npmjs.com/package/@weixin-ts/cdn) | CDN upload/download with AES-ECB encryption |

## 🚀 Quick Start | 快速开始

```bash
pnpm add @weixin-ts/bot
```

```typescript
import { MessageItemType, WeixinBot } from '@weixin-ts/bot'

const bot = new WeixinBot({ session: '.weixin-bot.session.json' })

// QR scan login (or load saved session)
const result = await bot.login({
  onQrCode: url => console.log('Scan:', url),
  onScanned: () => console.log('Confirm in WeChat...'),
})
if (!result.success)
  throw new Error(result.message)

// Echo bot
bot.on('message', async (msg) => {
  const text = msg.item_list?.find(i => i.type === MessageItemType.TEXT)?.text_item?.text
  if (text)
    await bot.sendText({ to: msg.from_user_id!, text: `Echo: ${text}` })
})

await bot.start()
```

## 🌍 Platform Support

| Platform | Status |
|----------|--------|
| Node.js ≥18 | ✅ Full |
| Bun | ✅ Full |
| Deno | ✅ Full |
| Browser | ⚠️ Partial (no long-poll) |

## 📁 Examples

- [`examples/basic`](./examples/basic) — Minimal echo bot with QR login
- [`examples/commands`](./examples/commands) — Command-based bot (`/help`, `/ping`, `/echo`, `/id`)
- [`examples/media`](./examples/media) — Media bot with `sendFile()` and `sendImage()`

## [Sponsors](https://www.yunyoujun.cn/sponsors/)

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/YunYouJun/sponsors/public/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/YunYouJun/sponsors/public/sponsors.svg' alt='Sponsors'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © [YunYouJun](https://github.com/YunYouJun)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@weixin-ts/bot?style=flat&colorA=080f12&colorB=07C160
[npm-version-href]: https://npmjs.com/package/@weixin-ts/bot
[npm-downloads-src]: https://img.shields.io/npm/dm/@weixin-ts/bot?style=flat&colorA=080f12&colorB=07C160
[npm-downloads-href]: https://npmjs.com/package/@weixin-ts/bot
[license-src]: https://img.shields.io/github/license/YunYouJun/weixin-ts.svg?style=flat&colorA=080f12&colorB=07C160
[license-href]: https://github.com/YunYouJun/weixin-ts/blob/main/LICENSE
