/**
 * 微信 Bot AI 对话示例：接入 DeepSeek，支持多轮上下文
 *
 * 运行：
 *   DEEPSEEK_API_KEY=sk-xxx pnpm start
 *
 * 环境变量：
 *   - DEEPSEEK_API_KEY（必需）— DeepSeek API 密钥
 *   - DEEPSEEK_MODEL（可选）— 模型名称，默认 deepseek-v4-flash
 *   - DEEPSEEK_MAX_HISTORY（可选）— 每用户最大历史条数，默认 20
 */
import type OpenAI from 'openai'
import process from 'node:process'

import { TypingStatus } from '@weixin-ts/bot'
import consola from 'consola'

import { colors } from 'consola/utils'
import _OpenAI from 'openai'
import { createBot, getText, logBaseUrl, login, run, setupListeners } from '../../shared'

// ------------------------------------------------------------------
// Config
// ------------------------------------------------------------------

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY?.trim()
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-v4-flash'
const MAX_HISTORY = Number(process.env.DEEPSEEK_MAX_HISTORY) || 20

if (!DEEPSEEK_API_KEY) {
  consola.error('请设置环境变量 DEEPSEEK_API_KEY')
  process.exit(1)
}

const openai = new _OpenAI({
  apiKey: DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

// ------------------------------------------------------------------
// Conversation history (in-memory, per user)
// ------------------------------------------------------------------

type Message = OpenAI.ChatCompletionMessageParam
const conversations = new Map<string, Message[]>()

function getHistory(userId: string): Message[] {
  if (!conversations.has(userId))
    conversations.set(userId, [])
  return conversations.get(userId)!
}

function addMessage(userId: string, role: 'user' | 'assistant', content: string): void {
  const history = getHistory(userId)
  history.push({ role, content })

  // Trim to max history (keep recent messages)
  while (history.length > MAX_HISTORY)
    history.shift()
}

function clearHistory(userId: string): void {
  conversations.delete(userId)
}

// ------------------------------------------------------------------
// DeepSeek API call
// ------------------------------------------------------------------

async function chat(userId: string, userMessage: string): Promise<string> {
  addMessage(userId, 'user', userMessage)

  const response = await openai.chat.completions.create({
    model: DEEPSEEK_MODEL,
    messages: getHistory(userId),
  })

  const reply = response.choices[0]?.message?.content?.trim()
  if (!reply)
    throw new Error('DeepSeek 返回空回复')

  addMessage(userId, 'assistant', reply)
  return reply
}

// ------------------------------------------------------------------
// Bot setup
// ------------------------------------------------------------------

const bot = createBot()

async function main(): Promise<void> {
  consola.box(`${colors.bold('WeChat Bot — AI Chat Demo')}\n${colors.gray(`模型: ${DEEPSEEK_MODEL} | 上下文: ${MAX_HISTORY} 条`)}`)
  logBaseUrl()

  await login(bot)
  setupListeners(bot)

  bot.on('message', async (msg) => {
    const from = msg.from_user_id
    const text = getText(msg)

    if (!from || !text)
      return

    consola.info(`${colors.green('收到')} ${colors.gray(`[${from}]`)} ${text}`)

    // /clear command to reset conversation
    if (text.toLowerCase() === '/clear') {
      clearHistory(from)
      await bot.sendText({ to: from, text: '对话已重置 ✨' })
      consola.success(`${colors.gray(`[${from}]`)} 对话历史已清除`)
      return
    }

    try {
      await bot.sendTyping(from)
      const reply = await chat(from, text)
      await bot.sendTyping(from, TypingStatus.CANCEL)

      await bot.sendText({ to: from, text: reply })
      consola.success(`${colors.cyan('回复')} ${colors.gray(`[${from}]`)} ${reply.slice(0, 60)}${reply.length > 60 ? '...' : ''}`)
    }
    catch (err) {
      await bot.sendTyping(from, TypingStatus.CANCEL)
      const message = err instanceof Error ? err.message : String(err)
      consola.error(`AI 调用失败: ${message}`)
      await bot.sendText({ to: from, text: `AI 调用失败: ${message}` })
    }
  })

  await bot.start()
}

run(main)
