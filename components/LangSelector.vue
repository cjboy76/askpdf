<template>
  <UDropdown
    :items="items"
    mode="hover"
    :popper="{ placement: 'bottom-start' }"
  >
    <UButton
      color="white"
      :label="t('lang')"
      trailing-icon="i-heroicons-chevron-down-20-solid"
    />
  </UDropdown>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useStorage } from '@vueuse/core'

const storageLocale = useStorage('askpdf-locale', 'en-US')
const { locale, t } = useI18n()

const items = [
  [{
    label: 'English',
    click: () => setLocale('en-US'),
  },
  {
    label: '繁體中文',
    click: () => setLocale('zh-TW'),
  },
  ],

]

function setLocale(value: string) {
  locale.value = value
  storageLocale.value = value
}

onMounted(() => {
  if (storageLocale.value && storageLocale.value !== locale.value) {
    locale.value = storageLocale.value
  }
})
</script>
