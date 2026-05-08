# @weixin-ts/example-media

WeChat bot media sending example with `sendFile()` and `sendImage()`.

微信 Bot 媒体发送示例，演示 `sendFile()` 与 `sendImage()`。

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
| `/media-help` | Show help message |
| `/file` | Send a generated text file |
| `/image <url>` | Download an image URL and send it back |

You can set `WEIXIN_IMAGE_URL` as the default image URL for `/image`.

可以通过 `WEIXIN_IMAGE_URL` 为 `/image` 设置默认图片 URL。

## Flow | 流程

```
pnpm start
  → Login with token, saved session, or QR scan
  → Send /file or /image <url> in WeChat
  → Bot uploads media via CDN and sends it back
```
