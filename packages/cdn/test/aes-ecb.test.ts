import { describe, expect, it } from 'vitest'
import { aesEcbPaddedSize, decryptAesEcb, encryptAesEcb, pkcs7Pad, pkcs7Unpad } from '../src/aes-ecb'

describe('aes-ecb', () => {
  describe('aesEcbPaddedSize', () => {
    it('should calculate padded size correctly', () => {
      expect(aesEcbPaddedSize(0)).toBe(16)
      expect(aesEcbPaddedSize(1)).toBe(16)
      expect(aesEcbPaddedSize(15)).toBe(16)
      expect(aesEcbPaddedSize(16)).toBe(32) // Full block → adds 16 bytes padding
      expect(aesEcbPaddedSize(17)).toBe(32)
      expect(aesEcbPaddedSize(32)).toBe(48)
      expect(aesEcbPaddedSize(100)).toBe(112)
    })
  })

  describe('pkcs7Pad / pkcs7Unpad', () => {
    it('should pad and unpad correctly', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const padded = pkcs7Pad(data)
      expect(padded.length).toBe(16)
      expect(padded[5]).toBe(11) // padding value = 16 - 5 = 11

      const unpadded = pkcs7Unpad(padded)
      expect(unpadded).toEqual(data)
    })

    it('should pad full blocks', () => {
      const data = new Uint8Array(16).fill(0xAA)
      const padded = pkcs7Pad(data)
      expect(padded.length).toBe(32)
      expect(padded[16]).toBe(16) // full block of padding
    })

    it('should throw on invalid padding', () => {
      expect(() => pkcs7Unpad(new Uint8Array(0))).toThrow()
      expect(() => pkcs7Unpad(new Uint8Array(15))).toThrow() // not multiple of 16
    })
  })

  describe('encryptAesEcb / decryptAesEcb', () => {
    it('should encrypt and decrypt roundtrip', async () => {
      const key = globalThis.crypto.getRandomValues(new Uint8Array(16))
      const plaintext = new TextEncoder().encode('Hello, WeChat Bot SDK!')

      const encrypted = await encryptAesEcb(plaintext, key)
      expect(encrypted.length).toBe(aesEcbPaddedSize(plaintext.length))
      expect(encrypted).not.toEqual(plaintext)

      const decrypted = await decryptAesEcb(encrypted, key)
      expect(decrypted).toEqual(plaintext)
    })

    it('should handle empty input', async () => {
      const key = globalThis.crypto.getRandomValues(new Uint8Array(16))
      const plaintext = new Uint8Array(0)

      const encrypted = await encryptAesEcb(plaintext, key)
      expect(encrypted.length).toBe(16) // One padding block

      const decrypted = await decryptAesEcb(encrypted, key)
      expect(decrypted).toEqual(plaintext)
    })

    it('should handle multi-block input', async () => {
      const key = globalThis.crypto.getRandomValues(new Uint8Array(16))
      const plaintext = globalThis.crypto.getRandomValues(new Uint8Array(100))

      const encrypted = await encryptAesEcb(plaintext, key)
      expect(encrypted.length).toBe(112) // 100 → padded to 112

      const decrypted = await decryptAesEcb(encrypted, key)
      expect(decrypted).toEqual(plaintext)
    })

    it('should throw on invalid ciphertext length', async () => {
      const key = globalThis.crypto.getRandomValues(new Uint8Array(16))
      const invalid = new Uint8Array(15) // not multiple of 16

      await expect(decryptAesEcb(invalid, key)).rejects.toThrow()
    })
  })
})
