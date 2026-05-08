/**
 * AES-128-ECB encryption and decryption using WebCrypto API.
 *
 * WebCrypto does not natively support ECB mode. We simulate ECB by
 * processing each 16-byte block independently using AES-CBC with a zero IV.
 * A single block encrypted with CBC and zero IV is identical to ECB.
 *
 * @module
 */

const BLOCK_SIZE = 16

/**
 * Calculate the padded file size after AES-128-ECB encryption with PKCS7 padding.
 *
 * @param rawSize - Original plaintext size in bytes
 * @returns Ciphertext size (always a multiple of 16)
 */
export function aesEcbPaddedSize(rawSize: number): number {
  // PKCS7: always adds at least 1 byte, up to 16 bytes
  return rawSize + (BLOCK_SIZE - (rawSize % BLOCK_SIZE))
}

/**
 * Apply PKCS7 padding to a buffer.
 *
 * @param data - Input data
 * @returns Padded data (length is multiple of 16)
 */
export function pkcs7Pad(data: Uint8Array): Uint8Array {
  const padLen = BLOCK_SIZE - (data.length % BLOCK_SIZE)
  const padded = new Uint8Array(data.length + padLen)
  padded.set(data)
  padded.fill(padLen, data.length)
  return padded
}

/**
 * Remove PKCS7 padding from a buffer.
 *
 * @param data - Padded data
 * @returns Unpadded data
 * @throws Error if padding is invalid
 */
export function pkcs7Unpad(data: Uint8Array): Uint8Array {
  if (data.length === 0 || data.length % BLOCK_SIZE !== 0) {
    throw new Error('Invalid PKCS7 padded data: length must be a positive multiple of 16')
  }
  const padLen = data[data.length - 1]
  if (padLen === 0 || padLen > BLOCK_SIZE) {
    throw new Error(`Invalid PKCS7 padding value: ${padLen}`)
  }
  // Validate all padding bytes
  for (let i = data.length - padLen; i < data.length; i++) {
    if (data[i] !== padLen) {
      throw new Error('Invalid PKCS7 padding: inconsistent padding bytes')
    }
  }
  return data.slice(0, data.length - padLen)
}

/**
 * Import a raw AES key for use with WebCrypto.
 *
 * @param key - 16-byte raw AES key
 * @returns A CryptoKey suitable for AES-CBC operations
 */
async function importAesKey(key: Uint8Array): Promise<CryptoKey> {
  return await globalThis.crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'AES-CBC' },
    false,
    ['encrypt', 'decrypt'],
  )
}

/**
 * Encrypt data using AES-128-ECB.
 * Simulated via AES-CBC with zero IV, one block at a time.
 *
 * @param plaintext - Data to encrypt (will be PKCS7-padded automatically)
 * @param key - 16-byte AES key
 * @returns Encrypted ciphertext
 *
 * @example
 * ```ts
 * const key = crypto.getRandomValues(new Uint8Array(16))
 * const encrypted = await encryptAesEcb(data, key)
 * ```
 */
export async function encryptAesEcb(plaintext: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  const padded = pkcs7Pad(plaintext)
  const cryptoKey = await importAesKey(key)
  const zeroIv = new Uint8Array(BLOCK_SIZE)
  const result = new Uint8Array(padded.length)

  // Process each 16-byte block independently (ECB mode)
  for (let i = 0; i < padded.length; i += BLOCK_SIZE) {
    const block = padded.slice(i, i + BLOCK_SIZE)
    // AES-CBC with zero IV on a single block = AES-ECB for that block
    // WebCrypto adds its own padding, so we get 32 bytes back; take first 16
    const encrypted = await globalThis.crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: zeroIv },
      cryptoKey,
      block.buffer as ArrayBuffer,
    )
    result.set(new Uint8Array(encrypted).slice(0, BLOCK_SIZE), i)
  }

  return result
}

/**
 * Decrypt data using AES-128-ECB.
 *
 * Strategy: Use AES-CBC decrypt on the full ciphertext, then undo the CBC chaining.
 * CBC_DEC gives: P[0] = DEC(C[0]) ^ IV, P[i] = DEC(C[i]) ^ C[i-1]
 * ECB_DEC gives: P[i] = DEC(C[i])
 * Therefore: ECB_P[0] = CBC_P[0] (since IV=0), ECB_P[i] = CBC_P[i] ^ C[i-1]
 *
 * To handle WebCrypto's mandatory PKCS7 unpadding, we append a known block
 * that will decrypt to valid PKCS7 padding.
 *
 * @param ciphertext - Encrypted data (must be multiple of 16 bytes)
 * @param key - 16-byte AES key
 * @returns Decrypted plaintext (PKCS7 padding removed)
 *
 * @example
 * ```ts
 * const decrypted = await decryptAesEcb(encrypted, key)
 * ```
 */
