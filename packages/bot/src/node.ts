/**
 * Node.js helpers for `@weixin-ts/bot`.
 *
 * Import from `@weixin-ts/bot/node` when you need file-based session storage.
 * The main `@weixin-ts/bot` entry stays runtime-agnostic.
 *
 * @module
 */

import type { SessionData, SessionStorage } from './auth/session'

/** File-based session storage using `node:fs/promises`. */
export class FileSessionStorage implements SessionStorage {
  constructor(private readonly filePath: string) {}

  async load(): Promise<SessionData | null> {
    try {
      const fs = await import('node:fs/promises')
      const raw = await fs.readFile(this.filePath, 'utf-8')
      const data = JSON.parse(raw) as SessionData
      if (data.botToken)
        return data
      return null
    }
    catch {
      return null
    }
  }

  async save(data: SessionData): Promise<void> {
    try {
      const fs = await import('node:fs/promises')
      const path = await import('node:path')
      const dir = path.dirname(this.filePath)
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2))
      try {
        await fs.chmod(this.filePath, 0o600)
      }
      catch {
        // chmod not supported on all platforms
      }
    }
    catch {
      // Silently skip if fs is unavailable
    }
  }

  async delete(): Promise<boolean> {
    try {
      const fs = await import('node:fs/promises')
      await fs.unlink(this.filePath)
      return true
    }
    catch {
      return false
    }
  }
}

/** Create file-based session storage. */
export function fileSession(filePath: string): SessionStorage {
  return new FileSessionStorage(filePath)
}

/** Load session data from a file path. */
export async function loadSession(filePath: string): Promise<SessionData | null> {
  return fileSession(filePath).load()
}

/** Save session data to a file path. */
export async function saveSession(filePath: string, data: SessionData): Promise<void> {
  return fileSession(filePath).save(data)
}

/** Delete session data from a file path. */
export async function deleteSession(filePath: string): Promise<boolean> {
  return fileSession(filePath).delete()
}
