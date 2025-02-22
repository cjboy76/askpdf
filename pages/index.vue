<script setup lang="ts">
import { type Message, useChat } from '@ai-sdk/vue'
import type { ChatModel } from 'openai/resources/index.mjs'
import type { EmbeddingModel } from 'openai/src/resources/embeddings.js'
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval'
import type { Document } from '@langchain/core/documents'
import { useStorage } from '@vueuse/core'
import { IDB_KEY } from '~/share'
import type { SettingsModal } from '#build/components'
import type { NuxtError } from '#app'
import { useVectorStore } from '~/stores/useVectorStore'

const { t } = useI18n()
const toast = useToast()
const storageOpenAIKey = useStorage('askpdf_openai_key', '')

// NOTE: MemoryVectorStore https://github.com/langchain-ai/langchainjs/blob/f75e99bee43c03996425ee1a72fde2472e1c2020/langchain/src/vectorstores/memory.ts#L142
const selectedEmbeddingModel = ref<EmbeddingModel>('text-embedding-3-small')
const selectedChatModel = ref<ChatModel>('gpt-4o-mini')
const vectorStore = useVectorStore()

const { isFileModalOpen, isSettingModalOpen } = useAppModal()
const { isPending: isFileUploading, upload } = usePdfUploader()
const { data: fileDB } = useIDBKeyval(IDB_KEY.FILE, '')
const { data: documentDB } = useIDBKeyval<Document<Record<string, string>>[]>(
  IDB_KEY.DOCUMENTS,
  [],
)
const { data: messagesDB } = useIDBKeyval<Message[]>(IDB_KEY.MESSAGES, [])
const { data: relatedPagesSet } = useIDBKeyval<number[]>(
  IDB_KEY.RELATED_PAGES,
  [],
)

const {
  messages,
  setMessages,
  handleSubmit,
  input,
  isLoading: isChatLoading,
} = useChat({
  api: '/api/chat',
  initialMessages: messagesDB.value,
  onError: (error) => {
    toast.add({
      title: 'Error',
      description: error.message,
    })
  },
})

async function uploadPdf(file: File) {
  if (!storageOpenAIKey.value) {
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
    documentDB.value = documents
    await vectorStore.addDocuments(documents)
    fileDB.value = pdfToBase64File
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
  fileDB.value = ''
  relatedPagesSet.value = []
  documentDB.value = []
  setMessages([])
  messagesDB.value = []
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
    relatedPagesSet.value = formatted.relatedPages

    setMessages([
      ...messages.value,
      { id: `${new Date().toISOString()}`, role: 'system', content: formatted.systemPrompt },
    ])

    handleSubmit(e, {
      allowEmptySubmit: true,
      headers: { 'x-openai-key': storageOpenAIKey.value },
      body: { data: { model: selectedChatModel.value } },
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
  messagesDB.value = messages.value.map(m => isProxy(m) ? toRaw(m) : m)
})

const pdfSrc = computed(() => {
  if (!fileDB.value) return ''
  return URL.createObjectURL(base64ToPdf(fileDB.value))
})

onMounted(() => {
  setMessages(messagesDB.value)
})

watch([storageOpenAIKey, selectedEmbeddingModel], (newValue, oldValue) => {
  if (newValue !== oldValue) return
  vectorStore.clear()
  vectorStore.initialize(storageOpenAIKey.value, selectedEmbeddingModel.value)
  vectorStore.addDocuments(documentDB.value)
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
  messagesDB.value = []
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
              v-for="(page, index) of relatedPagesSet"
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
      :api-key="storageOpenAIKey"
      :embedding-model="selectedEmbeddingModel"
      :chat-model="selectedChatModel"
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
