/**
 * Cross-platform typed event emitter.
 * No dependency on `node:events` — works in browsers, Deno, Bun, and Node.js.
 *
 * @module
 */

/** Generic event handler function type */

export type EventHandler<T extends any[] = any[]> = (...args: T) => void

export type EventMap = Record<string, unknown[]>

/**
 * A typed event emitter that provides type-safe event registration and emission.
 * Supports `on`, `off`, `once`, and `emit` methods with full type inference.
 *
 * @example
 * ```ts
 * type MyEvents = {
 *   message: [text: string]
 *   error: [err: Error]
 *   close: []
 * }
 *
 * const emitter = new TypedEventEmitter<MyEvents>()
 * emitter.on('message', (text) => console.log(text)) // text is typed as string
 * emitter.emit('message', 'hello')
 * ```
 */

export class TypedEventEmitter<Events = any> {
  private handlers = new Map<string, Set<EventHandler<any>>>()

  /**
   * Register an event listener.
   *
   * @param event - The event name to listen for
   * @param handler - The callback function
   * @returns `this` for chaining
   */
  on<K extends string & keyof Events>(event: K, handler: (...args: Events[K] extends any[] ? Events[K] : any[]) => void): this {
    let set = this.handlers.get(event)
    if (!set) {
      set = new Set()
      this.handlers.set(event, set)
    }
    set.add(handler as EventHandler)
    return this
  }

  /**
   * Remove an event listener.
   *
   * @param event - The event name
   * @param handler - The handler to remove
   * @returns `this` for chaining
   */
  off<K extends string & keyof Events>(event: K, handler: (...args: Events[K] extends any[] ? Events[K] : any[]) => void): this {
    const set = this.handlers.get(event)
    if (set) {
      set.delete(handler as EventHandler)
      if (set.size === 0)
        this.handlers.delete(event)
    }
    return this
  }

  /**
   * Register a one-time event listener. The handler is automatically removed
   * after the first invocation.
   *
   * @param event - The event name
   * @param handler - The callback function (called at most once)
   * @returns `this` for chaining
   */
  once<K extends string & keyof Events>(event: K, handler: (...args: Events[K] extends any[] ? Events[K] : any[]) => void): this {
    const wrapper = (...args: any[]): void => {
      this.off(event, wrapper as any)
      handler(...args as any)
    }
    return this.on(event, wrapper as any)
  }

  /**
   * Emit an event, calling all registered listeners with the provided arguments.
   *
   * @param event - The event name to emit
   * @param args - Arguments to pass to the listeners
   */
  emit<K extends string & keyof Events>(event: K, ...args: Events[K] extends any[] ? Events[K] : any[]): void {
    const set = this.handlers.get(event)
    if (set) {
      for (const handler of set) {
        handler(...args)
      }
    }
  }

  /**
   * Remove all listeners for a specific event, or all listeners if no event is specified.
   *
   * @param event - Optional event name. If omitted, removes all listeners.
   */
  removeAllListeners<K extends string & keyof Events>(event?: K): this {
    if (event) {
      this.handlers.delete(event)
    }
    else {
      this.handlers.clear()
    }
    return this
  }
}
