# 设计原则

`weixin-ts` 的目标是保持小巧、类型安全、跨平台。

## TypeScript 优先

公共 API 从一开始就围绕类型设计。事件、消息、登录结果、请求参数都应尽量在编译期暴露问题。

API 注释也会用于 TypeDoc，因此类型和文档尽量贴近实现。

## 零运行时依赖

核心包不引入运行时依赖。这样可以减少安装体积、降低供应链风险，也更容易在不同运行时中使用。

## 优先使用 Web 标准

SDK 优先使用 `fetch`、`crypto.subtle`、`Blob`、`FormData`、`TextEncoder` 等标准 API。

这让同一套代码可以尽量运行在 Node.js、Bun、Deno、浏览器和 Edge Runtime 中。

## 包职责清晰

每个包只做一类事情：

- `@weixin-ts/bot` 负责登录、轮询、事件和消息。
- `@weixin-ts/cdn` 负责媒体上传/下载与加密。

用户可以只安装自己需要的部分。

## 事件驱动的 Bot 逻辑

Bot 应用适合从事件开始组织：

```ts
bot.on('message', async (msg) => {
  // 处理消息
})
```

一个简单的回声 Bot，可以自然演进为命令 Bot、媒体 Bot 或 AI Bot。

## 明确的 session 生命周期

登录状态应当可见、可控。SDK 支持扫码登录、已有 Token 和 session 文件，但不会隐藏 session 过期或需要重新登录这类状态。

## 薄封装

`weixin-ts` 会封装常见 Bot 场景，同时尽量保留底层 API 出口，方便高级用户控制请求细节。
