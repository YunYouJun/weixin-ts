# @weixin-ts/example-commands

Command-based WeChat bot example.

微信命令式 Bot 示例。

## Run | 运行

```bash
pnpm start
```

Optional: skip QR login with an existing token.

```bash
WEIXIN_BOT_TOKEN=your-bot-token pnpm start
```

## Commands | 命令

| Command | Description |
|---------|-------------|
| `/help` | Show help message |
| `/ping` | Reply with `pong` |
| `/echo <text>` | Echo custom text |
| `/id` | Show current sender ID |

## Flow | 流程

```
pnpm start
  → Login with token, saved session, or QR scan
  → Send /help in WeChat
  → Bot replies with available commands
```
