# weixin-ts

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

[English](./README.md) | **简体中文**

跨平台、类型安全、零依赖的微信 Bot TypeScript SDK。

## 📚 文档

- 英文: https://weixin-ts.yunyoujun.cn
- 中文: https://weixin-ts.yunyoujun.cn/zh/
- API 文档: https://weixin-ts.yunyoujun.cn/api/
- 示例: [examples](./examples)
- 设计原则: https://weixin-ts.yunyoujun.cn/zh/guide/design-principles
- 镜像: https://weixin-ts.pages.dev

## ✨ 特性

- 🤖 **Bot SDK** — 事件驱动的机器人，支持长轮询、消息收发、输入状态指示
- 🌍 **跨平台** — 支持 Node.js、Bun、Deno、浏览器（仅使用 Web 标准 API）
- 📱 **扫码登录** — 内置扫码登录流程，无需预设令牌
- 🔒 **CDN 加密** — 基于 WebCrypto 的 AES-128-ECB 媒体上传/下载
- 📝 **TypeScript 优先** — 完整的类型安全，支持类型化事件和自动生成 API 文档
- 🪶 **零依赖** — 无运行时依赖，纯 Web API，可 tree-shake 的 ESM

## 📦 包

| 包名 | 版本 | 描述 |
|------|------|------|
| [`@weixin-ts/bot`](./packages/bot) | [![bot version](https://img.shields.io/npm/v/@weixin-ts/bot?style=flat&colorA=080f12&colorB=07C160)](https://npmjs.com/package/@weixin-ts/bot) | 核心 Bot SDK — 轮询、消息、事件、登录 |
| [`@weixin-ts/cdn`](./packages/cdn) | [![cdn version](https://img.shields.io/npm/v/@weixin-ts/cdn?style=flat&colorA=080f12&colorB=07C160)](https://npmjs.com/package/@weixin-ts/cdn) | CDN 上传/下载，支持 AES-ECB 加密 |

## 🚀 快速开始

```bash
pnpm add @weixin-ts/bot
```

```typescript
import { MessageItemType, WeixinBot } from '@weixin-ts/bot'
import { fileSession } from '@weixin-ts/bot/node'

const bot = new WeixinBot({ session: fileSession('.weixin-bot.session.json') })

// 扫码登录（或加载已保存的会话）
const result = await bot.login({
  onQrCode: url => console.log('请扫码:', url),
  onScanned: () => console.log('请在微信中确认...'),
})
if (!result.success)
  throw new Error(result.message)

// 回声机器人
bot.on('message', async (msg) => {
  const text = msg.item_list?.find(i => i.type === MessageItemType.TEXT)?.text_item?.text
  if (text)
    await bot.sendText({ to: msg.from_user_id!, text: `回声: ${text}` })
})

await bot.start()
```

## 🌍 平台支持

| 平台 | 状态 |
|------|------|
| Node.js ≥18 | ✅ 完整支持 |
| Bun | ✅ 完整支持 |
| Deno | ✅ 完整支持 |
| 浏览器 | ⚠️ 部分支持（不支持长轮询） |

## 📁 示例

- [`examples/basic`](./examples/basic) — 最小化回声机器人，含扫码登录
- [`examples/commands`](./examples/commands) — 命令式机器人（`/help`、`/ping`、`/echo`、`/id`）
- [`examples/media`](./examples/media) — 媒体机器人，使用 `sendFile()` 和 `sendImage()`
- [`examples/ai-chat`](./examples/ai-chat) — 接入 DeepSeek 的多轮对话 Bot

运行方式见 [examples](./examples)。

## [赞助者](https://www.yunyoujun.cn/sponsors/)

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/YunYouJun/sponsors/public/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/YunYouJun/sponsors/public/sponsors.svg' alt='赞助者'/>
  </a>
</p>

## 许可证

[MIT](./LICENSE) 许可证 © [云游君](https://github.com/YunYouJun)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@weixin-ts/bot?style=flat&colorA=080f12&colorB=07C160
[npm-version-href]: https://npmjs.com/package/@weixin-ts/bot
[npm-downloads-src]: https://img.shields.io/npm/dm/@weixin-ts/bot?style=flat&colorA=080f12&colorB=07C160
[npm-downloads-href]: https://npmjs.com/package/@weixin-ts/bot
[license-src]: https://img.shields.io/github/license/YunYouJun/weixin-ts.svg?style=flat&colorA=080f12&colorB=07C160
[license-href]: https://github.com/YunYouJun/weixin-ts/blob/main/LICENSE
