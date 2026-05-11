import type { WeixinBot, WeixinMessage } from '@weixin-ts/bot'
import type { ComputedRef, Ref } from 'vue'
import type { ChatMessage, ConnectionStatus, DemoResult, LoginStatus } from './demo-types'
import { computed, nextTick, onBeforeUnmount, ref, shallowRef } from 'vue'
import { formatTime, getErrorMessage, shortId, useI18n } from './demo-messages'

const DEFAULT_BASE_URL = 'https://ilinkai.weixin.qq.com'
const isDev = (import.meta as ImportMeta & { env: { DEV: boolean } }).env.DEV
const DEV_PROXY_BASE_URL = typeof window === 'undefined' ? '' : window.location.origin

export interface UseBotReturn {
  // State
  token: Ref<string>
  baseUrl: Ref<string>
  showToken: Ref<boolean>
  loginStatus: Ref<LoginStatus>
  loginLoading: Ref<boolean>
  loginMessage: Ref<string>
  connectionStatus: Ref<ConnectionStatus>
  chatMessages: Ref<ChatMessage[]>
  selectedUserPreview: ComputedRef<string>
  draft: Ref<string>
  canSend: ComputedRef<boolean>
  canStartListening: ComputedRef<boolean>
  sendDisabledReason: ComputedRef<string>
  loading: Ref<boolean>
  result: Ref<DemoResult | null>
  qrCanvas: Ref<HTMLCanvasElement | undefined>
  qrCodeContent: Ref<string>
  tokenPreview: ComputedRef<string>
  loginStatusLabel: ComputedRef<string>
  connectionStatusLabel: ComputedRef<string>
  isDev: boolean
  // Methods
  generateTokenByQr: () => Promise<void>
  startBot: () => Promise<void>
  stopBot: () => void
  send: () => Promise<void>
  copyToken: () => Promise<void>
}

