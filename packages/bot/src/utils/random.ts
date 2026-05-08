/**
 * Cross-platform random utilities using WebCrypto API.
 *
 * @module
 */

/**
 * Generate cryptographically secure random bytes.
 * Uses `globalThis.crypto.getRandomValues` (works in Node.js 18+, Deno, Bun, browsers).
 */
export function randomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length)
  globalThis.crypto.getRandomValues(buf)
  return buf
}

/**
 * Generate a random hex string of the given byte length.
 */
export function randomHex(byteLength: number): string {
  const bytes = randomBytes(byteLength)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a unique ID with an optional prefix.
 *
 * @example
 * ```ts
 * generateId('weixin') // => 'weixin-a1b2c3d4e5f6'
 * ```
 */
export function generateId(prefix?: string): string {
  const id = randomHex(6)
  return prefix ? `${prefix}-${id}` : id
}

/**
 * Generate a random X-WECHAT-UIN header value.
 * Random uint32 → decimal string → base64.
 */
export function randomWechatUin(): string {
  const bytes = randomBytes(4)
  const view = new DataView(bytes.buffer)
  const uint32 = view.getUint32(0, false) // big-endian
  const str = String(uint32)
  return btoa(str)
}
