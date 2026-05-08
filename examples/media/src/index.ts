/**
 * 微信 Bot 媒体示例：发送文件与图片
 */
import type { WeixinMessage } from '@weixin-ts/bot'
import process from 'node:process'

import { MessageItemType, TypingStatus, WeixinBot } from '@weixin-ts/bot'
import { consola } from 'consola'
import { colors } from 'consola/utils'
// @ts-expect-error qrcode-terminal has no bundled types
import qrcodeTerminal from 'qrcode-terminal'

const token = process.env.WEIXIN_BOT_TOKEN?.trim()
const baseUrl = process.env.WEIXIN_BASE_URL?.trim()
const defaultImageUrl = process.env.WEIXIN_IMAGE_URL?.trim()

const bot = new WeixinBot({
  ...(token ? { token } : { session: '.weixin-bot.session.json' }),
  ...(baseUrl ? { baseUrl } : {}),
})

const HELP_TEXT = [
  'Media commands:',
  '/media-help - Show this help message',
  '/file - Send a generated text file',
  '/image <url> - Download an image URL and send it back',
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

async function fetchBinary(url: string): Promise<Uint8Array> {
  const res = await fetch(url)
  if (!res.ok)
    throw new Error(`Download failed: ${res.status} ${res.statusText}`)

  return new Uint8Array(await res.arrayBuffer())
}

async function sendGeneratedFile(to: string): Promise<void> {
  const content = [
    'weixin-ts media demo',
    `Generated at: ${new Date().toISOString()}`,
    '',
    'This file was sent with bot.sendFile().',
  ].join('\n')

  await bot.sendFile({
    to,
    file: new TextEncoder().encode(content),
    fileName: 'weixin-ts-demo.txt',
    text: 'Here is a generated text file.',
  })
}

async function sendImageFromUrl(to: string, url: string): Promise<void> {
  const image = await fetchBinary(url)
  await bot.sendImage({
    to,
    file: image,
    text: `Image from ${url}`,
  })
}

async function handleCommand(from: string, text: string): Promise<void> {
  const [command = '', ...args] = text.split(/\s+/)
  const normalized = command.toLowerCase()

  switch (normalized) {
    case '/media-help':
    case '/help':
      await bot.sendText({ to: from, text: HELP_TEXT })
      break

    case '/file':
      await bot.sendTyping(from)
      await sendGeneratedFile(from)
      await bot.sendTyping(from, TypingStatus.CANCEL)
      break

    case '/image': {
      const imageUrl = args.join(' ') || defaultImageUrl
      if (!imageUrl) {
        await bot.sendText({
          to: from,
          text: 'Usage: /image <url>\nYou can also set WEIXIN_IMAGE_URL.',
        })
        break
      }

      await bot.sendTyping(from)
      await sendImageFromUrl(from, imageUrl)
      await bot.sendTyping(from, TypingStatus.CANCEL)
      break
    }

    default:
      if (text.startsWith('/')) {
        await bot.sendText({
          to: from,
          text: `Unknown media command: ${command}\n\n${HELP_TEXT}`,
        })
      }
  }
}

async function main(): Promise<void> {
  consola.box(`${colors.bold('WeChat Bot — Media Demo')}\n${colors.gray('发送 /media-help 查看命令列表')}`)
  if (baseUrl)
    consola.info(`API Base URL: ${colors.cyan(baseUrl)}`)
  if (defaultImageUrl)
    consola.info(`Default image URL: ${colors.cyan(defaultImageUrl)}`)

  await login()

  bot.on('connected', () => {
    consola.ready(`正在监听媒体命令... ${colors.gray('(Ctrl+C 退出)')}\n`)
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

    try {
      await handleCommand(from, text)
    }
    catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      consola.error(message)
      await bot.sendText({ to: from, text: `Media command failed: ${message}` })
      await bot.sendTyping(from, TypingStatus.CANCEL)
    }
  })

  await bot.start()
}

main().catch((err: unknown): never => {
  consola.error(err)
  process.exit(1)
})
