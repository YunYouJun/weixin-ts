# 示例

仓库内置了一组可以直接运行和修改的示例。

## 示例列表

| 示例 | 内容 | 命令 |
|------|------|------|
| [`basic`](https://github.com/YunYouJun/weixin-ts/tree/main/examples/basic) | 扫码登录、session 持久化、回声回复 | `pnpm example` |
| [`commands`](https://github.com/YunYouJun/weixin-ts/tree/main/examples/commands) | 简单命令处理 | `pnpm example:commands` |
| [`media`](https://github.com/YunYouJun/weixin-ts/tree/main/examples/media) | `sendFile()` 和 `sendImage()` | `pnpm example:media` |
| [`ai-chat`](https://github.com/YunYouJun/weixin-ts/tree/main/examples/ai-chat) | 接入 DeepSeek 的多轮对话 Bot | `pnpm example:ai-chat` |

## 从仓库根目录运行

```bash
git clone https://github.com/YunYouJun/weixin-ts.git
cd weixin-ts
pnpm install
pnpm example
```

运行其他示例：

```bash
pnpm example:commands
pnpm example:media
pnpm example:ai-chat
```

## 从示例目录运行

```bash
pnpm -C examples/basic start
```

监听模式：

```bash
pnpm -C examples/basic dev
```

## 登录方式

默认会在终端显示二维码。使用微信扫码，并在手机端确认登录。

如果已有 Bot Token，可以设置 `WEIXIN_BOT_TOKEN` 跳过扫码：

```bash
WEIXIN_BOT_TOKEN=your-token pnpm example
```

示例可能会保存 `.weixin-bot.session.json`，用于复用扫码后的会话。会话过期或想重新扫码时，删除该文件即可。

## AI 对话示例

`ai-chat` 需要 DeepSeek API Key：

```bash
cd examples/ai-chat
cp .env.example .env
# 编辑 .env，填写 DEEPSEEK_API_KEY
pnpm start
```

不要提交 `.env` 或 session 文件。
