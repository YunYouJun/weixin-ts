# 快速开始

## 平台支持

| 平台 | 支持 | 说明 |
|------|------|------|
| **Node.js** ≥18 | ✅ 完整 | 推荐生产环境使用 |
| **Bun** | ✅ 完整 | 原生 Web API 兼容 |
| **Deno** | ✅ 完整 | 使用 `--allow-net` 标志 |
| **浏览器** | ⚠️ 部分 | 单次 API 调用可行；长轮询因 CORS 限制不实用 |

SDK 仅使用 Web 标准 API（`fetch`、`crypto.subtle`、`TextEncoder`）— 无平台特定依赖。

## 安装

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

媒体上传/下载（图片、视频、文件）需要额外安装：

```bash
pnpm add @weixin-ts/cdn
```

## 快速开始：扫码登录 + Echo Bot

最简单的方式 — 无需预先获取 Token：

```ts
import { MessageItemType, WeixinBot } from '@weixin-ts/bot'
import { fileSession } from '@weixin-ts/bot/node'

const bot = new WeixinBot({
  // 文件 Session 持久化：首次扫码后保存，下次启动自动加载
  session: fileSession('.weixin-bot.session.json'),
})

// 登录（有 session 自动加载，否则扫码）
const result = await bot.login({
  onQrCode: url => console.log('📱 请扫码:', url),
  onScanned: () => console.log('👀 已扫码，请在微信中确认...'),
})
if (!result.success)
  throw new Error(result.message)

// Echo Bot
bot.on('message', async (msg) => {
  const text = msg.item_list?.find(i => i.type === MessageItemType.TEXT)?.text_item?.text
  if (text) {
    await bot.sendText({ to: msg.from_user_id!, text: `Echo: ${text}` })
  }
})

bot.on('error', console.error)

// 3. 开始轮询
bot.start()
```

## 使用已有 Token

如果已有 Bot Token：

```ts
import { WeixinBot } from '@weixin-ts/bot'

const bot = new WeixinBot({ token: process.env.WEIXIN_BOT_TOKEN })

bot.on('message', (msg) => { /* ... */ })
bot.start()
```

## 登录流程原理

```
┌──────────┐    GET /get_bot_qrcode     ┌──────────┐
│  你的    │ ──────────────────────────► │  微信    │
│  代码    │ ◄────────────────────────── │  服务端  │
│          │    { qrcode, qrcode_url }   │          │
│          │                             │          │
│  展示    │    用户用微信扫码            │          │
│  二维码  │                             │          │
│          │                             │          │
│          │    GET /get_qrcode_status   │          │
│          │ ──────────────────────────► │          │
│          │ ◄────────────────────────── │          │
│          │    { status: "confirmed",   │          │
│          │      bot_token: "..." }     │          │
└──────────┘                             └──────────┘
```

SDK 内部处理轮询循环。你只需要：
1. 调用 `bot.login({ onQrCode })`
2. 展示 `onQrCode` 回调中的 QR URL（终端、网页等你决定）
3. 等待返回的 `LoginResult`，它会在确认或超时后结束

## 发送媒体

```ts
// 发送图片
const img = await fetch('https://example.com/photo.jpg').then(r => r.arrayBuffer())
await bot.sendImage({ to: userId, file: new Uint8Array(img) })

// 发送文件（带说明文字）
await bot.sendFile({
  to: userId,
  file: pdfBuffer,
  fileName: 'report.pdf',
  text: '这是报告',
})
```

## 项目结构

```
@weixin-ts/bot          # 核心 SDK（API + 轮询 + 事件 + 登录）
@weixin-ts/cdn          # CDN 加密（AES-ECB 上传/下载）
```

## 下一步

- [配置](/zh/guide/configuration) — 自定义超时、URL、错误处理
- [API 文档](/api/) — TypeDoc 自动生成的完整文档
