import { consola } from 'consola'
import { colors } from 'consola/utils'

/**
 * 微信 Bot 命令示例：/help、/ping、/echo、/id
 */
import { createBot, getText, logBaseUrl, login, run, setupListeners } from '../../shared'

const bot = createBot()

const HELP_TEXT = [
  'Available commands:',
  '/help - Show this help message',
  '/ping - Reply with pong',
  '/echo <text> - Echo custom text',
  '/id - Show your sender ID',
].join('\n')

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
  logBaseUrl()

  await login(bot)
  setupListeners(bot)

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

run(main)
