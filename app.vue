<script setup lang="ts">
import { NMessageProvider, NConfigProvider } from 'naive-ui'
</script>
<template>
  <n-config-provider>
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
