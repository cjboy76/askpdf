// https://nuxt.com/docs/api/configuration/nuxt-config
import { presetUno } from 'unocss'

export default defineNuxtConfig({
  devtools: { enabled: true },
  app: {
    head: {
      title: "ChatPDF"
    }
  },
  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
  },
  runtimeConfig: {
    openaiApiKey: ''
  },
  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
  ],
  unocss: {
    presets: [
      presetUno()
    ]
  },
});
