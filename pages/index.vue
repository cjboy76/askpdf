<script setup lang="ts">
import { useChat } from '@ai-sdk/vue'
import type { SettingsModal } from '#build/components'
import type { NuxtError } from '#app'
import { useVectorStore } from '~/stores/useVectorStore'

const { t } = useI18n()
const toast = useToast()
const { apiKey, chatModel, embeddingsModel } = useLLMConfig()
const vectorStore = useVectorStore()

const { isFileModalOpen, isSettingModalOpen } = useAppModal()
const { isPending: isFileUploading, upload } = usePdfUploader()
const { file: idbFile, documents: idbDocuments, messages: idbMessages, relatedPages } = useIDBKeyvalStore()

const {
  messages,
  setMessages,
  handleSubmit,
  input,
  isLoading: isChatLoading,
} = useChat({
  api: '/api/chat',
  initialMessages: idbMessages.value,
  onError: (error) => {
    toast.add({
      title: 'Error',
      description: error.message,
    })
  },
})

async function uploadPdf(file: File) {
  if (!apiKey.value) {
    toast.add({
      title: 'Info',
      description: t('open-ai-key-required'),
    })
    return
  }
  try {
    await removePDF()
    const res = await upload(file)
    if (!res) return
    const { documents, pdfToBase64File } = res
    idbDocuments.value = documents
    await vectorStore.addDocuments(documents)
    idbFile.value = pdfToBase64File
  }
  catch {
    toast.add({
      title: 'Error',
      description: t('upload-file-error'),
    })
  }
}

async function removePDF() {
  vectorStore.clear()
  idbFile.value = ''
  relatedPages.value = []
  idbDocuments.value = []
  setMessages([])
  idbMessages.value = []
}
const isModelProcessing = computed(() => isSimilaritySearchPending.value || isChatLoading.value)
const pageLinkElement = ref<HTMLElement>()
const pageLinkElementIsVisible = ref(false)

const { stop: stopIntersectionObserver } = useIntersectionObserver(
  pageLinkElement,
  ([{ isIntersecting }]) => {
    pageLinkElementIsVisible.value = isIntersecting
  },
)

function scrollToBottom() {
  pageLinkElement.value?.scrollIntoView({
    block: 'end',
    inline: 'nearest',
    behavior: 'smooth',
  })
}

const isSimilaritySearchPending = ref(false)
async function submitHandler(e: Event) {
  if (!input.value || isModelProcessing.value) return
  isSimilaritySearchPending.value = true

  try {
    const similarityDocs = await vectorStore.similaritySearch(input.value, 5)
    const formatted = processSimilarityDocs(similarityDocs)
    relatedPages.value = formatted.relatedPages

    setMessages([
      ...messages.value,
      { id: `${new Date().toISOString()}`, role: 'system', content: formatted.systemPrompt },
    ])

    handleSubmit(e, {
      allowEmptySubmit: true,
      headers: { 'x-openai-key': apiKey.value },
      body: { data: { model: chatModel.value } },
    })
  }
  catch (error: unknown) {
    const { message: errorMessage } = error as NuxtError
    toast.add({ title: 'Error', description: errorMessage })
  }
  finally {
    isSimilaritySearchPending.value = false
  }
}

watch(isModelProcessing, (value) => {
  if (value) return
  idbMessages.value = messages.value.map(m => isProxy(m) ? toRaw(m) : m)
})

const pdfSrc = computed(() => {
  if (!idbFile.value) return ''
  return URL.createObjectURL(base64ToPdf(idbFile.value))
})

onMounted(() => {
  setMessages(idbMessages.value)
})

watch([apiKey, embeddingsModel], (newValue, oldValue) => {
  if (newValue !== oldValue) return
  vectorStore.clear()
  vectorStore.initialize(apiKey.value, embeddingsModel.value)
  vectorStore.addDocuments(idbDocuments.value)
})

onBeforeUnmount(() => {
  if (pdfSrc.value) URL.revokeObjectURL(pdfSrc.value)
  stopIntersectionObserver()
})

const viewerRef = ref()

async function clearData() {
  await removePDF()
  toast.add({
    title: 'Success',
    description: t('clear-data-success'),
  })
}

const onDeleteConversation: InstanceType<typeof SettingsModal>['onDeleteConversation'] = () => {
  setMessages([])
  idbMessages.value = []
}
</script>

<template>
  <div class="flex flex-col">
    <AppHeader />
    <div class="grid grid-cols-6 gap-2 pb-2 px-2">
      <div class="overflow-hidden col-span-3 h-[calc(100vh-64px)] flex flex-col flex-grow relative rounded">
        <client-only
          fallback-tag="span"
          fallback=""
        >
          <PdfViewer
            v-if="pdfSrc"
            ref="viewerRef"
            :pdf-src="pdfSrc"
          />
          <div
            v-else
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div class="font-bold text-center mb-4 opacity-50">
              {{ t('greeting') }}
            </div>
            <div class="text-center opacity-50">
              d(`･∀･)b
            </div>
          </div>
        </client-only>
      </div>
      <div class="overflow-hidden col-span-3 h-[calc(100vh-64px)] flex flex-col rounded">
        <div class="overflow-y-auto flex flex-col flex-grow scroller">
          <MessagesList :messages="messages" />
          <div
            v-show="!isModelProcessing && messages.length"
            ref="pageLinkElement"
            class="w-3/5 mx-auto pb-10"
          >
            <span
              v-for="(page, index) of relatedPages"
              :key="index"
              class="font-bold p-1 rounded cursor-pointer hover:bg-primary hover:underline"
              @click="viewerRef.setViewerPage(page)"
            >
              #{{ page }}</span>
          </div>
          <div id="scroller-anchor" />
        </div>
        <div class="h-12 pt-2 relative">
          <form
            class="w-5/6 max-w-2xl mx-auto flex"
            @submit.prevent="submitHandler"
          >
            <UInput
              v-model="input"
              class="flex-grow"
              :placeholder="t('input-placeholder')"
              :disabled="isModelProcessing || isFileUploading"
            />
            <UButton
              :loading="isModelProcessing"
              class="ml-2"
              :disabled="isFileUploading"
              type="submit"
            >
              Enter
            </UButton>
          </form>
          <UButton
            v-show="!pageLinkElementIsVisible && messages.length"
            circle
            class="absolute -top-8 left-1/2 -translate-x-1/2 color-zinc-100"
            icon="i-heroicons-chevron-down"
            @click="scrollToBottom"
          />
        </div>
        <div class="text-center text-zinc-400 py-1">
          cjboy76 © 2023-{{ new Date().getFullYear() }}
        </div>
      </div>
    </div>
    <FileModal
      v-model="isFileModalOpen"
      @on-upload="uploadPdf"
    />
    <SettingsModal
      v-model="isSettingModalOpen"
      @clear-data="clearData"
      @delete-conversation="onDeleteConversation"
    />
  </div>
</template>

<style>
body {
  background-color: #fff;
  color: #454545;
}
.dark body {
  background-color: #15202b;
  color: #ebf4f1;
}
</style>

<style scoped>
.scroller * {
  overflow-anchor: none;
}
#scroller-anchor {
  overflow-anchor: auto;
  height: 1px;
}
</style>
