// https://nuxt.com/docs/api/configuration/nuxt-config
import { presetUno } from 'unocss'

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
    openaiApiKey: '',
    pineconeIndex: ''
  },
  modules: ['@vueuse/nuxt', '@unocss/nuxt', '@pinia/nuxt', 'nuxt-auth-utils'],
  unocss: {
    presets: [presetUno()]
  }
})
