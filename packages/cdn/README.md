# @weixin-ts/cdn

WeChat CDN upload/download with AES-128-ECB encryption. Cross-platform using WebCrypto API.

## Features

- **AES-128-ECB**: Encrypt/decrypt using WebCrypto (no `node:crypto` dependency)
- **Upload pipeline**: Full flow from file → hash → encrypt → CDN upload
- **Download + decrypt**: Fetch and decrypt media from WeChat CDN
- **Cross-platform**: Works in Node.js 18+, Deno, Bun, and browsers
- **Zero dependencies**: Pure Web standard APIs

## Install

```bash
pnpm add @weixin-ts/cdn
```

## Usage

### Upload Media

```ts
import { uploadMedia } from '@weixin-ts/cdn'

const result = await uploadMedia({
  file: imageBuffer, // Uint8Array or ArrayBuffer
  toUserId: 'recipient_user_id',
  mediaType: 'image', // 'image' | 'video' | 'file' | 'voice'
  apiOptions: {
    baseUrl: 'https://ilinkai.weixin.qq.com',
    token: 'YOUR_BOT_TOKEN',
  },
  cdnBaseUrl: 'https://novac2c.cdn.weixin.qq.com/c2c',
})

// Use result.downloadParam in message construction
console.log(result.filekey, result.aesKeyHex)
```

### Download Media

```ts
import { downloadMedia } from '@weixin-ts/cdn'

// From an incoming message
const decrypted = await downloadMedia({
  media: message.item_list[0].image_item.media,
  aesKeyHex: message.item_list[0].image_item.aeskey,
})
```

### Low-level AES-ECB

```ts
import { decryptAesEcb, encryptAesEcb } from '@weixin-ts/cdn'

const key = crypto.getRandomValues(new Uint8Array(16))
const encrypted = await encryptAesEcb(data, key)
const decrypted = await decryptAesEcb(encrypted, key)
```

## API

### `uploadMedia(options)` → `UploadedMedia`

Full upload pipeline: hash → encrypt → request URL → upload to CDN.

### `downloadMedia(options)` → `Uint8Array`

Download and decrypt a media file from CDN.

### `encryptAesEcb(plaintext, key)` → `Uint8Array`

Encrypt data using AES-128-ECB with PKCS7 padding.

### `decryptAesEcb(ciphertext, key)` → `Uint8Array`

Decrypt AES-128-ECB encrypted data, removing PKCS7 padding.

### Utilities

- `aesEcbPaddedSize(rawSize)` — Calculate ciphertext size
- `md5Hex(data)` — Compute MD5 hash (hex string)
- `randomBytes(length)` — Cryptographic random bytes
- `toHex(bytes)` / `fromHex(hex)` — Hex conversion
- `toBase64(bytes)` / `fromBase64(str)` — Base64 conversion

## Related Packages

- [`@weixin-ts/bot`](../bot) — Main bot SDK

## License

MIT
