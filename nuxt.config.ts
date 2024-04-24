// https://nuxt.com/docs/api/configuration/nuxt-config
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineNuxtConfig({
  devtools: { enabled: true },
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
      exclude: ['Chart'],
    },
    options: {
      ripple: true,
    },
  },
  css: [
    'primevue/resources/primevue.css',
    'primeicons/primeicons.css',
  ],
  build: {
    transpile: ['nuxt', 'primevue'],
  },
})
