import { describe, expect, it } from 'vitest'
import { TypedEventEmitter } from '../src/events'

interface TestEvents {
  message: [text: string]
  error: [err: Error]
  close: []
}

describe('typedEventEmitter', () => {
  it('should emit and receive events', () => {
    const emitter = new TypedEventEmitter<TestEvents>()
    const received: string[] = []

    emitter.on('message', (text) => {
      received.push(text)
    })

    emitter.emit('message', 'hello')
    emitter.emit('message', 'world')

    expect(received).toEqual(['hello', 'world'])
  })

  it('should support once listeners', () => {
    const emitter = new TypedEventEmitter<TestEvents>()
    const received: string[] = []

    emitter.once('message', (text) => {
      received.push(text)
    })

    emitter.emit('message', 'first')
    emitter.emit('message', 'second')

    expect(received).toEqual(['first'])
  })

  it('should remove listeners with off', () => {
    const emitter = new TypedEventEmitter<TestEvents>()
    const received: string[] = []

    const handler = (text: string) => received.push(text)
    emitter.on('message', handler)
    emitter.emit('message', 'before')

    emitter.off('message', handler)
    emitter.emit('message', 'after')

    expect(received).toEqual(['before'])
  })

  it('should support events with no arguments', () => {
    const emitter = new TypedEventEmitter<TestEvents>()
    let called = false

    emitter.on('close', () => {
      called = true
    })

    emitter.emit('close')
    expect(called).toBe(true)
  })

  it('should support removeAllListeners', () => {
    const emitter = new TypedEventEmitter<TestEvents>()
    let count = 0

    emitter.on('message', () => count++)
    emitter.on('message', () => count++)
    emitter.removeAllListeners('message')

    emitter.emit('message', 'test')
    expect(count).toBe(0)
  })

  it('should support removeAllListeners without event name', () => {
    const emitter = new TypedEventEmitter<TestEvents>()
    let msgCount = 0
    let closeCount = 0

    emitter.on('message', () => msgCount++)
    emitter.on('close', () => closeCount++)
    emitter.removeAllListeners()

    emitter.emit('message', 'test')
    emitter.emit('close')
    expect(msgCount).toBe(0)
    expect(closeCount).toBe(0)
  })

  it('should support method chaining', () => {
    const emitter = new TypedEventEmitter<TestEvents>()
    const result = emitter
      .on('message', () => {})
      .on('close', () => {})
      .off('close', () => {})

    expect(result).toBe(emitter)
  })
})
