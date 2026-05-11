# Examples

The repository includes small examples that you can run and modify.

## Available examples

| Example | What it shows | Command |
|---------|---------------|---------|
| [`basic`](https://github.com/YunYouJun/weixin-ts/tree/main/examples/basic) | QR login, session persistence, echo replies | `pnpm example` |
| [`commands`](https://github.com/YunYouJun/weixin-ts/tree/main/examples/commands) | Simple command handling | `pnpm example:commands` |
| [`media`](https://github.com/YunYouJun/weixin-ts/tree/main/examples/media) | `sendFile()` and `sendImage()` | `pnpm example:media` |
| [`ai-chat`](https://github.com/YunYouJun/weixin-ts/tree/main/examples/ai-chat) | DeepSeek chat bot with per-user context | `pnpm example:ai-chat` |

## Run from the repository root

```bash
git clone https://github.com/YunYouJun/weixin-ts.git
cd weixin-ts
pnpm install
pnpm example
```

Use another script to run a different example:

```bash
pnpm example:commands
pnpm example:media
pnpm example:ai-chat
```

## Run from an example directory

```bash
pnpm -C examples/basic start
```

For watch mode:

```bash
pnpm -C examples/basic dev
```

## Login

By default, examples show a QR code in the terminal. Scan it with WeChat and confirm login.

If you already have a bot token, set `WEIXIN_BOT_TOKEN` to skip QR login:

```bash
WEIXIN_BOT_TOKEN=your-token pnpm example
```

Examples may save `.weixin-bot.session.json` to reuse the session. Delete it if the session expires or you want to scan again.

## AI chat setup

The AI example needs a DeepSeek API key:

```bash
cd examples/ai-chat
cp .env.example .env
# edit .env and set DEEPSEEK_API_KEY
pnpm start
```

Do not commit `.env` or session files.
