<script setup lang="ts">
import type { ChatMessage, ConnectionStatus } from './composables/demo-types'
import { nextTick, ref, watch } from 'vue'
import { shortId, useI18n } from './composables/demo-messages'

const props = defineProps<{
  chatMessages: ChatMessage[]
  connectionStatus: ConnectionStatus
  connectionStatusLabel: string
  selectedUserPreview: string
  draft: string
  canSend: boolean
  sendDisabledReason: string
  loading: boolean
}>()

const emit = defineEmits<{
  send: []
  'update:draft': [value: string]
}>()

const { t } = useI18n()
const chatWindow = ref<HTMLElement>()

function scrollToBottom() {
  nextTick(() => {
    const el = chatWindow.value
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  })
}

watch(() => props.chatMessages.length, () => {
  scrollToBottom()
})

function onSubmit() {
  emit('send')
}
</script>

<template>
  <section class="wechat-panel">
    <!-- Top navigation bar -->
    <div class="wx-navbar">
      <span class="wx-navbar-title">{{ selectedUserPreview }}</span>
      <span class="wx-status-dot" :class="connectionStatus" :title="connectionStatusLabel" />
    </div>

    <!-- Chat messages area -->
    <div ref="chatWindow" class="wx-chat-window">
      <div v-if="!chatMessages.length" class="wx-empty">
        {{ t.chatPlaceholder }}
      </div>
      <template v-else>
        <div v-for="message in chatMessages" :key="message.id" class="wx-message" :class="message.role">
          <!-- System message -->
          <div v-if="message.role === 'system'" class="wx-system-label">
            {{ message.text }}
          </div>
          <!-- User / Bot message -->
          <template v-else>
            <div class="wx-bubble" :class="message.role">
              <p>{{ message.text }}</p>
              <span class="wx-time">{{ message.time }}<template v-if="message.userId"> · {{ shortId(message.userId, '') }}</template></span>
            </div>
          </template>
        </div>
      </template>
    </div>

    <!-- Bottom input bar -->
    <form class="wx-input-bar" @submit.prevent="onSubmit">
      <input
        :value="draft"
        class="wx-input"
        :placeholder="t.inputPlaceholder"
        :disabled="connectionStatus !== 'connected'"
        autocomplete="off"
        @input="emit('update:draft', ($event.target as HTMLInputElement).value)"
      >
      <button class="wx-send-btn" type="submit" :disabled="loading || !canSend">
        {{ t.send }}
      </button>
    </form>
    <p v-if="sendDisabledReason" class="wx-hint">
      {{ sendDisabledReason }}
    </p>
  </section>
</template>

<style scoped>
.wechat-panel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  background: #ededed;
  min-height: 480px;
}

:root.dark .wechat-panel {
  background: #111111;
}

/* Navbar */
.wx-navbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  height: 44px;
  padding: 0 0.75rem;
  background: #f7f7f7;
  border-bottom: 1px solid var(--vp-c-divider);
  position: relative;
}

:root.dark .wx-navbar {
  background: #1a1a1a;
}

.wx-navbar-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif;
}

.wx-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-text-3);
  transition: background 0.3s;
}

.wx-status-dot.connected {
  background: #07c160;
}

.wx-status-dot.connecting {
  background: #ffc300;
  animation: pulse 1.2s infinite;
}

.wx-status-dot.error {
  background: #fa5151;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Chat window */
.wx-chat-window {
  flex: 1;
  min-height: 320px;
  overflow-y: auto;
  padding: 0.75rem;
  scroll-behavior: smooth;
}

.wx-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  color: #b2b2b2;
  font-size: 0.8125rem;
  text-align: center;
  padding: 1rem;
}

/* Messages */
.wx-message {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.625rem;
}

.wx-message.user {
  justify-content: flex-start;
}

.wx-message.bot {
  justify-content: flex-end;
}

.wx-message.system {
  justify-content: center;
}

/* Bubbles */
.wx-bubble {
  max-width: min(86%, 320px);
  padding: 0.45rem 0.625rem;
  border-radius: 4px 8px 8px 8px;
  background: #ffffff;
  color: #111111;
  font-size: 0.875rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  position: relative;
}

:root.dark .wx-bubble {
  background: #2a2a2a;
  color: #e8e8e8;
}

.wx-bubble.bot {
  border-radius: 8px 4px 8px 8px;
  background: #95ec69;
  color: #10220d;
}

:root.dark .wx-bubble.bot {
  background: #3eb575;
  color: #0f2a10;
}

.wx-bubble p {
  margin: 0;
}

.wx-time {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.625rem;
  opacity: 0.55;
}

/* System message */
.wx-system-label {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.06);
  color: #999999;
  font-size: 0.6875rem;
  text-align: center;
  max-width: 80%;
}

:root.dark .wx-system-label {
  background: rgba(255, 255, 255, 0.06);
  color: #666666;
}

/* Input bar */
.wx-input-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f7f7f7;
  border-top: 1px solid var(--vp-c-divider);
}

:root.dark .wx-input-bar {
  background: #1a1a1a;
}

.wx-input {
  flex: 1;
  min-width: 0;
  height: 36px;
  padding: 0 0.75rem;
  border: none;
  border-radius: 18px;
  background: #ffffff;
  color: #111111;
  font-size: 0.875rem;
  outline: none;
  transition: box-shadow 0.2s;
}

:root.dark .wx-input {
  background: #2a2a2a;
  color: #e8e8e8;
}

.wx-input:focus {
  box-shadow: 0 0 0 2px rgba(7, 193, 96, 0.25);
}

.wx-input::placeholder {
  color: #b2b2b2;
}

.wx-input:disabled {
  opacity: 0.5;
}

.wx-send-btn {
  flex: 0 0 auto;
  padding: 0.375rem 0.875rem;
  border: none;
  border-radius: 18px;
  background: #07c160;
  color: #ffffff;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.wx-send-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.wx-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.wx-hint {
  margin: 0;
  padding: 0.2rem 0.75rem 0.4rem;
  background: #f7f7f7;
  color: #b2b2b2;
  font-size: 0.6875rem;
  line-height: 1.4;
}

:root.dark .wx-hint {
  background: #1a1a1a;
}
</style>
