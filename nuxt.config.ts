// https://nuxt.com/docs/api/configuration/nuxt-config
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineNuxtConfig({
  modules: [
    '@vueuse/nuxt',
    '@nuxt/ui',
    '@nuxtjs/i18n',
    '@nuxt/eslint',
    '@nuxtjs/color-mode',
  ],
  ssr: true,
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  app: {
    head: {
      title: 'AskPDF',
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.png' }],
      htmlAttrs: {
        lang: 'en',
      },
    },
  },
  build: {
    transpile: ['nuxt'],
  },
  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
  },
  vite: {
    plugins: [topLevelAwait()],
    define: {
      __INTLIFY_JIT_COMPILATION__: true,
      __INTLIFY_DROP_MESSAGE_COMPILER__: true,
    },
  },
  i18n: {
    locales: ['en-US', 'zh'],
    vueI18n: './i18n.config.ts', // if you are using custom path, default
  },
})
