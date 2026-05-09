# AI Chat Example

微信 Bot 接入 DeepSeek AI，支持多轮上下文对话。

## 快速开始

```bash
# 1. 复制环境变量
cp .env.example .env

# 2. 填入你的 DeepSeek API Key
#    获取地址: https://platform.deepseek.com/api_keys

# 3. 启动
pnpm start
```

## 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek API 密钥 |
| `DEEPSEEK_MODEL` | | 模型名称，默认 `deepseek-v4-flash` |
| `DEEPSEEK_MAX_HISTORY` | | 每用户最大历史条数，默认 `20` |
| `WEIXIN_BOT_TOKEN` | | 微信 Bot Token（跳过扫码） |
| `WEIXIN_BASE_URL` | | 自定义 API 地址 |

## 功能

- 收到任何文本消息 → 调用 DeepSeek API → 回复 AI 生成的回答
- 每个用户独立维护对话上下文（内存中保留最近 N 条）
- 发送 `/clear` 可重置对话历史
- 调用 API 期间显示"正在输入"状态

## 换用其他模型

DeepSeek API 兼容 OpenAI 格式。如需换成其他兼容服务（如 Moonshot、通义千问），只需修改 `src/index.ts` 中的 `baseURL` 即可。
