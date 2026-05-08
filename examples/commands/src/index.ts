/**
 * 微信 Bot 命令示例：/help、/ping、/echo、/id
 */
import type { WeixinMessage } from '@weixin-ts/bot'
import process from 'node:process'

import { MessageItemType, WeixinBot } from '@weixin-ts/bot'
import { consola } from 'consola'
import { colors } from 'consola/utils'
// @ts-expect-error qrcode-terminal has no bundled types
import qrcodeTerminal from 'qrcode-terminal'

const token = process.env.WEIXIN_BOT_TOKEN?.trim()
const baseUrl = process.env.WEIXIN_BASE_URL?.trim()

const bot = new WeixinBot({
  ...(token ? { token } : { session: '.weixin-bot.session.json' }),
  ...(baseUrl ? { baseUrl } : {}),
})

const HELP_TEXT = [
  'Available commands:',
  '/help - Show this help message',
  '/ping - Reply with pong',
  '/echo <text> - Echo custom text',
  '/id - Show your sender ID',
].join('\n')

function getText(msg: WeixinMessage): string | undefined {
  return msg.item_list?.find(i => i.type === MessageItemType.TEXT)?.text_item?.text?.trim()
}

async function login(): Promise<void> {
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
}

async function handleCommand(from: string, text: string): Promise<void> {
  const [command = '', ...args] = text.split(/\s+/)
  const normalized = command.toLowerCase()

  switch (normalized) {
    case '/help':
      await bot.sendText({ to: from, text: HELP_TEXT })
      break

    case '/ping':
      await bot.sendText({ to: from, text: 'pong' })
      break

    case '/echo': {
      const content = args.join(' ')
      await bot.sendText({
        to: from,
        text: content || 'Usage: /echo <text>',
      })
      break
    }

    case '/id':
      await bot.sendText({ to: from, text: `Your sender ID: ${from}` })
      break

    default:
      if (text.startsWith('/')) {
        await bot.sendText({
          to: from,
          text: `Unknown command: ${command}\n\n${HELP_TEXT}`,
        })
      }
      else {
        await bot.sendText({
          to: from,
          text: `Send /help to see available commands.\n\nEcho: ${text}`,
        })
      }
  }
}

async function main(): Promise<void> {
  consola.box(`${colors.bold('WeChat Bot — Commands Demo')}\n${colors.gray('发送 /help 查看命令列表')}`)
  if (baseUrl)
    consola.info(`API Base URL: ${colors.cyan(baseUrl)}`)

  await login()

  bot.on('connected', () => {
    consola.ready(`正在监听命令... ${colors.gray('(Ctrl+C 退出)')}\n`)
  })

  bot.on('error', err => consola.warn(err.message))

  bot.on('session:expired', () => {
    consola.error('Session 过期，请删除 .weixin-bot.session.json 后重新运行')
    process.exit(1)
  })

  bot.on('message', async (msg) => {
    const from = msg.from_user_id
    const text = getText(msg)

    if (!from || !text)
      return

    consola.info(`${colors.green('收到')} ${colors.gray(`[${from}]`)} ${text}`)
    await handleCommand(from, text)
  })

  await bot.start()
}

main().catch((err: unknown): never => {
  consola.error(err)
  process.exit(1)
})
