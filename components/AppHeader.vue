<script setup lang="ts">
import { useAppModal } from '~/composables/useAppModal'
import { usePdfUploader } from '~/composables/usePdfUploader'

const { title } = defineProps<{ title: string }>()

const { t } = useI18n()
const colorMode = useColorMode()
const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  },
})

const { isFileModalOpen, isSettingModalOpen } = useAppModal()

const { isPending: isFileUploading } = usePdfUploader()
</script>

<template>
  <header class="py-2 px-4 z-10 flex justify-between">
    <div class="flex items-center">
      <div class="grid place-items-center font-bold text-primary">
        AskPDF
      </div>
      <p v-if="title" class="mx-1 text-stone-600 dark:text-stone-300">/</p>
      <Transition name="pop-up">
        <p v-if="title" class="text-stone-600 dark:text-stone-300">{{ title }}</p>
      </Transition>
    </div>
    <div class="flex justify-end items-center">
      <ClientOnly>
        <UButton
          class="mx-1" :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
          color="gray" variant="ghost" aria-label="Theme" @click="isDark = !isDark"
        />
        <template #fallback>
          <div class="w-8 h-8" />
        </template>
      </ClientOnly>
      <UButton text class="mx-1" :disabled="isFileUploading" @click="isFileModalOpen = true">
        {{ t('upload-file') }}
      </UButton>
      <UButton text class="mx-1" :disabled="isFileUploading" @click="isSettingModalOpen = true">
        {{ t('settings') }}
      </UButton>
      <LangSelector class="mx-1" />
    </div>
  </header>
</template>

<style scoped>
.pop-up-enter-active {
  transition: all 0.3s ease;
}

.pop-up-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.pop-up-enter-from,
.pop-up-leave-to {
  transform: translateY(5px);
  opacity: 0;
}
</style>
