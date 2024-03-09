<script setup lang="ts">
import { NMessageProvider, NConfigProvider, NDialogProvider } from 'naive-ui'
import { darkTheme } from 'naive-ui'
</script>

<template>
  <n-config-provider :theme="darkTheme">
    <n-dialog-provider>
      <n-message-provider>
        <NuxtLayout>
          <NuxtPage class="h-screen bg-zinc-800 color-zinc-100" />
        </NuxtLayout>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>
<style>
@import '@unocss/reset/tailwind.css';
</style>
