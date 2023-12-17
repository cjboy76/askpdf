<script setup lang="ts">
import { NMessageProvider, NConfigProvider, darkTheme } from "naive-ui";
import { useDark } from "@vueuse/core";

const isDark = useDark();
</script>
<template>
  <n-config-provider :theme="isDark ? darkTheme : null">
    <n-message-provider>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </n-message-provider>
  </n-config-provider>
</template>
<style>
@import "@unocss/reset/tailwind.css";
</style>
