// https://nuxt.com/docs/api/configuration/nuxt-config
import { presetUno } from 'unocss'
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
  runtimeConfig: {
    openaiApiKey: ''
  },
  modules: ['@vueuse/nuxt', '@unocss/nuxt', 'nuxt-auth-utils'],
  unocss: {
    presets: [presetUno()]
  },
  vite: {
    plugins: [topLevelAwait()]
  }
})
