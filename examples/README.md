# Examples

Runnable examples for `weixin-ts`.

## List

| Example | Description | Run from repo root |
|---------|-------------|--------------------|
| [`basic`](./basic) | Minimal echo bot with QR login and session persistence | `pnpm example` |
| [`commands`](./commands) | Command bot with `/help`, `/ping`, `/echo`, `/id` | `pnpm example:commands` |
| [`media`](./media) | Send files and images | `pnpm example:media` |
| [`ai-chat`](./ai-chat) | DeepSeek-powered chat bot with per-user context | `pnpm example:ai-chat` |

## Setup

```bash
pnpm install
```

Most examples can run directly and will ask you to scan a QR code:

```bash
pnpm example
```

You can also run an example from its own directory:

```bash
pnpm -C examples/basic start
```

## Environment variables

| Variable | Used by | Description |
|----------|---------|-------------|
| `WEIXIN_BOT_TOKEN` | all | Existing bot token. Skips QR login when set. |
| `WEIXIN_BASE_URL` | all | Custom WeChat API base URL. |
| `WEIXIN_IMAGE_URL` | `media` | Image URL for the image demo. |
| `DEEPSEEK_API_KEY` | `ai-chat` | Required for the AI chat example. |
| `DEEPSEEK_MODEL` | `ai-chat` | Model name. |
| `DEEPSEEK_MAX_HISTORY` | `ai-chat` | Max conversation history per user. |

## Session files

Examples may create `.weixin-bot.session.json` to reuse the scanned login session. Delete it if the session expires or you want to scan again.

Do not commit `.env` or session files.
