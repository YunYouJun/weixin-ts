<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  /**
   * GitHub repo path: owner/repo or owner/repo/tree/branch
   * e.g. 'YunYouJun/weixin-ts'
   */
  repo?: string
  /** File to open by default (relative to repo root) */
  file?: string
  /** Terminal script name to run on start (from root package.json) */
  startScript?: string
  /** Embed height */
  height?: string
  /** Show terminal panel */
  terminal?: boolean
  /** Title for the embed */
  title?: string
}>(), {
  repo: 'YunYouJun/weixin-ts',
  file: 'examples/basic/src/index.ts',
  startScript: 'example',
  height: '600px',
  terminal: true,
  title: 'Live Demo',
})

const iframeSrc = computed(() => {
  const params = new URLSearchParams({
    embed: '1',
    file: props.file,
    hideNavigation: '1',
    theme: 'dark',
  })
  if (props.terminal) {
    params.set('terminal', '1')
    params.set('startScript', props.startScript)
  }
  return `https://stackblitz.com/github/${props.repo}?${params.toString()}`
})
</script>

<template>
  <div class="stackblitz-embed">
    <div v-if="title" class="embed-header">
      <span class="embed-icon">▶</span>
      <span class="embed-title">{{ title }}</span>
      <a
        :href="`https://stackblitz.com/github/${repo}`"
        target="_blank"
        rel="noopener"
        class="embed-open"
      >
        Open in StackBlitz ↗
      </a>
    </div>
    <iframe
      :src="iframeSrc"
      :style="{ height }"
      frameborder="0"
      allow="cross-origin-isolated"
      loading="lazy"
      class="embed-iframe"
    />
  </div>
</template>

<style scoped>
.stackblitz-embed {
  margin: 1.5rem 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
}

.embed-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: var(--vp-c-bg-alt);
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 0.875rem;
}

.embed-icon {
  color: var(--vp-c-brand-1);
}

.embed-title {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.embed-open {
  margin-left: auto;
  color: var(--vp-c-text-2);
  text-decoration: none;
  font-size: 0.8rem;
  transition: color 0.2s;
}

.embed-open:hover {
  color: var(--vp-c-brand-1);
}

.embed-iframe {
  width: 100%;
  border: 0;
  display: block;
}
</style>
