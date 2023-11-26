// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
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
    '@nuxtjs/tailwindcss'
  ],
  hooks: {
    'components:dirs': (dirs) => {
      dirs.unshift({
        path: '~/components/ui',
        extensions: ['.vue'],
        prefix: 'Ui',
        pathPrefix: false
      })
    }
  }
});
