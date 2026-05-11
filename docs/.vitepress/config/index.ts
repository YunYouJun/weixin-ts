import type { DefaultTheme } from 'vitepress'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import { getVitepressConfig } from '@yunyoujun/docs'
import { defineConfig } from 'vitepress'
import { groupIconMdPlugin } from 'vitepress-plugin-group-icons'
import { version } from '../../../package.json'
import typedocSidebar from '../../api/typedoc-sidebar.json'

// ---------------------------------------------------------------------------
// English navigation
// ---------------------------------------------------------------------------

const GUIDES_EN = [
  { text: 'What is weixin-ts?', link: '/guide/what-is' },
  { text: 'Getting Started', link: '/guide/getting-started' },
  { text: 'Examples', link: '/guide/examples' },
  { text: 'Configuration', link: '/guide/configuration' },
] satisfies DefaultTheme.SidebarItem[]

const DESIGN_EN = [
  { text: 'Design Principles', link: '/guide/design-principles' },
] satisfies DefaultTheme.SidebarItem[]

// ---------------------------------------------------------------------------
// Chinese navigation
// ---------------------------------------------------------------------------

const GUIDES_ZH = [
  { text: '什么是 weixin-ts?', link: '/zh/guide/what-is' },
  { text: '快速开始', link: '/zh/guide/getting-started' },
  { text: '示例', link: '/zh/guide/examples' },
  { text: '配置', link: '/zh/guide/configuration' },
] satisfies DefaultTheme.SidebarItem[]

const DESIGN_ZH = [
  { text: '设计原则', link: '/zh/guide/design-principles' },
] satisfies DefaultTheme.SidebarItem[]

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

const VERSIONS: (DefaultTheme.NavItemWithLink | DefaultTheme.NavItemChildren)[] = [
  { text: `v${version} (current)`, link: '/' },
  { text: `Release Notes`, link: 'https://github.com/YunYouJun/weixin-ts/releases' },
  { text: `Changelog`, link: '/changelog' },
]

const vpConfig = getVitepressConfig({
  repo: 'https://github.com/YunYouJun/weixin-ts',
})

export default defineConfig({
  ...vpConfig,

  title: 'weixin-ts',
  description: 'WeChat Bot SDK for TypeScript — cross-platform, type-safe, zero dependencies',
  markdown: {
    codeTransformers: [
      transformerTwoslash(),
    ],
    languages: ['js', 'jsx', 'ts', 'tsx'],
    config: (md) => {
      md.use(groupIconMdPlugin)
    },
  },
  cleanUrls: true,

  vite: {
    server: {
      proxy: {
        '/ilink': {
          target: 'https://ilinkai.weixin.qq.com',
          changeOrigin: true,
          secure: true,
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // i18n locales
  // ---------------------------------------------------------------------------
  locales: {
    root: {
      label: 'English',
      lang: 'en',
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      description: '跨平台、类型安全、零依赖的微信 Bot TypeScript SDK',
      themeConfig: {
        nav: [
          {
            text: '指南',
            items: [
              { items: GUIDES_ZH },
              { text: '设计', items: DESIGN_ZH },
            ],
          },
          { text: '演示', link: '/zh/playground' },
          { text: 'API', link: '/api/' },
          { text: `v${version}`, items: VERSIONS },
        ],
        sidebar: {
          '/zh/': [
            {
              text: '指南',
              items: GUIDES_ZH,
            },
            {
              text: '设计',
              items: DESIGN_ZH,
            },
          ],
          '/api/': typedocSidebar,
        },
        footer: {
          message: '基于 MIT 许可证发布',
          copyright: 'Copyright © 2025-PRESENT YunYouJun',
        },
      },
    },
  },

  themeConfig: {
    ...vpConfig.themeConfig,

    logo: '/logo.svg',

    search: {
      provider: 'local',
    },

    nav: [
      {
        text: 'Guide',
        items: [
          { items: GUIDES_EN },
          { text: 'Design', items: DESIGN_EN },
        ],
      },
      { text: 'Playground', link: '/playground' },
      { text: 'API', link: '/api/' },
      { text: `v${version}`, items: VERSIONS },
    ],
    sidebar: {
      '/': [
        {
          text: 'Guide',
          items: GUIDES_EN,
        },
        {
          text: 'Design',
          items: DESIGN_EN,
        },
      ],
      '/api/': typedocSidebar,
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/YunYouJun/weixin-ts' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-PRESENT YunYouJun.',
    },
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'author', content: 'YunYouJun' }],
    ['meta', { property: 'og:title', content: 'weixin-ts' }],
    ['meta', { property: 'og:description', content: 'WeChat Bot SDK for TypeScript' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' }],
  ],
})
