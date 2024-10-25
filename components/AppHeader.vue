<script setup lang="ts">
import { useAppModal } from '~/composables/useAppModal';
import { usePdfUploader } from '~/composables/usePdfUploader';

const { t } = useI18n()
const colorMode = useColorMode()
const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
})

const { isFileModalOpen, isSettingModalOpen } = useAppModal()

const { isPending: isFileUploading } = usePdfUploader()
</script>

<template>
    <header class="py-2 px-4 z-10 flex justify-between">
        <div class="grid place-items-center font-bold">AskPDF</div>
        <div class="flex justify-end items-center">
            <ClientOnly>
                <UButton class="mx-1" :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
                    color="gray" variant="ghost" aria-label="Theme" @click="isDark = !isDark" />
                <template #fallback>
                    <div class="w-8 h-8" />
                </template>
            </ClientOnly>
            <UButton text class="mx-1" @click="isFileModalOpen = true" :disabled="isFileUploading">
                {{ t('upload-file') }}
            </UButton>
            <UButton text class="mx-1" @click="isSettingModalOpen = true" :disabled="isFileUploading">
                {{ t('settings') }}
            </UButton>
            <LangSelector class="mx-1" />
        </div>
    </header>
</template>