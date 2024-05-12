// https://nuxt.com/docs/api/configuration/nuxt-config
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineNuxtConfig({
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  ssr: true,
  app: {
    head: {
      title: 'AskPDF',
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.png' }]
    }
  },
  nitro: {
    esbuild: {
      options: {
        target: 'esnext'
      }
    }
  },
  modules: ['@vueuse/nuxt', 'nuxt-auth-utils', '@nuxt/ui', 'nuxt-gtag'],
  vite: {
    plugins: [topLevelAwait()]
  },
  build: {
    transpile: ['nuxt']
  },
  gtag: {
    id: ''
  },
})
