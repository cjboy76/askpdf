<script setup lang="ts">
import type { Message } from '@ai-sdk/vue'

const { t } = useI18n()
const props = defineProps<{ messages: Message[] }>()
</script>

<template>
  <div
    v-for="{ content, role, id } of props.messages"
    v-show="role !== 'system'"
    :key="id"
  >
    <div class="w-4/5 mx-auto grid grid-cols-8 gap-2 py-6">
      <div class="col-span-1 flex justify-end">
        <UIcon
          v-if="role === 'assistant'"
          class="w-8 h-8"
          name="i-heroicons-face-smile-16-solid"
        />
        <UIcon
          v-if="role === 'user'"
          class="w-8 h-8"
          name="i-heroicons-user-solid"
        />
      </div>
      <div class="col-span-7">
        <div class="h-8 mb-2 grid items-center font-bold">
          {{ role === 'assistant' ? 'AskPDF' : t('you') }}
        </div>
        <markdown :source="content" />
      </div>
    </div>
  </div>
</template>
