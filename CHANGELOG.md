# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-05-11

### Added

- Initial public release of `weixin-ts`.
- Added `@weixin-ts/bot`, a framework-agnostic WeChat Bot SDK for TypeScript.
- Added QR-code login with optional session persistence via `@weixin-ts/bot/node`.
- Added event-driven message polling with typed events and context token caching.
- Added text, image, video, file, and typing indicator helpers.
- Added low-level API exports for `getUpdates`, `sendMessage`, `sendTyping`, `getConfig`, and `getUploadUrl`.
- Added `@weixin-ts/cdn` for AES-128-ECB media upload/download with WebCrypto.
- Added runnable examples for basic echo, commands, media, and AI chat bots.
- Added VitePress documentation and TypeDoc-generated API reference.
- Added CI checks for linting, type checking, docs build, and multi-platform tests.

### Notes

- This project is an unofficial SDK and is not affiliated with or endorsed by Tencent or WeChat.
