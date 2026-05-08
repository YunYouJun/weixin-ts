---
layout: home

hero:
  name: "weixin-ts"
  text: "WeChat Bot SDK"
  tagline: Cross-platform, type-safe, zero-dependency WeChat Bot SDK for TypeScript
  image:
    src: /logo.svg
    alt: weixin-ts
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/YunYouJun/weixin-ts

features:
  - icon: 🤖
    title: Bot SDK
    details: Event-driven bot with long-polling, message send/receive, typing indicators
  - icon: 🌍
    title: Cross-Platform
    details: Node.js, Bun, Deno, Browser — uses only Web standard APIs (fetch, crypto.subtle)
  - icon: 📱
    title: QR Login
    details: Built-in QR scan login flow — no pre-existing token needed
  - icon: 🔒
    title: CDN Encryption
    details: AES-128-ECB media upload/download via WebCrypto API
  - icon: 📝
    title: TypeScript First
    details: Full type safety with typed events and auto-generated API docs
  - icon: 🪶
    title: Zero Dependencies
    details: No runtime dependencies — pure Web APIs, tree-shakeable ESM
---

## Quick Start

[![npm version](https://img.shields.io/npm/v/@weixin-ts/bot?style=flat&colorA=080f12&colorB=07C160)](https://npmjs.com/package/@weixin-ts/bot)
[![License](https://img.shields.io/github/license/YunYouJun/weixin-ts.svg?style=flat&colorA=080f12&colorB=07C160)](https://github.com/YunYouJun/weixin-ts/blob/main/LICENSE)

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

## Packages

| Package | Description |
|---------|-------------|
| [`@weixin-ts/bot`](/api/) | Core bot SDK — polling, messaging, events, login |
| [`@weixin-ts/cdn`](/api/) | CDN upload/download with AES-ECB encryption |
