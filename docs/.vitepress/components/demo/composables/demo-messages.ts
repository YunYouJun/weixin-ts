import type { ComputedRef } from 'vue'
import { useData } from 'vitepress'
import { computed } from 'vue'

export const MESSAGES = {
  en: {
    activeChat: 'Active chat',
    baseUrl: 'Base URL',
    chat: 'Chat',
    chatDescription: 'Recipient is selected automatically from the QR scanner or the latest incoming message.',
    chatPlaceholder: 'After login, send a message to this Bot in WeChat. Incoming messages will appear here.',
    connected: 'Connected. Send a message to the bot in WeChat to select a chat.',
    connectedResult: 'Connected',
    copyToken: 'Copy Token',
    copyTokenSuccess: 'Token copied to clipboard.',
    devNote: 'Development only. API requests are proxied by the local VitePress dev server.',
    eyebrow: 'Browser demo',
    fileMessage: 'File',
    generateQr: 'Generate QR & Start',
    hide: 'Hide',
    imageMessage: 'Image',
    inputPlaceholder: 'Type a message...',
    listening: 'Login successful. Listening for new messages.',
    loginDescription: 'Generate a token, start long polling, then chat with the latest WeChat sender.',
    loginTitle: 'QR login',
    loginWaiting: 'Use WeChat to scan and confirm. The demo will start listening for messages.',
    noToken: 'No token yet',
    requestingQr: 'Requesting login QR code...',
    qrPlaceholder: 'Click the button below to generate a QR code.',
    qrRefreshed: 'QR code refreshed. Scan the new code.',
    scanned: 'Scanned. Please confirm login in WeChat.',
    scanQr: 'Scan the QR code with WeChat, then confirm on your phone.',
    scannerSelected: 'Selected scanner {id}. Incoming messages will update the active chat automatically.',
    send: 'Send',
    sendNeedConnection: 'Generate a QR token or paste a token, then start listening first.',
    sendNeedRecipient: 'No active chat yet. Send a message to the bot from WeChat first.',
    sendNeedText: 'Type a message to send.',
    sending: 'Sending...',
    startListening: 'Start listening',
    stopListening: 'Stop',
    sent: 'Sent. clientId: {clientId}',
    sessionExpired: 'Session expired. Generate a new QR token.',
    show: 'Show',
    title: 'Live chat with your Bot',
    token: 'Token',
    tokenPlaceholder: 'Generated after QR login',
    unsupportedMessage: 'Unsupported message',
    videoMessage: 'Video',
    voiceMessage: 'Voice',
    waitingForScan: 'Waiting for scan...',
    waitingForUser: 'Waiting for a user message',
    status: {
      connected: 'connected',
      connecting: 'connecting',
      disconnected: 'disconnected',
      error: 'error',
      idle: 'idle',
      requesting: 'requesting',
      scanned: 'scanned',
      success: 'success',
      waiting: 'waiting',
    },
  },
  zh: {
    activeChat: '当前会话',
    baseUrl: '基础地址',
    chat: '聊天',
    chatDescription: '收件人会自动从扫码用户或最新收到的消息中选择。',
    chatPlaceholder: '登录后，在微信里给这个 Bot 发送一条消息，新消息会显示在这里。',
    connected: '已连接。请在微信里给 Bot 发送消息以选择会话。',
    connectedResult: '已连接',
    copyToken: '复制令牌',
    copyTokenSuccess: '令牌已复制到剪贴板。',
    devNote: '仅开发环境可用。API 请求会通过本地 VitePress dev server 代理。',
    eyebrow: '浏览器演示',
    fileMessage: '文件',
    generateQr: '生成二维码并启动',
    hide: '隐藏',
    imageMessage: '图片',
    inputPlaceholder: '输入消息...',
    listening: '登录成功，正在监听新消息。',
    loginDescription: '生成令牌、启动长轮询，然后与最新微信发送者聊天。',
    loginTitle: '扫码登录',
    loginWaiting: '使用微信扫码并确认，演示会开始监听消息。',
    noToken: '暂无令牌',
    requestingQr: '正在请求登录二维码...',
    qrPlaceholder: '点击下方按钮生成二维码。',
    qrRefreshed: '二维码已刷新，请扫描新的二维码。',
    scanned: '已扫码，请在微信中确认登录。',
    scanQr: '请用微信扫码，并在手机上确认。',
    scannerSelected: '已选择扫码用户 {id}，后续新消息会自动更新当前会话。',
    send: '发送',
    sendNeedConnection: '请先生成二维码令牌，或粘贴令牌后启动监听。',
    sendNeedRecipient: '还没有当前会话。请先在微信里给 Bot 发送一条消息。',
    sendNeedText: '请输入要发送的消息。',
    sending: '发送中...',
    startListening: '启动监听',
    stopListening: '停止',
    sent: '已发送。clientId: {clientId}',
    sessionExpired: '会话已过期，请重新生成二维码令牌。',
    show: '显示',
    title: '与 Bot 实时聊天',
    token: '令牌',
    tokenPlaceholder: '扫码登录后自动生成',
    unsupportedMessage: '暂不支持的消息',
    videoMessage: '视频',
    voiceMessage: '语音',
    waitingForScan: '等待扫码...',
    waitingForUser: '等待用户消息',
    status: {
      connected: '已连接',
      connecting: '连接中',
      disconnected: '已断开',
      error: '错误',
      idle: '空闲',
      requesting: '请求中',
      scanned: '已扫码',
      success: '成功',
      waiting: '等待中',
    },
  },
} as const

export type Messages = (typeof MESSAGES)[keyof typeof MESSAGES]

export function useI18n(): { t: ComputedRef<Messages> } {
  const { lang } = useData()
  const t = computed(() => lang.value.startsWith('zh') ? MESSAGES.zh : MESSAGES.en)
  return { t }
}

export function shortId(value: string, fallback: string): string {
  if (!value)
    return fallback
  if (value.length <= 16)
    return value
  return `${value.slice(0, 8)}...${value.slice(-6)}`
}

export function formatTime(timestamp?: number): string {
  return new Date(timestamp || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
