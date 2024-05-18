import { createI18n } from 'vue-i18n'
import enUS from '@/locales/en-US.json'
import zhTW from '@/locales/zh-TW.json'

type MessageSchema = typeof enUS

const i18n = createI18n<[MessageSchema], 'en-US' | 'zh-TW'>({
    legacy: false,
    locale: 'en-US',
    fallbackLocale: 'zh-TW',
    messages: {
        'en-US': enUS,
        'zh-TW': zhTW,
    },
})

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(i18n)
})