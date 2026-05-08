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

async function main(): Promise<void> {
  const authHint = token
    ? '使用 WEIXIN_BOT_TOKEN，跳过扫码登录'
    : 'Token 自动持久化，下次无需重新扫码'
  consola.box(`${colors.bold('WeChat Bot — Echo Demo')}\n${colors.gray(authHint)}`)

  if (baseUrl)
    consola.info(`API Base URL: ${colors.cyan(baseUrl)}`)

  // ---------------------------------------------------------------
  // Login: 优先使用环境变量 Token；否则有 session 直接加载，没有则扫码
  // ---------------------------------------------------------------
  if (token) {
    consola.success('已从 WEIXIN_BOT_TOKEN 加载 Token')
  }
  else {
    const result = await bot.login({
      onQrCode: (url) => {
        consola.success('登录二维码已生成')
        qrcodeTerminal.generate(url, { small: true })
        consola.info(`请用微信扫码: ${colors.underline(colors.cyan(url))}`)
        consola.start('等待扫码确认...')
      },
      onScanned: () => consola.info(colors.yellow('已扫码，请在微信中确认...')),
      onQrRefresh: (url) => {
        consola.info('二维码已刷新')
        qrcodeTerminal.generate(url, { small: true })
        consola.info(`请用微信扫码: ${colors.underline(colors.cyan(url))}`)
      },
    })

    if (!result.success) {
      consola.error(`登录失败: ${colors.red(result.message)}`)
      process.exit(1)
    }

    consola.success(`登录成功 ${colors.gray(`(${result.message})`)}`)
    if (result.accountId) {
      consola.log(colors.gray(`  Account: ${result.accountId}`))
      consola.log(colors.gray(`  User:    ${result.userId ?? 'unknown'}`))
    }
  }

  // ---------------------------------------------------------------
  // Echo Bot
  // ---------------------------------------------------------------
  bot.on('connected', () => {
    consola.ready(`正在监听消息... ${colors.gray('(Ctrl+C 退出)')}\n`)
  })

  bot.on('error', err => consola.warn(err.message))

  bot.on('session:expired', () => {
    consola.error('Session 过期，请删除 .weixin-bot.session.json 后重新运行')
    process.exit(1)
  })

  bot.on('message', async (msg) => {
    const from = msg.from_user_id
    const textItem = msg.item_list?.find(i => i.type === MessageItemType.TEXT)
    const text = textItem?.text_item?.text

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

main().catch((err: unknown): never => {
  consola.error(err)
  process.exit(1)
})
