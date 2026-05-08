# 在线演示

在浏览器中直接体验微信 Bot SDK。以下示例在 [StackBlitz WebContainers](https://stackblitz.com/) 提供的真实 Node.js 环境中运行。

::: tip
这是一个**在线编辑器** — 你可以修改代码并实时查看效果。右侧终端显示 Bot 输出。
:::

## Echo Bot 示例

<StackBlitzEmbed
  title="微信 Echo Bot"
  repo="YunYouJun/weixin-ts/tree/main/examples/basic"
  file="src/index.ts"
  start-script="start"
  height="650px"
/>

## 更多示例

- [`examples/basic`](https://github.com/YunYouJun/weixin-ts/tree/main/examples/basic) — 最小 Echo Bot + 扫码登录
- [`examples/commands`](https://github.com/YunYouJun/weixin-ts/tree/main/examples/commands) — 命令式 Bot（`/help`、`/ping`、`/echo`、`/id`）
- [`examples/media`](https://github.com/YunYouJun/weixin-ts/tree/main/examples/media) — 媒体 Bot，演示 `sendFile()` 与 `sendImage()`

## 运行流程

1. 代码调用 `bot.login()` 获取二维码 URL
2. 用微信扫码认证
3. 确认后 Bot 开始长轮询接收消息
4. 你发送的任何文本消息会被回复 "Echo: " 前缀

## 动手试试

在编辑器中你可以尝试：

- 修改 echo 前缀
- 添加图片检测（检查 `MessageItemType.IMAGE`）
- 添加命令系统（如 `/help`、`/ping`）

## 本地运行

更喜欢本地运行？只需：

```bash
git clone https://github.com/YunYouJun/weixin-ts
cd weixin-ts
pnpm install
pnpm example
```
