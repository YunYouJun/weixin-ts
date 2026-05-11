export interface DemoResult { ok: boolean, message: string }
export type LoginStatus = 'idle' | 'requesting' | 'waiting' | 'scanned' | 'success' | 'error'
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'
export type ChatRole = 'user' | 'bot' | 'system'

export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  userId?: string
  time: string
}
