/**
 * Session persistence for token storage.
 *
 * Uses dynamic import of `node:fs/promises` to keep the module cross-platform.
 * In non-Node environments (browser/Deno), persistence is silently skipped.
 *
 * @module
 */

/** Session data stored to disk */
export interface SessionData {
  botToken: string
  accountId?: string
  baseUrl?: string
  userId?: string
  savedAt: string
}

/**
 * Load session data from a file path.
 * Returns null if file doesn't exist or can't be read.
 */
export async function loadSession(filePath: string): Promise<SessionData | null> {
  try {
    const fs = await import('node:fs/promises')
    const raw = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(raw) as SessionData
    if (data.botToken)
      return data
    return null
  }
  catch {
    return null
  }
}

/**
 * Save session data to a file path.
 * Sets file permissions to 0600 (owner-only) for security.
 */
export async function saveSession(filePath: string, data: SessionData): Promise<void> {
  try {
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(data, null, 2))
    try {
      await fs.chmod(filePath, 0o600)
    }
    catch {
      // chmod not supported on all platforms
    }
  }
  catch {
    // Silently skip if fs is unavailable (browser env)
  }
}
