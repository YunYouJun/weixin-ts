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

function normalizeHttpUrl(input: string): string {
  let url: URL
  try {
    url = new URL(input)
  }
  catch {
    throw new Error('Invalid URL, please pass a full http(s) link.')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    throw new Error('Invalid URL, please pass a full http(s) link.')

  return url.toString()
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

  consola.start('Uploading file to CDN...')
  await bot.sendFile({
    to,
    file: new TextEncoder().encode(content),
    fileName: 'weixin-ts-demo.txt',
  })
  consola.success('File sent!')
}

async function sendImageFromUrl(to: string, url: string): Promise<void> {
  const imageUrl = normalizeHttpUrl(url)
  consola.start(`Downloading image: ${colors.cyan(imageUrl)}`)
  const image = await fetchBinary(imageUrl)
  consola.start(`Downloaded ${image.length} bytes, uploading to CDN...`)
  await bot.sendImage({
    to,
    file: image,
  })
  consola.success('Image sent!')
}

function getMediaErrorHint(message: string): string | undefined {
  if (message.includes('Unexpected end of JSON input'))
    return 'Hint: rebuild packages with pnpm -r build; this usually means old dist code parsed an empty CDN/API response as JSON.'

  if (message.includes('timed out'))
    return 'Hint: CDN upload timed out. Check network connectivity to the CDN endpoint.'

  if (message.includes('getUploadUrl') || message.includes('CDN upload'))
    return 'Hint: check WEIXIN_BASE_URL, WEIXIN_BOT_TOKEN, and CDN network reachability.'
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
      const hint = getMediaErrorHint(message)
      consola.error(message)
      if (hint)
        consola.info(colors.gray(hint))

      await bot.sendText({
        to: from,
        text: `Media command failed: ${message}${hint ? `\n${hint}` : ''}`,
      })
      await bot.sendTyping(from, TypingStatus.CANCEL)
    }
  })

  await bot.start()
}

run(main)