export async function decryptAesEcb(ciphertext: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  if (ciphertext.length % BLOCK_SIZE !== 0) {
    throw new Error(`Invalid ciphertext length: ${ciphertext.length} (must be multiple of ${BLOCK_SIZE})`)
  }

  if (ciphertext.length === 0) {
    return new Uint8Array(0)
  }

  const cryptoKey = await importAesKey(key)
  const zeroIv = new Uint8Array(BLOCK_SIZE)

  // Step 1: Create a padding block that, when CBC-decrypted after the last real block,
  // produces valid PKCS7 padding.
  // CBC decrypt of appended block: AES_DEC(appendedBlock) ^ lastCipherBlock = must be valid PKCS7
  // So: appendedBlock = AES_ENC(padding ^ lastCipherBlock) where padding = 0x10 * 16
  const lastCipherBlock = ciphertext.slice(ciphertext.length - BLOCK_SIZE)
  const paddingPlain = new Uint8Array(BLOCK_SIZE)
  paddingPlain.fill(BLOCK_SIZE) // 0x10 * 16

  // XOR padding with the last ciphertext block
  const paddingXored = new Uint8Array(BLOCK_SIZE)
  for (let j = 0; j < BLOCK_SIZE; j++) {
    paddingXored[j] = paddingPlain[j] ^ lastCipherBlock[j]
  }

  // Encrypt to get the padding ciphertext block: AES_ENC(paddingXored) via CBC with IV=0
  const encResult = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: zeroIv },
    cryptoKey,
    paddingXored.buffer as ArrayBuffer,
  )
  const paddingCipherBlock = new Uint8Array(encResult).slice(0, BLOCK_SIZE)

  // Step 2: Append this padding ciphertext block to our data
  // CBC decrypt of [C0, C1, ..., Cn, paddingCipherBlock] with IV=0 will succeed
  // because the last block decrypts to valid PKCS7
  const augmented = new Uint8Array(ciphertext.length + BLOCK_SIZE)
  augmented.set(ciphertext)
  augmented.set(paddingCipherBlock, ciphertext.length)

  // Step 3: CBC decrypt the augmented ciphertext
  const cbcDecrypted = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: zeroIv },
    cryptoKey,
    augmented.buffer as ArrayBuffer,
  )
  const cbcPlain = new Uint8Array(cbcDecrypted)
  // cbcPlain has the padding block removed by WebCrypto, so it's exactly ciphertext.length bytes
  // Wait, no. WebCrypto removes PKCS7 from the decrypted output.
  // The last decrypted block is our padding_plain (0x10*16), which WebCrypto removes entirely.
  // So cbcPlain.length = ciphertext.length (the original n blocks without the appended one)
  // Actually: cbcPlain = first n blocks decrypted as CBC = n*16 bytes (padding block's plain was removed)

  // Step 4: Undo CBC chaining to get ECB plaintext
  // CBC_P[0] = DEC(C[0]) ^ IV = DEC(C[0]) = ECB_P[0] ✓
  // CBC_P[i] = DEC(C[i]) ^ C[i-1]
  // ECB_P[i] = DEC(C[i]) = CBC_P[i] ^ C[i-1]
  const ecbPlain = new Uint8Array(ciphertext.length)
  // First block: CBC with zero IV = ECB directly
  ecbPlain.set(cbcPlain.slice(0, BLOCK_SIZE))
  // Subsequent blocks: undo XOR with previous ciphertext block
  for (let i = BLOCK_SIZE; i < ciphertext.length; i += BLOCK_SIZE) {
    for (let j = 0; j < BLOCK_SIZE; j++) {
      ecbPlain[i + j] = cbcPlain[i + j] ^ ciphertext[i - BLOCK_SIZE + j]
    }
  }

  // Step 5: Remove PKCS7 padding from the ECB plaintext
  return pkcs7Unpad(ecbPlain)
}
