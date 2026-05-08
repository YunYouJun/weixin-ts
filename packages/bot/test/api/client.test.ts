import { describe, expect, it } from 'vitest'
import { buildClientVersion, buildCommonHeaders, buildPostHeaders } from '../../src/utils/headers'

describe('headers', () => {
  describe('buildClientVersion', () => {
    it('should encode version string to uint32', () => {
      expect(buildClientVersion('1.0.11')).toBe(0x0001000B)
      expect(buildClientVersion('1.0.0')).toBe(0x00010000)
      expect(buildClientVersion('2.1.7')).toBe(0x00020107)
      expect(buildClientVersion('0.0.1')).toBe(0x00000001)
    })

    it('should handle partial versions', () => {
      expect(buildClientVersion('1')).toBe(0x00010000)
      expect(buildClientVersion('1.2')).toBe(0x00010200)
    })
  })

  describe('buildCommonHeaders', () => {
    it('should include app id and version', () => {
      const headers = buildCommonHeaders({ appId: 'mybot', version: '1.0.0' })
      expect(headers['iLink-App-Id']).toBe('mybot')
      expect(headers['iLink-App-ClientVersion']).toBe(String(0x00010000))
    })

    it('should use defaults when no options provided', () => {
      const headers = buildCommonHeaders()
      expect(headers['iLink-App-Id']).toBe('bot')
      expect(headers['iLink-App-ClientVersion']).toBeDefined()
    })
  })

  describe('buildPostHeaders', () => {
    it('should include content type and auth headers', () => {
      const headers = buildPostHeaders('{"test":true}', { token: 'my-token' })
      expect(headers['Content-Type']).toBe('application/json')
      expect(headers.AuthorizationType).toBe('ilink_bot_token')
      expect(headers.Authorization).toBe('Bearer my-token')
      expect(headers['X-WECHAT-UIN']).toBeDefined()
    })

    it('should not include Authorization when token is empty', () => {
      const headers = buildPostHeaders('{}', { token: '' })
      expect(headers.Authorization).toBeUndefined()
    })

    it('should not include Authorization when token is undefined', () => {
      const headers = buildPostHeaders('{}', {})
      expect(headers.Authorization).toBeUndefined()
    })
  })
})
