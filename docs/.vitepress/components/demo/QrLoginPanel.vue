<script setup lang="ts">
import type { Ref } from 'vue'
import type { ConnectionStatus, LoginStatus } from './composables/demo-types'
import { useI18n } from './composables/demo-messages'

const props = defineProps<{
  qrCanvas: Ref<HTMLCanvasElement | undefined>
  qrCodeContent: string
  loginLoading: boolean
  loginStatus: LoginStatus
  loginMessage: string
  loginStatusLabel: string
  connectionStatus: ConnectionStatus
  token: string
  showToken: boolean
  tokenPreview: string
  baseUrl: string
  canStartListening: boolean
}>()

const emit = defineEmits<{
  generateQr: []
  startBot: []
  stopBot: []
  copyToken: []
  'update:token': [value: string]
  'update:showToken': [value: boolean]
  'update:baseUrl': [value: string]
}>()

const { t } = useI18n()

function setCanvasRef(el: any) {
  props.qrCanvas.value = el as HTMLCanvasElement | undefined
}
</script>

<template>
  <section class="qr-panel">
    <div class="qr-panel-head">
      <div>
        <h4>{{ t.loginTitle }}</h4>
        <p class="qr-panel-desc">
          {{ t.loginDescription }}
        </p>
      </div>
      <span class="status-pill" :class="loginStatus">{{ loginStatusLabel }}</span>
    </div>

    <div class="qr-box" :class="{ active: qrCodeContent }">
      <canvas v-show="qrCodeContent" :ref="setCanvasRef" class="qr-canvas" />
      <div v-if="!qrCodeContent" class="qr-placeholder">
        {{ t.qrPlaceholder }}
      </div>
    </div>

    <p class="login-msg" :class="loginStatus">
      {{ loginMessage || t.loginWaiting }}
    </p>

    <div class="qr-actions">
      <button class="btn-primary" :disabled="loginLoading" @click="emit('generateQr')">
        {{ loginLoading ? t.waitingForScan : t.generateQr }}
      </button>
      <button class="btn-secondary" :disabled="!canStartListening" @click="emit('startBot')">
        {{ t.startListening }}
      </button>
      <button class="btn-secondary" :disabled="connectionStatus !== 'connected' && connectionStatus !== 'connecting'" @click="emit('stopBot')">
        {{ t.stopListening }}
      </button>
      <button class="btn-secondary" :disabled="!token" @click="emit('copyToken')">
        {{ t.copyToken }}
      </button>
    </div>

    <div class="qr-fields">
      <label class="field-label">
        <span>{{ t.token }}</span>
        <div class="token-row">
          <input
            :value="token"
            :type="showToken ? 'text' : 'password'"
            name="bot-token"
            :placeholder="t.tokenPlaceholder"
            class="field-input"
            autocomplete="off"
            @input="emit('update:token', ($event.target as HTMLInputElement).value)"
          >
          <button class="btn-mini" type="button" :disabled="!token" @click="emit('update:showToken', !showToken)">
            {{ showToken ? t.hide : t.show }}
          </button>
        </div>
        <small>{{ tokenPreview }}</small>
      </label>

      <label class="field-label">
        <span>{{ t.baseUrl }}</span>
        <input
          :value="baseUrl"
          name="base-url"
          placeholder="https://ilinkai.weixin.qq.com"
          class="field-input"
          autocomplete="off"
          @input="emit('update:baseUrl', ($event.target as HTMLInputElement).value)"
        >
      </label>
    </div>
  </section>
</template>

<style scoped>
.qr-panel {
  padding: 0.875rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: color-mix(in srgb, var(--vp-c-bg) 88%, transparent);
}

.qr-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.qr-panel-head h4 {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--vp-c-text-1);
}

.qr-panel-desc {
  margin: 0.125rem 0 0;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  line-height: 1.4;
}

.status-pill {
  flex: 0 0 auto;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
}

.status-pill.waiting,
.status-pill.scanned,
.status-pill.connecting {
  background: var(--vp-c-warning-soft);
  color: var(--vp-c-warning-1);
}

.status-pill.success,
.status-pill.connected {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.status-pill.error {
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-1);
}

.qr-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 198px;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
}

.qr-box.active {
  border-style: solid;
}

.qr-canvas {
  width: 180px;
  height: 180px;
  border-radius: 8px;
}

.qr-placeholder {
  max-width: 11rem;
  color: var(--vp-c-text-3);
  font-size: 0.8125rem;
  text-align: center;
}

.login-msg {
  min-height: 2rem;
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  line-height: 1.4;
}

.login-msg.error {
  color: var(--vp-c-danger-1);
}

.login-msg.success {
  color: var(--vp-c-brand-1);
}

.qr-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.btn-primary,
.btn-secondary,
.btn-mini {
  border: none;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, background-color 0.2s;
}

.btn-primary {
  padding: 0.35rem 0.75rem;
  background: var(--vp-c-brand-1);
  color: #fff;
}

.btn-secondary {
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.btn-mini {
  flex: 0 0 auto;
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.75rem;
}

.btn-primary:hover:not(:disabled),
.btn-secondary:hover:not(:disabled),
.btn-mini:hover:not(:disabled) {
  opacity: 0.8;
}

.btn-primary:disabled,
.btn-secondary:disabled,
.btn-mini:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.qr-fields {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.field-label {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.field-label small {
  color: var(--vp-c-text-3);
  font-size: 0.6875rem;
  font-weight: 400;
}

.token-row {
  display: flex;
  gap: 0.4rem;
}

.field-input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.8125rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field-input:focus {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

.field-input::placeholder {
  color: var(--vp-c-text-3);
}
</style>
