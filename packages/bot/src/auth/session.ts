/**
 * Session persistence primitives.
 *
 * This module is runtime-agnostic and does not import any Node.js API.
 * Use `@weixin-ts/bot/node` for the built-in file-based session storage.
 *
 * @module
 */

/** Session data persisted between bot restarts. */
export interface SessionData {
  botToken: string
  accountId?: string
  baseUrl?: string
  userId?: string
  savedAt: string
}

/**
 * Runtime-agnostic session storage interface.
 *
 * Implement this for localStorage, IndexedDB, Redis, files, KV stores, etc.
 *
 * @example
 * ```ts
 * import type { SessionStorage } from '@weixin-ts/bot'
 *
 * const storage: SessionStorage = {
 *   async load() {
 *     const raw = localStorage.getItem('weixin-session')
 *     return raw ? JSON.parse(raw) : null
 *   },
 *   async save(data) {
 *     localStorage.setItem('weixin-session', JSON.stringify(data))
 *   },
 *   async delete() {
 *     const had = localStorage.getItem('weixin-session') !== null
 *     localStorage.removeItem('weixin-session')
 *     return had
 *   },
 * }
 * ```
 */
export interface SessionStorage {
  /** Load saved session data. Return `null` if nothing is stored. */
  load: () => Promise<SessionData | null>
  /** Save session data. */
  save: (data: SessionData) => Promise<void>
  /** Delete session data. Return `true` if something was deleted. */
  delete: () => Promise<boolean>
}
