/**
 * WeixinBot — High-level WeChat bot client.
 *
 * Provides an event-driven interface for receiving and sending messages
 * via the WeChat iLink Bot API.
 *
 * @example
 * ```ts
 * import { WeixinBot } from '@weixin-ts/bot'
 *
 * const bot = new WeixinBot({ token: 'YOUR_BOT_TOKEN' })
 *
 * bot.on('message', (msg) => {
 *   console.log(`Message from ${msg.from_user_id}:`, msg.item_list)
 * })
 *
 * bot.on('error', (err) => {
 *   console.error('Bot error:', err)
 * })
 *
 * await bot.start()
 * ```
 *
 * @module
 */

import type { LoginResult } from './auth/login'
import type {
  BotEventMap,
  CDNMedia,
  GetConfigResp,
  LoginCallbacks,
  MessageItem,
  SendMediaOptions,
  SendTextOptions,
  WeixinBotOptions,
  WeixinMessage,
} from './types'
import { fromHex, toBase64, uploadMedia } from '@weixin-ts/cdn'
import { getConfig } from './api/get-config'
import { getUpdates as getUpdatesApi } from './api/get-updates'
import { sendMessage } from './api/send-message'
import { sendTyping as sendTypingApi } from './api/send-typing'
import { requestQRCode } from './auth/login'
import { loadSession, saveSession } from './auth/session'
import { DEFAULT_BASE_URL, DEFAULT_CDN_BASE_URL } from './constants'
import { TypedEventEmitter } from './events'
import { Poller } from './polling/poller'
import { MessageItemType, MessageState, MessageType, TypingStatus } from './types'
import { generateId } from './utils/random'

/**
 * High-level WeChat Bot client with automatic long-polling and event-driven message handling.
 *
 * @example
 * ```ts
 * const bot = new WeixinBot({ token: 'YOUR_TOKEN' })
 *
 * bot.on('message', (msg) => {
 *   // Handle incoming message
 *   const text = msg.item_list?.find(i => i.type === 1)?.text_item?.text
 *   if (text) {
 *     bot.sendText({ to: msg.from_user_id!, text: `Echo: ${text}` })
 *   }
 * })
 *
 * bot.on('error', console.error)
 * bot.start()
 * ```
 */
export class WeixinBot extends TypedEventEmitter<BotEventMap> {
  private poller: Poller | null = null
  private readonly config: WeixinBotOptions

  /** Mutable runtime state (token/baseUrl may change after login) */
  private _token: string | undefined
  private _baseUrl: string
  private _cdnBaseUrl: string

  /** Cached typing tickets per user (userId → ticket) */
  private typingTickets = new Map<string, string>()

  /** Cached context tokens per user (userId → contextToken) */
  private contextTokens = new Map<string, string>()

  constructor(options?: WeixinBotOptions) {
    super()
    this.config = { ...options }
    this._token = options?.token
    this._baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL
    this._cdnBaseUrl = options?.cdnBaseUrl ?? DEFAULT_CDN_BASE_URL
  }

  /** Whether the bot is currently polling for messages */
  get isPolling(): boolean {
    return this.poller?.isRunning ?? false
  }

  /** The API base URL being used */
  get baseUrl(): string {
    return this._baseUrl
  }

  /** The CDN base URL being used */
  get cdnBaseUrl(): string {
    return this._cdnBaseUrl
  }

  /**
   * Start long-polling for messages.
   * Returns immediately — polling runs in the background.
   * The bot will emit `'message'` events for each incoming message
   * and `'connected'` once polling has started.
   *
   * @throws Error if already polling
   */
  start(): void {
    if (this.poller?.isRunning) {
      throw new Error('Bot is already polling')
    }

    this.poller = new Poller(
      {
        baseUrl: this._baseUrl,
        token: this._token,
        longPollTimeoutMs: this.config.longPollTimeoutMs,
        appId: this.config.appId,
        version: this.config.version,
      },
      {
        onMessages: msgs => this.handleMessages(msgs),
        onError: err => this.emit('error', err),
        onSessionExpired: () => this.emit('session:expired'),
        onConnected: () => this.emit('connected'),
        onDisconnected: () => this.emit('disconnected'),
      },
    )

    this.poller.start()
  }

  /**
   * Stop polling for messages.
   * In-flight requests will be aborted gracefully.
   */
  stop(): void {
    this.poller?.stop()
    this.poller = null
  }

