<script setup lang="ts">
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval'
import type { Document } from '@langchain/core/documents'
import { useAppModal } from '~/composables/useAppModal'
import { usePdfUploader } from '~/composables/usePdfUploader'
import { IDB_KEY } from '~/share'
import { useVectorStore } from '~/stores/useVectorStore'
import { useLLMConfig } from '~/composables/useLLMConfig'

const vectorStore = useVectorStore()
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

const { data: documentDB } = useIDBKeyval<Document<Record<string, string>>[]>(
  IDB_KEY.DOCUMENTS,
  [],
)

const { data: summaryTitle } = useIDBKeyval(IDB_KEY.SUMMARY_TITLE, '')

watch(documentDB, () => {
  identifyDocumentThemes()
})

const { chatModel, apiKey } = useLLMConfig()

async function identifyDocumentThemes() {
  const result = await vectorStore.similaritySearch('Main topic of this book')
  const docs = result.map(s => s.pageContent).join('')
  if (!docs) return
  summaryTitle.value = await $fetch('/api/document/theme', {
    method: 'POST',
    body: { docs, model: chatModel.value },
    headers: {
      'x-openai-key': apiKey.value,
    },
  })
}
</script>

<template>
  <header class="py-2 px-4 z-10 flex justify-between">
    <div class="flex items-center">
      <div class="grid place-items-center font-bold text-primary">
        AskPDF
      </div>
      <p
        v-if="summaryTitle"
        class="mx-1 text-stone-600 dark:text-stone-300"
      >
        /
      </p>
      <Transition name="pop-up">
        <p
          v-if="summaryTitle"
          class="text-stone-600 dark:text-stone-300"
        >
          {{ summaryTitle }}
        </p>
      </Transition>
    </div>
    <div class="flex justify-end items-center">
      <UButton
        icon="i-uil-github"
        color="gray"
        variant="ghost"
        to="https://github.com/cjboy76/askpdf"
        target="_blank"
      />
      <ClientOnly>
        <UButton
          class="mx-1"
          :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
          color="gray"
          variant="ghost"
          aria-label="Theme"
          @click="isDark = !isDark"
        />
        <template #fallback>
          <div class="w-8 h-8" />
        </template>
      </ClientOnly>
      <UButton
        text
        class="mx-1"
        :disabled="isFileUploading"
        @click="isFileModalOpen = true"
      >
        {{ t('upload-file') }}
      </UButton>
      <UButton
        text
        class="mx-1"
        :disabled="isFileUploading"
        @click="isSettingModalOpen = true"
      >
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
