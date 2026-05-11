<script setup lang="ts">
import { useI18n } from './demo/composables/demo-messages'
import { useBot } from './demo/composables/useBot'
import QrLoginPanel from './demo/QrLoginPanel.vue'
import WeChatPanel from './demo/WeChatPanel.vue'

const { t } = useI18n()
const bot = useBot()
</script>

<template>
  <div v-if="bot.isDev" class="send-text-demo">
    <div class="demo-header">
      <div>
        <p class="demo-eyebrow">
          {{ t.eyebrow }}
        </p>
        <h3>{{ t.title }}</h3>
      </div>
      <p class="demo-note">
        {{ t.devNote }}
      </p>
    </div>

    <div class="demo-grid">
      <QrLoginPanel
        :qr-canvas="bot.qrCanvas"
        :qr-code-content="bot.qrCodeContent.value"
        :login-loading="bot.loginLoading.value"
        :login-status="bot.loginStatus.value"
        :login-message="bot.loginMessage.value"
        :login-status-label="bot.loginStatusLabel.value"
        :connection-status="bot.connectionStatus.value"
        :token="bot.token.value"
        :show-token="bot.showToken.value"
        :token-preview="bot.tokenPreview.value"
        :base-url="bot.baseUrl.value"
        :can-start-listening="bot.canStartListening.value"
        @generate-qr="bot.generateTokenByQr()"
        @start-bot="bot.startBot()"
        @stop-bot="bot.stopBot()"
        @copy-token="bot.copyToken()"
        @update:token="bot.token.value = $event"
        @update:show-token="bot.showToken.value = $event"
        @update:base-url="bot.baseUrl.value = $event"
      />

      <WeChatPanel
        :chat-messages="bot.chatMessages.value"
        :connection-status="bot.connectionStatus.value"
        :connection-status-label="bot.connectionStatusLabel.value"
        :selected-user-preview="bot.selectedUserPreview.value"
        :draft="bot.draft.value"
        :can-send="bot.canSend.value"
        :send-disabled-reason="bot.sendDisabledReason.value"
        :loading="bot.loading.value"
        @send="bot.send()"
        @update:draft="bot.draft.value = $event"
      />
    </div>

    <div v-if="bot.result.value" class="demo-result" :class="bot.result.value.ok ? 'success' : 'error'">
      {{ bot.result.value.message }}
    </div>
  </div>
</template>

<style scoped>
.send-text-demo {
  margin: 1.5rem 0;
  padding: 1rem;
  border-radius: 14px;
  border: 1px solid var(--vp-c-divider);
  background:
    radial-gradient(circle at top left, var(--vp-c-brand-soft), transparent 36%),
    var(--vp-c-bg-alt);
}

.demo-header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.875rem;
}

.demo-header h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--vp-c-text-1);
}

.demo-eyebrow {
  margin: 0 0 0.2rem;
  color: var(--vp-c-brand-1);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.demo-note {
  margin: 0;
  max-width: 18rem;
  text-align: right;
  color: var(--vp-c-text-2);
  font-size: 0.75rem;
  line-height: 1.4;
}

.demo-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 0.875rem;
}

.demo-result {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-family: var(--vp-font-family-mono);
  word-break: break-all;
}

.demo-result.success {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.demo-result.error {
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-1);
}

@media (max-width: 768px) {
  .demo-grid {
    grid-template-columns: 1fr;
  }

  .demo-header {
    flex-direction: column;
  }

  .demo-note {
    max-width: none;
    text-align: left;
  }
}
</style>
