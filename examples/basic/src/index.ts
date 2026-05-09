/**
 * 微信 Bot 最小示例：扫码登录 / 环境变量 Token + Echo Bot
 *
 * 运行：
 *   pnpm start
 *
 * 特点：
 *   - 设置 WEIXIN_BOT_TOKEN 时直接启动，无需扫码
 *   - 未设置 Token 时首次运行扫码登录
 *   - Token 自动保存到 .weixin-bot.session.json
 *   - 再次运行直接启动，无需重新扫码
 */
import process from 'node:process'
import { consola } from 'consola'
import { colors } from 'consola/utils'
import { createBot, getText, logBaseUrl, login, run, setupListeners } from '../../shared'

const bot = createBot()

async function main(): Promise<void> {
  const token = process.env.WEIXIN_BOT_TOKEN?.trim()
  const authHint = token
    ? '使用 WEIXIN_BOT_TOKEN，跳过扫码登录'
    : 'Token 自动持久化，下次无需重新扫码'
  consola.box(`${colors.bold('WeChat Bot — Echo Demo')}\n${colors.gray(authHint)}`)
  logBaseUrl()

  await login(bot)
  setupListeners(bot)

  bot.on('message', async (msg) => {
    const from = msg.from_user_id
    const text = getText(msg)

    if (!from) {
      consola.warn('收到无发送者消息，已跳过')
      return
    }

    if (text) {
      const sender = colors.gray(`[${from}]`)
      consola.info(`${colors.green('收到')} ${sender} ${text}`)
      await bot.sendText({ to: from, text: `Echo: ${text}` })
      consola.success(`${colors.cyan('回复')} ${sender} Echo: ${text}`)
    }
  })

  bot.start()
}

run(main)
