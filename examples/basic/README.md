# @weixin-ts/example-basic

Minimal WeChat echo bot with QR scan login, session persistence, and optional environment token.

微信 Echo Bot 最小示例 — 支持扫码登录、Session 持久化、环境变量 Token + 自动回复。

## Run | 运行

```bash
pnpm start
```

Optional: skip QR login with an existing token.

可选：如果已有 Bot Token，可跳过扫码登录。

```bash
WEIXIN_BOT_TOKEN=your-bot-token pnpm start
```

Custom API base URL is also supported:

也可以自定义 API 基础 URL：

```bash
WEIXIN_BASE_URL=https://ilinkai.weixin.qq.com pnpm start
```

## What it does | 功能

1. Uses `WEIXIN_BOT_TOKEN` when provided | 设置 `WEIXIN_BOT_TOKEN` 时直接使用
2. Otherwise displays a QR code in the terminal | 否则在终端显示二维码
3. Saves the scanned token to `.weixin-bot.session.json` | 将扫码得到的 Token 保存到 `.weixin-bot.session.json`
4. Bot echoes back any text message | Bot 回复收到的文本消息

## Flow | 流程

```
pnpm start
  → Load WEIXIN_BOT_TOKEN or saved session
  → Otherwise display QR code → Scan with WeChat → Confirm
  → Bot connected, listening...
  → Send "hello" → Receive "Echo: hello"
```

## Documentation | 文档

- English: https://weixin-ts.yunyoujun.cn/guide/getting-started
- 中文: https://weixin-ts.yunyoujun.cn/zh/guide/getting-started
