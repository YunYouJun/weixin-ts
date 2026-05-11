# 什么是 weixin-ts？

weixin-ts 是一个框架无关的微信 Bot SDK，基于 TypeScript 构建，可以在任何平台运行 — Node.js、Deno、Bun 和浏览器。

## 平台支持

| 平台 | 支持 | 说明 |
|------|------|------|
| **Node.js** ≥18 | ✅ 完整 | 推荐生产环境使用 |
| **Bun** | ✅ 完整 | 原生 Web API 兼容 |
| **Deno** | ✅ 完整 | 需要 `--allow-net` 标志 |
| **浏览器** | ⚠️ 部分 | API 调用可用，长轮询因 CORS 不实用 |

## 特性

### 🤖 Bot SDK (`@weixin-ts/bot`)

高层事件驱动的 Bot 客户端：
- 长轮询接收消息
- 发送文本、图片、视频、文件
- 输入状态指示
- 自动管理 context token

### 📱 扫码登录

内置 QR 扫码登录流程：
- SDK 获取二维码 URL
- 你自己决定如何展示（终端、网页等）
- SDK 轮询等待确认
- 自动配置 Bot Token

### 🔒 CDN 加密 (`@weixin-ts/cdn`)

跨平台微信 CDN 操作：
- AES-128-ECB 加解密（WebCrypto）
- 完整上传流水线（hash → 加密 → CDN）
- 下载 + 解密媒体文件

### 🪶 零依赖

不依赖任何第三方包：
- `fetch` 做 HTTP 请求
- `crypto.subtle` 做加密
- `TextEncoder` 做编码
- 在所有支持 Web 标准的运行时中工作

## 包结构

| 包 | 说明 |
|---|------|
| `@weixin-ts/bot` | 核心 Bot SDK（轮询、消息、事件、登录） |
| `@weixin-ts/cdn` | CDN 上传/下载 + AES-ECB 加密 |

## 快速示例

```ts
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

// 监听消息
bot.on('message', (msg) => {
  const text = msg.item_list?.find(i => i.type === MessageItemType.TEXT)?.text_item?.text
  if (text)
    bot.sendText({ to: msg.from_user_id!, text: `Echo: ${text}` })
})

bot.start()
```

## 下一步

- [快速开始](/zh/guide/getting-started) — 安装和运行
- [示例](/zh/guide/examples) — 运行和探索 Demo
- [配置](/zh/guide/configuration) — 自定义行为
- [设计原则](/zh/guide/design-principles) — 为什么这样设计
- [API 文档](/api/) — 完整 TypeDoc 文档
