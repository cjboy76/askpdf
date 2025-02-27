<script setup lang="ts">
const vectorManager = useVectorManager()
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
const { summaryTitle } = useIDBKeyvalStore()

watch(() => vectorManager.store, (vs) => {
  if (vs && vs.memoryVectors.length > 0 && !summaryTitle.value) identifyDocumentThemes()
}, { immediate: true, once: true })

const { chatModel, apiKey } = useLLMConfig()

async function identifyDocumentThemes() {
  const result = await vectorManager.similaritySearch('Main topic of this book')
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
        class="mx-1 text-stone-600 dark:text-stone-300 hidden md:block"
      >
        /
      </p>
      <Transition name="pop-up">
        <p
          v-if="summaryTitle"
          class="text-stone-600 dark:text-stone-300 hidden md:block"
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
        class="hidden md:block"
      />
      <ClientOnly>
        <UButton
          class="mx-1 hidden md:block"
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
      <LangSelector class="mx-1 hidden md:block" />
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
