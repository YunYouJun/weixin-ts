import process from 'node:process'

/**
 * 微信 Bot 媒体示例：发送文件与图片
 */
import { TypingStatus } from '@weixin-ts/bot'
import { consola } from 'consola'
import { colors } from 'consola/utils'

import { createBot, getText, logBaseUrl, login, run, setupListeners } from '../../shared'

const bot = createBot()
const defaultImageUrl = process.env.WEIXIN_IMAGE_URL?.trim()

const HELP_TEXT = [
  'Media commands:',
  '/media-help - Show this help message',
  '/file - Send a generated text file',
  '/image <url> - Download an image URL and send it back',
].join('\n')

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
  logBaseUrl()
  if (defaultImageUrl)
    consola.info(`Default image URL: ${colors.cyan(defaultImageUrl)}`)

  await login(bot)
  setupListeners(bot)

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

run(main)
