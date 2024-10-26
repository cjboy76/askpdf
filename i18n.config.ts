import enUS from '@/locales/en-US.json'
import zhTW from '@/locales/zh-TW.json'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'zh-TW',
  messages: {
    'en-US': enUS,
    'zh-TW': zhTW,
  },
}))
