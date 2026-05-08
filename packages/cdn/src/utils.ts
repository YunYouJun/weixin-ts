/**
 * WebCrypto utility functions for the CDN package.
 *
 * @module
 */

/**
 * Compute MD5 hash of a buffer.
 * Uses WebCrypto `digest` API (available in Node.js 18+, browsers, Deno, Bun).
 *
 * Note: MD5 is used here only for file integrity checks (matching the Weixin protocol),
 * not for security purposes.
 *
 * @param data - Data to hash
 * @returns Hex-encoded MD5 string
 */
export async function md5Hex(data: Uint8Array | ArrayBuffer): Promise<string> {
  // WebCrypto doesn't support MD5 in all environments
  // Use a simple implementation for cross-platform compatibility
  const buffer = data instanceof Uint8Array ? data : new Uint8Array(data)
  return md5(buffer)
}

/**
 * Generate random bytes using WebCrypto.
 *
 * @param length - Number of random bytes
 * @returns Random bytes as Uint8Array
 */
export function randomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length)
  globalThis.crypto.getRandomValues(buf)
  return buf
}

/**
 * Convert a Uint8Array to a hex string.
 */
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Convert a hex string to Uint8Array.
 */
export function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

/**
 * Convert a Uint8Array to a base64 string.
 */
export function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

/**
 * Convert a base64 string to Uint8Array.
 */
export function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// ---------------------------------------------------------------------------
// Simple MD5 implementation (cross-platform, no dependencies)
// Based on RFC 1321. Used only for file integrity checks (protocol requirement).
// ---------------------------------------------------------------------------

function md5(data: Uint8Array): string {
  const K = [
    0xD76AA478,
    0xE8C7B756,
    0x242070DB,
    0xC1BDCEEE,
    0xF57C0FAF,
    0x4787C62A,
    0xA8304613,
    0xFD469501,
    0x698098D8,
    0x8B44F7AF,
    0xFFFF5BB1,
    0x895CD7BE,
    0x6B901122,
    0xFD987193,
    0xA679438E,
    0x49B40821,
    0xF61E2562,
    0xC040B340,
    0x265E5A51,
    0xE9B6C7AA,
    0xD62F105D,
    0x02441453,
    0xD8A1E681,
    0xE7D3FBC8,
    0x21E1CDE6,
    0xC33707D6,
    0xF4D50D87,
    0x455A14ED,
    0xA9E3E905,
    0xFCEFA3F8,
    0x676F02D9,
    0x8D2A4C8A,
    0xFFFA3942,
    0x8771F681,
    0x6D9D6122,
    0xFDE5380C,
    0xA4BEEA44,
    0x4BDECFA9,
    0xF6BB4B60,
    0xBEBFBC70,
    0x289B7EC6,
    0xEAA127FA,
    0xD4EF3085,
    0x04881D05,
    0xD9D4D039,
    0xE6DB99E5,
    0x1FA27CF8,
    0xC4AC5665,
    0xF4292244,
    0x432AFF97,
    0xAB9423A7,
    0xFC93A039,
    0x655B59C3,
    0x8F0CCC92,
    0xFFEFF47D,
    0x85845DD1,
    0x6FA87E4F,
    0xFE2CE6E0,
    0xA3014314,
    0x4E0811A1,
    0xF7537E82,
    0xBD3AF235,
    0x2AD7D2BB,
    0xEB86D391,
  ]

  const S = [
    7,
    12,
    17,
    22,
    7,
    12,
    17,
    22,
    7,
    12,
    17,
    22,
    7,
    12,
    17,
    22,
    5,
    9,
    14,
    20,
    5,
    9,
    14,
    20,
    5,
    9,
    14,
    20,
    5,
    9,
    14,
    20,
    4,
    11,
    16,
    23,
    4,
    11,
    16,
    23,
    4,
    11,
    16,
    23,
    4,
    11,
    16,
    23,
    6,
    10,
    15,
    21,
    6,
    10,
    15,
    21,
    6,
    10,
    15,
    21,
    6,
    10,
    15,
    21,
  ]

  // Pre-processing: pad message
  const msgLen = data.length
  const bitLen = msgLen * 8
  const padLen = ((56 - (msgLen + 1) % 64) + 64) % 64
  const padded = new Uint8Array(msgLen + 1 + padLen + 8)
  padded.set(data)
  padded[msgLen] = 0x80

  // Append original length in bits as 64-bit little-endian
  const view = new DataView(padded.buffer)
  view.setUint32(padded.length - 8, bitLen >>> 0, true)
  view.setUint32(padded.length - 4, Math.floor(bitLen / 0x100000000), true)

  // Initialize hash values
  let a0 = 0x67452301
  let b0 = 0xEFCDAB89
  let c0 = 0x98BADCFE
  let d0 = 0x10325476

  // Process each 64-byte block
  for (let offset = 0; offset < padded.length; offset += 64) {
    const M = new Uint32Array(16)
    for (let j = 0; j < 16; j++) {
      M[j] = view.getUint32(offset + j * 4, true)
    }

    let A = a0
    let B = b0
    let C = c0
    let D = d0

    for (let i = 0; i < 64; i++) {
      let F: number, g: number

      if (i < 16) {
        F = (B & C) | (~B & D)
        g = i
      }
      else if (i < 32) {
        F = (D & B) | (~D & C)
        g = (5 * i + 1) % 16
      }
      else if (i < 48) {
        F = B ^ C ^ D
        g = (3 * i + 5) % 16
      }
      else {
        F = C ^ (B | ~D)
        g = (7 * i) % 16
      }

      F = (F + A + K[i] + M[g]) >>> 0
      A = D
      D = C
      C = B
      B = (B + ((F << S[i]) | (F >>> (32 - S[i])))) >>> 0
    }

    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  // Output as hex string (little-endian)
  const result = new Uint8Array(16)
  const rv = new DataView(result.buffer)
  rv.setUint32(0, a0, true)
  rv.setUint32(4, b0, true)
  rv.setUint32(8, c0, true)
  rv.setUint32(12, d0, true)

  return toHex(result)
}
