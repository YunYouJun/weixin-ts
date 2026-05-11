/**
 * Shared utilities for weixin-ts examples.
 *
 * Extracts common boilerplate (bot creation, login, event listeners)
 * so each example can focus on its unique logic.
 */
import type { WeixinMessage } from '@weixin-ts/bot'
import process from 'node:process'

import { MessageItemType, WeixinBot } from '@weixin-ts/bot'
import { fileSession } from '@weixin-ts/bot/node'
import { consola } from 'consola'
import { colors } from 'consola/utils'
// @ts-expect-error qrcode-terminal has no bundled types
import qrcodeTerminal from 'qrcode-terminal'

export interface CreateBotOptions {
  /** Override the default session file path */
  session?: string
}

/**
 * Create a WeixinBot instance from environment variables.
 *
 * - `WEIXIN_BOT_TOKEN` — use token auth (skip QR login)
 * - `WEIXIN_BASE_URL` — custom API base URL
 */
export function createBot(options?: CreateBotOptions): WeixinBot {
  const token = process.env.WEIXIN_BOT_TOKEN?.trim()
  const baseUrl = process.env.WEIXIN_BASE_URL?.trim()
  const isDebug = !!process.env.WEIXIN_DEBUG
  if (isDebug)
    consola.level = 5

  const debug = isDebug
    ? (...args: unknown[]) => {
        consola.debug(args.length === 1 ? args[0] : args)
      }
    : undefined

  return new WeixinBot({
    ...(token ? { token } : { session: fileSession(options?.session ?? '.weixin-bot.session.json') }),
    ...(baseUrl ? { baseUrl } : {}),
    debug,
  })
}

/**
 * Login via token (if set) or QR code scan.
 */
export async function login(bot: WeixinBot): Promise<void> {
  const token = process.env.WEIXIN_BOT_TOKEN?.trim()

  if (token) {
    consola.success('已从 WEIXIN_BOT_TOKEN 加载 Token')
    return
  }

  const result = await bot.login({
    onQrCode: (url) => {
      consola.success('登录二维码已生成')
      qrcodeTerminal.generate(url, { small: true })
      consola.info(`请用微信扫码: ${colors.underline(colors.cyan(url))}`)
    },
    onScanned: () => consola.info(colors.yellow('已扫码，请在微信中确认...')),
    onQrRefresh: (url) => {
      consola.info('二维码已刷新')
      qrcodeTerminal.generate(url, { small: true })
    },
  })

  if (!result.success)
    throw new Error(result.message)

  consola.success(`登录成功 ${colors.gray(`(${result.message})`)}`)
  if (result.accountId) {
    consola.log(colors.gray(`  Account: ${result.accountId}`))
    consola.log(colors.gray(`  User:    ${result.userId ?? 'unknown'}`))
  }
}

/**
 * Register common event listeners (connected, error, session:expired).
 */
export function setupListeners(bot: WeixinBot): void {
  bot.on('connected', () => {
    consola.ready(`正在监听消息... ${colors.gray('(Ctrl+C 退出)')}\n`)
  })

  bot.on('error', err => consola.warn(err.message))

  bot.on('session:expired', () => {
    consola.error('Session 过期，已自动删除本地 session，请重新运行并扫码登录')
    process.exit(1)
  })
}

/**
 * Extract text content from a WeixinMessage.
 */
export function getText(msg: WeixinMessage): string | undefined {
  return msg.item_list?.find(i => i.type === MessageItemType.TEXT)?.text_item?.text?.trim()
}

/**
 * Log base URL info (call after bot creation).
 */
export function logBaseUrl(): void {
  const baseUrl = process.env.WEIXIN_BASE_URL?.trim()
  if (baseUrl)
    consola.info(`API Base URL: ${colors.cyan(baseUrl)}`)
}

/**
 * Standard main() error wrapper.
 */
export function run(main: () => Promise<void>): void {
  main().catch((err: unknown): never => {
    consola.error(err)
    process.exit(1)
  })
}