export function useBot(): UseBotReturn {
  const { t } = useI18n()

  const token = ref('')
  const baseUrl = ref(isDev ? DEV_PROXY_BASE_URL : DEFAULT_BASE_URL)
  const showToken = ref(false)
  const selectedUserId = ref('')
  const selectedContextToken = ref('')
  const draft = ref('')
  const chatMessages = ref<ChatMessage[]>([])

  const qrCanvas = ref<HTMLCanvasElement>()
  const qrCodeContent = ref('')
  const loginLoading = ref(false)
  const loginStatus = ref<LoginStatus>('idle')
  const loginMessage = ref('')
  const connectionStatus = ref<ConnectionStatus>('idle')

  const loading = ref(false)
  const result = ref<DemoResult | null>(null)

  let loginRunId = 0
  let messageSeq = 0
  const botInstance = shallowRef<WeixinBot | null>(null)

  const canSend = computed(() => Boolean(
    botInstance.value
    && connectionStatus.value === 'connected'
    && selectedUserId.value
    && draft.value.trim(),
  ))

  const canStartListening = computed(() => Boolean(
    token.value
    && connectionStatus.value !== 'connecting'
    && connectionStatus.value !== 'connected',
  ))

  const sendDisabledReason = computed(() => {
    if (connectionStatus.value !== 'connected')
      return t.value.sendNeedConnection
    if (!selectedUserId.value)
      return t.value.sendNeedRecipient
    if (!draft.value.trim())
      return t.value.sendNeedText
    return ''
  })

  const tokenPreview = computed(() => shortId(token.value, t.value.noToken))
  const selectedUserPreview = computed(() => shortId(selectedUserId.value, t.value.waitingForUser))
  const loginStatusLabel = computed(() => t.value.status[loginStatus.value])
  const connectionStatusLabel = computed(() => t.value.status[connectionStatus.value])

  function addChatMessage(message: Omit<ChatMessage, 'id' | 'time'> & { time?: string }): void {
    chatMessages.value.push({
      id: `${Date.now()}-${messageSeq++}`,
      time: message.time || formatTime(),
      ...message,
    })
  }

  function getMessageText(message: WeixinMessage): string {
    const text = message.item_list?.map((item) => {
      if (item.text_item?.text)
        return item.text_item.text
      if (item.voice_item?.text)
        return `[${t.value.voiceMessage}] ${item.voice_item.text}`
      if (item.image_item)
        return `[${t.value.imageMessage}]`
      if (item.video_item)
        return `[${t.value.videoMessage}]`
      if (item.file_item)
        return `[${t.value.fileMessage}] ${item.file_item.file_name || 'file'}`
      return ''
    }).filter(Boolean).join('\n')

    return text || `[${t.value.unsupportedMessage}]`
  }

  function getMessageUserId(message: WeixinMessage): string {
    return message.from_user_id || message.to_user_id || ''
  }

  function handleIncomingMessage(message: WeixinMessage): void {
    const userId = getMessageUserId(message)
    if (userId)
      selectedUserId.value = userId
    if (message.context_token)
      selectedContextToken.value = message.context_token

    addChatMessage({
      role: 'user',
      userId,
      text: getMessageText(message),
      time: formatTime(message.create_time_ms),
    })
  }

  async function renderQrCode(content: string): Promise<void> {
    await nextTick()
    if (!qrCanvas.value)
      return

    const QRCode = await import('qrcode')
    await QRCode.toCanvas(qrCanvas.value, content, {
      width: 180,
      margin: 1,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
    })
  }

  function stopBot(): void {
    const bot = botInstance.value
    botInstance.value = null
    if (bot?.isPolling)
      bot.stop()
    if (connectionStatus.value === 'connected' || connectionStatus.value === 'connecting')
      connectionStatus.value = 'disconnected'
  }

  async function startBot(): Promise<void> {
    if (!token.value)
      return

    stopBot()
    connectionStatus.value = 'connecting'

    const { WeixinBot } = await import('@weixin-ts/bot')
    const bot = new WeixinBot({
      token: token.value,
      baseUrl: baseUrl.value,
      longPollTimeoutMs: 35_000,
    })

    bot.on('message', handleIncomingMessage)
    bot.on('connected', () => {
      connectionStatus.value = 'connected'
      addChatMessage({ role: 'system', text: t.value.connected })
    })
    bot.on('disconnected', () => {
      if (botInstance.value === bot)
        connectionStatus.value = 'disconnected'
    })
    bot.on('error', (err) => {
      connectionStatus.value = 'error'
      result.value = { ok: false, message: getErrorMessage(err) }
    })
    bot.on('session:expired', () => {
      connectionStatus.value = 'error'
      result.value = { ok: false, message: t.value.sessionExpired }
    })

    botInstance.value = bot
    bot.start()
  }

  async function generateTokenByQr(): Promise<void> {
    const runId = ++loginRunId
    stopBot()
    chatMessages.value = []
    selectedUserId.value = ''
    selectedContextToken.value = ''
    loginLoading.value = true
    loginStatus.value = 'requesting'
    loginMessage.value = t.value.requestingQr
    qrCodeContent.value = ''
    result.value = null

    try {
      const { requestQRCode } = await import('@weixin-ts/bot')
      const qr = await requestQRCode({
        baseUrl: baseUrl.value || DEFAULT_BASE_URL,
      })

      if (runId !== loginRunId)
        return

      qrCodeContent.value = qr.qrcodeUrl
      loginStatus.value = 'waiting'
      loginMessage.value = t.value.scanQr
      await renderQrCode(qr.qrcodeUrl)

      const loginResult = await qr.poll({
        onScanned: () => {
          if (runId !== loginRunId)
            return
          loginStatus.value = 'scanned'
          loginMessage.value = t.value.scanned
        },
        onQrRefresh: (url) => {
          if (runId !== loginRunId)
            return
          qrCodeContent.value = url
          loginStatus.value = 'waiting'
          loginMessage.value = t.value.qrRefreshed
          void renderQrCode(url)
        },
      })

      if (runId !== loginRunId)
        return

      if (loginResult.success && loginResult.botToken) {
        token.value = loginResult.botToken
        if (loginResult.baseUrl && !isDev)
          baseUrl.value = loginResult.baseUrl
        if (loginResult.userId)
          selectedUserId.value = loginResult.userId
        loginStatus.value = 'success'
        loginMessage.value = t.value.listening
        result.value = { ok: true, message: `${t.value.connectedResult}${loginResult.accountId ? ` as ${loginResult.accountId}` : ''}.` }
        if (loginResult.userId) {
          addChatMessage({
            role: 'system',
            text: t.value.scannerSelected.replace('{id}', shortId(loginResult.userId, '')),
          })
        }
        await startBot()
        return
      }

      loginStatus.value = 'error'
      loginMessage.value = loginResult.message
      result.value = { ok: false, message: loginResult.message }
    }
    catch (err) {
      if (runId !== loginRunId)
        return
      const message = getErrorMessage(err)
      loginStatus.value = 'error'
      loginMessage.value = message
      result.value = { ok: false, message }
    }
    finally {
      if (runId === loginRunId)
        loginLoading.value = false
    }
  }

  async function copyToken(): Promise<void> {
    if (!token.value)
      return

    try {
      await navigator.clipboard.writeText(token.value)
      result.value = { ok: true, message: t.value.copyTokenSuccess }
    }
    catch (err) {
      result.value = { ok: false, message: getErrorMessage(err) }
    }
  }

  async function send(): Promise<void> {
    const text = draft.value.trim()
    const to = selectedUserId.value
    const bot = botInstance.value
    if (!canSend.value || !bot || !to || !text)
      return

    loading.value = true
    result.value = null

    try {
      const clientId = await bot.sendText({
        to,
        text,
        contextToken: selectedContextToken.value || undefined,
      })
      addChatMessage({ role: 'bot', userId: to, text })
      draft.value = ''
      result.value = { ok: true, message: t.value.sent.replace('{clientId}', clientId) }
    }
    catch (err) {
      result.value = { ok: false, message: getErrorMessage(err) }
    }
    finally {
      loading.value = false
    }
  }

  onBeforeUnmount(() => {
    loginRunId++
    stopBot()
  })

  return {
    token,
    baseUrl,
    showToken,
    loginStatus,
    loginLoading,
    loginMessage,
    connectionStatus,
    chatMessages,
    selectedUserPreview,
    draft,
    canSend,
    canStartListening,
    sendDisabledReason,
    loading,
    result,
    qrCanvas,
    qrCodeContent,
    tokenPreview,
    loginStatusLabel,
    connectionStatusLabel,
    isDev,
    generateTokenByQr,
    startBot,
    stopBot,
    send,
    copyToken,
  }
}
