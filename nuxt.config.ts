// https://nuxt.com/docs/api/configuration/nuxt-config
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineNuxtConfig({
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  ssr: true,
  app: {
    head: {
      title: 'AskPDF',
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.png' }],
      htmlAttrs: {
        lang: 'en'
      }
    }
  },
  nitro: {
    esbuild: {
      options: {
        target: 'esnext'
      }
    }
  },
  modules: [
    '@vueuse/nuxt',
    'nuxt-auth-utils',
    '@nuxt/ui',
    'nuxt-security',
    '@nuxtjs/i18n'
  ],
  vite: {
    plugins: [topLevelAwait()],
    define: {
      __INTLIFY_JIT_COMPILATION__: true,
      __INTLIFY_DROP_MESSAGE_COMPILER__: true
    }
  },
  build: {
    transpile: ['nuxt']
  },
  i18n: {
    locales: ['en-US', 'zh'],
    vueI18n: './i18n.config.ts' // if you are using custom path, default
  },
  security: {
    headers: {
      contentSecurityPolicy: {
        'img-src': "'self' blob: data:;",
        'connect-src': "'self' http://localhost:3000 blob: https://api.openai.com;",
      },
    },
  },
})
