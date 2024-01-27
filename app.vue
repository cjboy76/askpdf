<script setup lang="ts">
import {
  NMessageProvider,
  NConfigProvider,
  type GlobalThemeOverrides
} from 'naive-ui'

const primaryColor = '#4c6983'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: primaryColor
  },
  Input: {
    borderFocus: primaryColor,
    borderHover: primaryColor
  }
}
</script>
<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </n-message-provider>
  </n-config-provider>
</template>
<style>
@import '@unocss/reset/tailwind.css';
</style>