  /**
   * Login via QR code scanning.
   *
   * This is the simplest way to authenticate. If `session` is configured,
   * the token is automatically persisted for next time.
   *
   * @param callbacks - Callbacks for QR display and status updates
   * @returns Login result with token and account info
   *
   * @example
   * ```ts
   * const bot = new WeixinBot({ session: '.weixin-bot.session.json' })
   *
   * await bot.login({
   *   onQrCode: (url) => console.log('Scan:', url),
   *   onScanned: () => console.log('Confirm in WeChat...'),
   * })
   *
   * bot.start()
   * ```
   */
  async login(callbacks?: LoginCallbacks): Promise<LoginResult> {
    // Try loading saved session first
    if (this.config.session && !this._token) {
      const saved = await loadSession(this.config.session)
      if (saved) {
        this._token = saved.botToken
        if (saved.baseUrl) {
          this._baseUrl = saved.baseUrl
        }
        this.emit('session:loaded', saved)
        return {
          success: true,
          botToken: saved.botToken,
          accountId: saved.accountId,
          baseUrl: saved.baseUrl,
          userId: saved.userId,
          message: 'Loaded from session file',
        }
      }
    }

    // No saved session → QR login
    const qr = await requestQRCode({
      baseUrl: this._baseUrl,
      appId: this.config.appId,
      version: this.config.version,
    })

    // Notify caller to display QR
    callbacks?.onQrCode?.(qr.qrcodeUrl)

    // Poll until confirmed
    const result = await qr.poll({
      onScanned: callbacks?.onScanned,
      onQrRefresh: callbacks?.onQrRefresh,
    })

    if (result.success && result.botToken) {
      // Auto-configure bot
      this._token = result.botToken
      if (result.baseUrl) {
        this._baseUrl = result.baseUrl
      }

      // Persist session
      if (this.config.session) {
        await saveSession(this.config.session, {
          botToken: result.botToken,
          accountId: result.accountId,
          baseUrl: result.baseUrl,
          userId: result.userId,
          savedAt: new Date().toISOString(),
        })
      }
    }

    return result
  }

  /**
   * Check if the bot has a valid token (from constructor, login, or session).
   */
  get isLoggedIn(): boolean {
    return !!this._token
  }

  /**
   * Send a text message to a user.
   *
   * @param options - Send text options
   * @returns The client-generated message ID
   *
   * @example
   * ```ts
   * await bot.sendText({ to: 'user_id', text: 'Hello!' })
   * ```
   */
  async sendText(options: SendTextOptions): Promise<string> {
    const clientId = generateId('weixin-bot')
    const contextToken = options.contextToken ?? this.contextTokens.get(options.to)

    const itemList: MessageItem[] = options.text
      ? [{ type: MessageItemType.TEXT, text_item: { text: options.text } }]
      : []

    await sendMessage({
      baseUrl: this._baseUrl,
      token: this._token,
      timeoutMs: this.config.apiTimeoutMs,
      appId: this.config.appId,
      version: this.config.version,
      body: {
        msg: {
          from_user_id: '',
          to_user_id: options.to,
          client_id: clientId,
          message_type: MessageType.BOT,
          message_state: MessageState.FINISH,
          item_list: itemList.length ? itemList : undefined,
          context_token: contextToken,
        },
      },
    })

    return clientId
  }

  /**
   * Send an image message. Handles CDN upload and encryption automatically.
   *
   * @param options - Send media options (file as Uint8Array/ArrayBuffer)
   * @returns The client-generated message ID
   *
   * @example
   * ```ts
   * const imageBuffer = await fetch('https://example.com/photo.jpg').then(r => r.arrayBuffer())
   * await bot.sendImage({ to: 'user_id', file: new Uint8Array(imageBuffer) })
   * ```
   */
  async sendImage(options: SendMediaOptions): Promise<string> {
    return this.sendMediaMessage(options, 'image', MessageItemType.IMAGE)
  }

  /**
   * Send a video message. Handles CDN upload and encryption automatically.
   *
   * @param options - Send media options (file as Uint8Array/ArrayBuffer)
   * @returns The client-generated message ID
   */
  async sendVideo(options: SendMediaOptions): Promise<string> {
    return this.sendMediaMessage(options, 'video', MessageItemType.VIDEO)
  }

  /**
   * Send a file attachment. Handles CDN upload and encryption automatically.
   *
   * @param options - Send media options (file as Uint8Array/ArrayBuffer, fileName recommended)
   * @returns The client-generated message ID
   *
   * @example
   * ```ts
   * await bot.sendFile({ to: 'user_id', file: pdfBuffer, fileName: 'report.pdf' })
   * ```
   */
  async sendFile(options: SendMediaOptions): Promise<string> {
    return this.sendMediaMessage(options, 'file', MessageItemType.FILE)
  }

