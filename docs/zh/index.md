---
layout: home

hero:
  name: "weixin-ts"
  text: "微信 Bot SDK"
  tagline: 跨平台、类型安全、零依赖的微信 Bot TypeScript SDK
  image:
    src: /logo.svg
    alt: weixin-ts
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/YunYouJun/weixin-ts

features:
  - icon: 🤖
    title: Bot SDK
    details: 事件驱动的 Bot 客户端 — 长轮询收消息、发送文本/图片/视频/文件、输入状态
  - icon: 🌍
    title: 全平台
    details: Node.js、Bun、Deno、浏览器 — 仅使用 Web 标准 API（fetch、crypto.subtle）
  - icon: 📱
    title: 扫码登录
    details: 内置 QR 扫码登录流程 — 无需预先获取 Token
  - icon: 🔒
    title: CDN 加密
    details: AES-128-ECB 媒体上传/下载，使用 WebCrypto API 实现
  - icon: 📝
    title: TypeScript 优先
    details: 完整类型安全 + 类型化事件 + 自动生成 API 文档
  - icon: 🪶
    title: 零依赖
    details: 无运行时依赖 — 纯 Web API，支持 Tree-shaking 的 ESM
---

## 快速开始

> 免责声明：本项目是面向微信 iLink Bot API 的非官方 SDK，与腾讯或微信没有从属、背书或官方支持关系。

[![npm version](https://img.shields.io/npm/v/@weixin-ts/bot?style=flat&colorA=080f12&colorB=07C160)](https://npmjs.com/package/@weixin-ts/bot)
[![License](https://img.shields.io/github/license/YunYouJun/weixin-ts.svg?style=flat&colorA=080f12&colorB=07C160)](https://github.com/YunYouJun/weixin-ts/blob/main/LICENSE)

```bash
pnpm add @weixin-ts/bot
```

```typescript
import { MessageItemType, WeixinBot } from '@weixin-ts/bot'
import { fileSession } from '@weixin-ts/bot/node'

const bot = new WeixinBot({ session: fileSession('.weixin-bot.session.json') })

// 扫码登录（或加载已保存的 session）
const result = await bot.login({
  onQrCode: url => console.log('请扫码:', url),
  onScanned: () => console.log('请在微信中确认...'),
})
if (!result.success)
  throw new Error(result.message)

// Echo Bot
bot.on('message', async (msg) => {
  const text = msg.item_list?.find(i => i.type === MessageItemType.TEXT)?.text_item?.text
  if (text)
    await bot.sendText({ to: msg.from_user_id!, text: `Echo: ${text}` })
})

bot.start()
```

## 包一览

| 包 | 说明 |
|---|------|
| [`@weixin-ts/bot`](/api/) | 核心 Bot SDK — 轮询、消息、事件、登录 |
| [`@weixin-ts/cdn`](/api/) | CDN 上传/下载 + AES-ECB 加密 |

## 项目参考

- [Tencent/openclaw-weixin](https://github.com/Tencent/openclaw-weixin)
