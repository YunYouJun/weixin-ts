# Playground

Try the WeChat Bot SDK directly in your browser. The example below runs in a real Node.js environment powered by [StackBlitz WebContainers](https://stackblitz.com/).

::: tip
This is a **live editor** — you can modify the code and see changes in real time. The terminal on the right shows the bot output.
:::

## Echo Bot Example

<StackBlitzEmbed
  title="WeChat Echo Bot"
  repo="YunYouJun/weixin-ts/tree/main/examples/basic"
  file="src/index.ts"
  start-script="start"
  height="650px"
/>

## More Examples

- [`examples/basic`](https://github.com/YunYouJun/weixin-ts/tree/main/examples/basic) — Minimal echo bot with QR login
- [`examples/commands`](https://github.com/YunYouJun/weixin-ts/tree/main/examples/commands) — Command-based bot (`/help`, `/ping`, `/echo`, `/id`)
- [`examples/media`](https://github.com/YunYouJun/weixin-ts/tree/main/examples/media) — Media bot with `sendFile()` and `sendImage()`

## What's Happening

1. The code calls `bot.login()` to get a QR code URL
2. You scan the QR with WeChat to authenticate
3. Once confirmed, the bot starts long-polling for messages
4. Any text message you send gets echoed back with "Echo: " prefix

## Try It Yourself

Things you can try in the editor:

- Change the echo prefix from `"Echo: "` to something else
- Add image detection (check `MessageItemType.IMAGE`)
- Add a command system (e.g. `/help`, `/ping`)

## Run Locally

Prefer running locally? Just:

```bash
git clone https://github.com/YunYouJun/weixin-ts
cd weixin-ts
pnpm install
pnpm example
```