  private async sendMediaMessage(
    options: SendMediaOptions,
    mediaType: 'image' | 'video' | 'file',
    itemType: typeof MessageItemType[keyof typeof MessageItemType],
  ): Promise<string> {
    const clientId = generateId('weixin-bot')
    const contextToken = options.contextToken ?? this.contextTokens.get(options.to)
    const file = options.file instanceof Uint8Array ? options.file : new Uint8Array(options.file)

    // Upload to CDN
    const uploaded = await uploadMedia({
      file,
      toUserId: options.to,
      mediaType,
      apiOptions: {
        baseUrl: this._baseUrl,
        token: this._token,
        timeoutMs: this.config.apiTimeoutMs,
        version: this.config.version,
      },
      cdnBaseUrl: this._cdnBaseUrl,
    })

    // Build media CDN reference
    const media: CDNMedia = {
      encrypt_query_param: uploaded.downloadParam,
      aes_key: toBase64(fromHex(uploaded.aesKeyHex)),
      encrypt_type: 1,
    }

    // Build the message item based on type
    const mediaItem: MessageItem = { type: itemType }
    if (itemType === MessageItemType.IMAGE) {
      mediaItem.image_item = { media, mid_size: uploaded.fileSizeCiphertext }
    }
    else if (itemType === MessageItemType.VIDEO) {
      mediaItem.video_item = { media, video_size: uploaded.fileSizeCiphertext }
    }
    else {
      mediaItem.file_item = {
        media,
        file_name: options.fileName ?? 'file',
        len: String(uploaded.fileSize),
      }
    }

    // Assemble item list (optional text caption + media)
    const itemList: MessageItem[] = []
    if (options.text) {
      itemList.push({ type: MessageItemType.TEXT, text_item: { text: options.text } })
    }
    itemList.push(mediaItem)

    await sendMessage({
      baseUrl: this._baseUrl,
      token: this._token,
      timeoutMs: this.config.apiTimeoutMs,
      appId: this.config.appId,
      version: this.config.version,
      body: {
        msg: {
          from_user_id: '',
          to_user_id: options.to,
          client_id: clientId,
          message_type: MessageType.BOT,
          message_state: MessageState.FINISH,
          item_list: itemList,
          context_token: contextToken,
        },
      },
    })

    return clientId
  }

  /**
   * Send a typing indicator to a user.
   * Requires a valid typing ticket (fetched automatically via getConfig).
   *
   * @param userId - The user to show typing to
   * @param status - Typing status (defaults to TYPING)
   *
   * @example
   * ```ts
   * await bot.sendTyping('user_id')
   * // ... do work ...
   * await bot.sendTyping('user_id', TypingStatus.CANCEL)
   * ```
   */
  async sendTyping(userId: string, status?: typeof TypingStatus[keyof typeof TypingStatus]): Promise<void> {
    let ticket = this.typingTickets.get(userId)

    // Auto-fetch typing ticket if not cached
    if (!ticket) {
      const config = await this.getConfigForUser(userId)
      ticket = config.typing_ticket
      if (ticket) {
        this.typingTickets.set(userId, ticket)
      }
    }

    if (!ticket)
      return // No ticket available, silently skip

    await sendTypingApi({
      baseUrl: this._baseUrl,
      token: this._token,
      appId: this.config.appId,
      version: this.config.version,
      body: {
        ilink_user_id: userId,
        typing_ticket: ticket,
        status: status ?? TypingStatus.TYPING,
      },
    })
  }

  /**
   * Fetch bot configuration for a specific user.
   * Useful for getting the typing ticket.
   *
   * @param userId - The iLink user ID
   * @param contextToken - Optional context token
   */
  async getConfigForUser(userId: string, contextToken?: string): Promise<GetConfigResp> {
    return await getConfig({
      baseUrl: this._baseUrl,
      token: this._token,
      appId: this.config.appId,
      version: this.config.version,
      ilinkUserId: userId,
      contextToken: contextToken ?? this.contextTokens.get(userId),
    })
  }

  /**
   * Manually call getUpdates for custom polling logic.
   * Most users should use `start()` instead for automatic polling.
   *
   * @param getUpdatesBuf - The context buffer from the previous response
   * @returns Array of new messages
   */
  async getUpdates(getUpdatesBuf?: string): Promise<WeixinMessage[]> {
    const resp = await getUpdatesApi({
      baseUrl: this._baseUrl,
      token: this._token,
      timeoutMs: this.config.longPollTimeoutMs,
      getUpdatesBuf: getUpdatesBuf ?? '',
      appId: this.config.appId,
      version: this.config.version,
    })
    return resp.msgs ?? []
  }

  /**
   * Get the cached context token for a user.
   * Context tokens are automatically cached from incoming messages.
   */
  getContextToken(userId: string): string | undefined {
    return this.contextTokens.get(userId)
  }

  private handleMessages(msgs: WeixinMessage[]): void {
    for (const msg of msgs) {
      // Skip bot's own messages (only process user messages)
      if (msg.message_type === MessageType.BOT)
        continue

      // Cache context token from incoming messages
      if (msg.context_token && msg.from_user_id) {
        this.contextTokens.set(msg.from_user_id, msg.context_token)
      }
      this.emit('message', msg)
    }
  }
}
