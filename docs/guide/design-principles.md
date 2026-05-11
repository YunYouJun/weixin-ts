# Design Principles

`weixin-ts` is designed to stay small, typed, and portable.

## TypeScript first

Public APIs are typed from the start. Events, messages, login results, and request payloads should expose mistakes at compile time instead of runtime.

API comments are also used by TypeDoc, so types and documentation stay close to the implementation.

## Zero runtime dependencies

Core packages avoid runtime dependencies. This keeps installs small, reduces supply-chain risk, and makes the SDK easier to run in different environments.

## Web standards over platform APIs

The SDK prefers standard APIs such as `fetch`, `crypto.subtle`, `Blob`, `FormData`, and `TextEncoder`.

This makes the same code work across Node.js, Bun, Deno, browsers, and edge runtimes where possible.

## Composable packages

Packages should do one thing well:

- `@weixin-ts/bot` handles login, polling, events, and messages.
- `@weixin-ts/cdn` handles media upload/download and encryption.

Users can install only what they need.

## Event-driven bot logic

Bot applications are easier to grow when they start from events:

```ts
bot.on('message', async (msg) => {
  // handle message
})
```

A simple echo bot can later become a command bot, media bot, or AI bot without changing the core shape.

## Explicit session lifecycle

Login state should be visible and controllable. The SDK supports QR login, existing tokens, and session files, but does not hide when a session expires or needs to be refreshed.

## Thin abstraction

`weixin-ts` provides convenient helpers for common bot tasks while keeping low-level APIs accessible when users need more control.
