# CLAUDE.md

## Project Overview

`weixin-ts` is a TypeScript monorepo for a cross-platform, type-safe, zero-runtime-dependency WeChat Bot SDK.

- **Packages**:
  - `@weixin-ts/bot`: high-level Bot SDK, QR login, long-polling, typed events, message sending, and Node.js session helpers.
  - `@weixin-ts/cdn`: WeChat CDN upload/download helpers with AES-128-ECB encryption via WebCrypto.
- **Runtime targets**: Node.js 18+, Bun, Deno, and browser-compatible API helpers.
- **Architecture**: pnpm workspaces with catalog dependencies.
- **Docs**: VitePress + TypeDoc-generated API docs.
- **Build**: unbuild.
- **Test**: vitest.
- **Lint**: @antfu/eslint-config.

## Commands

```bash
pnpm build          # Build all packages
pnpm dev            # Dev mode (unbuild --stub)
pnpm test           # Run tests
pnpm lint           # Lint (eslint --cache)
pnpm typecheck      # Type check (tsc --noEmit)
pnpm docs:dev       # Dev documentation site
pnpm docs:build     # Build documentation (typedoc + vitepress)
pnpm release        # Bump versions and create release tag
```

## Conventions

- Use `catalog:` in `package.json` for shared dependency versions defined in `pnpm-workspace.yaml`.
- Use `@antfu/ni` commands (`nr`, `nci`) in scripts and CI.
- ESM only (`"type": "module"`).
- Keep the public SDK runtime dependency-free when possible.
- Prefer Web standard APIs (`fetch`, `crypto.subtle`, `TextEncoder`, `AbortController`) in package source.
- Keep Node-specific helpers isolated in `@weixin-ts/bot/node`.
- Strict TypeScript; public APIs should have exported types and JSDoc.
- Do not commit `.env` files or `*.session.json` files.

## Package Notes

### `@weixin-ts/bot`

- Main entry: `packages/bot/src/index.ts`.
- Node-only entry: `packages/bot/src/node.ts`.
- Core class: `packages/bot/src/bot.ts`.
- Login/session modules: `packages/bot/src/auth/`.
- Long-polling loop: `packages/bot/src/polling/poller.ts`.
- Low-level API modules: `packages/bot/src/api/`.

### `@weixin-ts/cdn`

- Main entry: `packages/cdn/src/index.ts`.
- AES helpers: `packages/cdn/src/aes-ecb.ts`.
- Upload/download flows: `packages/cdn/src/upload.ts` and `packages/cdn/src/download.ts`.

## Release Checklist

Before publishing:

1. Update package versions and `SDK_VERSION` consistently.
2. Update `CHANGELOG.md`.
3. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm docs:build`.
4. Verify `pnpm publish -r --dry-run` output.
5. Ensure no `node_modules`, `.env`, `*.session.json`, or generated archives are tracked.
