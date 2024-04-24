// https://nuxt.com/docs/api/configuration/nuxt-config
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineNuxtConfig({
  devtools: { enabled: import.meta.dev },
  ssr: true,
  app: {
    head: {
      title: 'AskPDF'
    }
  },
  nitro: {
    esbuild: {
      options: {
        target: 'esnext'
      }
    }
  },
  modules: ['@vueuse/nuxt', '@unocss/nuxt', 'nuxt-auth-utils', 'nuxt-primevue'],
  vite: {
    plugins: [topLevelAwait()]
  },
  primevue: {
    components: {
      exclude: ['Chart', 'Editor'],
    },
    options: {
      ripple: false,
    },
  },
  css: [
    'primevue/resources/primevue.css',
    'primeicons/primeicons.css',
    './assets/theme.css',
  ],
  build: {
    transpile: ['nuxt', 'primevue'],
  },
})
