// https://vitepress.dev/guide/custom-theme
import type { EnhanceAppContext } from 'vitepress'
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import Theme from 'vitepress/theme'
import SendTextDemo from '../components/SendTextDemo.vue'
import StackBlitzEmbed from '../components/StackBlitzEmbed.vue'

import '@shikijs/vitepress-twoslash/style.css'
import 'uno.css'
import './style.css'
import 'virtual:group-icons.css'

// @unocss-include

/**
 * Shared paths that are locale-independent (e.g. auto-generated API docs).
 * When VitePress switches locale it prepends `/zh/` to the current path,
 * but these pages only exist under the root locale. We intercept the
 * navigation and strip the prefix so users don't land on a 404.
 */
function normalizePath(path: string): string {
  return path.split(/[?#]/, 1)[0] || '/'
}

function getSharedRootLocalePath(path: string): string | undefined {
  const normalized = normalizePath(path)

  if (normalized === '/zh/api' || normalized.startsWith('/zh/api/'))
    return path.replace(/^\/zh\//, '/')
}

export default {
  extends: Theme,
  enhanceApp({ app, router }: EnhanceAppContext) {
    app.use(TwoslashFloatingVue)
    app.component('SendTextDemo', SendTextDemo)
    app.component('StackBlitzEmbed', StackBlitzEmbed)

    const onBeforeRouteChange = router.onBeforeRouteChange

    router.onBeforeRouteChange = async (to) => {
      const sharedPath = getSharedRootLocalePath(to)
      if (sharedPath) {
        await router.go(sharedPath)
        return false
      }

      return onBeforeRouteChange?.(to)
    }
  },
}
