import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { deleteSession, fileSession, loadSession, saveSession } from '../../src/node'

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'weixin-ts-session-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('fileSession', () => {
  it('should save, load, and delete session data', async () => {
    const file = join(dir, 'nested', '.weixin-bot.session.json')
    const storage = fileSession(file)
    const session = {
      botToken: 'bot-token',
      accountId: 'bot-id',
      baseUrl: 'https://api.example.com',
      userId: 'user-id',
      savedAt: '2026-05-11T00:00:00.000Z',
    }

    await storage.save(session)

    await expect(storage.load()).resolves.toEqual(session)
    await expect(storage.delete()).resolves.toBe(true)
    await expect(storage.load()).resolves.toBeNull()
    await expect(storage.delete()).resolves.toBe(false)
  })

  it('should return null for missing or invalid session files', async () => {
    const file = join(dir, '.weixin-bot.session.json')
    const storage = fileSession(file)

    await expect(storage.load()).resolves.toBeNull()

    await writeFile(file, JSON.stringify({ accountId: 'missing-token' }))
    await expect(storage.load()).resolves.toBeNull()
  })

  it('should expose convenience helpers', async () => {
    const file = join(dir, 'helpers', '.weixin-bot.session.json')
    const session = {
      botToken: 'helper-token',
      savedAt: '2026-05-11T00:00:00.000Z',
    }

    await mkdir(join(dir, 'helpers'), { recursive: true })
    await saveSession(file, session)

    await expect(loadSession(file)).resolves.toEqual(session)
    await expect(deleteSession(file)).resolves.toBe(true)
  })
})
