# 配置

## WeixinBot 选项

```ts
import { WeixinBot } from '@weixin-ts/bot'

const bot = new WeixinBot({
  // Bot Token（可通过 login() 扫码获取）
  token: 'YOUR_TOKEN',

  // API 基础 URL（默认值通常无需修改）
  baseUrl: 'https://ilinkai.weixin.qq.com',

  // CDN 基础 URL（媒体上传/下载）
  cdnBaseUrl: 'https://novac2c.cdn.weixin.qq.com/c2c',

  // iLink App ID
  appId: 'bot',

  // 客户端版本号
  version: '1.0.0',

  // 长轮询超时（毫秒）
  longPollTimeoutMs: 35000,

  // 普通 API 请求超时（毫秒）
  apiTimeoutMs: 15000,
})
```

## 选项说明

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `token` | `string` | — | Bot Token（可通过 `login()` 获取） |
| `baseUrl` | `string` | `https://ilinkai.weixin.qq.com` | API 基础 URL |
| `cdnBaseUrl` | `string` | `https://novac2c.cdn.weixin.qq.com/c2c` | CDN 基础 URL |
| `appId` | `string` | `'bot'` | iLink App ID |
| `version` | `string` | SDK 版本号 | 客户端版本 |
| `longPollTimeoutMs` | `number` | `35000` | 长轮询超时 |
| `apiTimeoutMs` | `number` | `15000` | 普通请求超时 |
| `session` | `SessionStorage` | — | Session 存储后端。文件存储可从 `@weixin-ts/bot/node` 引入 `fileSession(path)`。 |

## 登录回调

```ts
const result = await bot.login({
  // 需要扫码时触发；你可以在终端、网页等任意位置展示该 URL
  onQrCode: url => console.log('请扫码:', url),

  // 用户已扫码，等待微信内确认
  onScanned: () => console.log('请在微信中确认...'),

  // 二维码过期并自动刷新后触发
  onQrRefresh: url => console.log('二维码已刷新:', url),
})

if (!result.success)
  throw new Error(result.message)
```

如果需要控制登录超时、轮询超时或 Bot 类型，可使用底层 `requestQRCode()`。

## 事件列表

| 事件 | 参数 | 说明 |
|------|------|------|
| `message` | `WeixinMessage` | 收到新消息 |
| `error` | `Error` | 轮询出错（非致命，会自动重试） |
| `connected` | — | 轮询已开始 |
| `disconnected` | — | 轮询已停止 |
| `session:expired` | — | Session 过期（errcode -14）；配置 `session` 时会自动删除本地 session 文件 |

## 消息类型

| 类型 | 值 | 常量 |
|------|----|------|
| 文本 | `1` | `MessageItemType.TEXT` |
| 图片 | `2` | `MessageItemType.IMAGE` |
| 语音 | `3` | `MessageItemType.VOICE` |
| 文件 | `4` | `MessageItemType.FILE` |
| 视频 | `5` | `MessageItemType.VIDEO` |
