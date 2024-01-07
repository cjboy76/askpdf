// https://nuxt.com/docs/api/configuration/nuxt-config
import { presetUno } from 'unocss'

export default defineNuxtConfig({
  devtools: { enabled: true },
  app: {
    head: {
      title: "AskPDF"
    }
  },
  nitro: {
    plugins: [
      '@/server/index'
    ],
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
  },
  runtimeConfig: {
    openaiApiKey: '',
    mongoUri: ''
  },
  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
    '@pinia/nuxt',
    'nuxt-mongoose',
  ],
  unocss: {
    presets: [
      presetUno()
    ]
  },
});
