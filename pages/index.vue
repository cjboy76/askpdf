<script setup lang="ts">
import { type Message, useChat } from '@ai-sdk/vue'
import type { ChatModel } from 'openai/resources/index.mjs'
import type { EmbeddingModel } from 'openai/src/resources/embeddings.js'
import type { MemoryVectorStore } from 'langchain/vectorstores/memory'
import type { NuxtError } from 'nuxt/app'
import type { Document as TDocument } from '@langchain/core/documents'
import { useI18n } from 'vue-i18n'
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval'
import { useStorage } from '@vueuse/core'
import FileModal from '~/components/FileModal.vue'
import { IDB_KEY } from '~/share'
import MessagesList from '~/components/MessagesList.vue'
import SettingsModal from '~/components/SettingsModal.vue'
import { useAppModal } from '~/composables/useAppModal'
import { usePdfUploader } from '~/composables/usePdfUploader'

const { t } = useI18n()
const toast = useToast()
const storageOpenAIKey = useStorage('openai_key', '')

// NOTE: MemoryVectorStore https://github.com/langchain-ai/langchainjs/blob/f75e99bee43c03996425ee1a72fde2472e1c2020/langchain/src/vectorstores/memory.ts#L142
const selectedEmbeddingModel = ref<EmbeddingModel>('text-embedding-3-small')
const selectedChatModel = ref<ChatModel>('gpt-4o-mini')
let vectorStore: MemoryVectorStore
function initializeVectorStore() {
  vectorStore = createMemoryVectorStore({
    openAIApiKey: storageOpenAIKey.value,
    modelName: selectedEmbeddingModel.value,
  })
}

const { isFileModalOpen, isSettingModalOpen } = useAppModal()
const { isPending: isFileUploading, upload } = usePdfUploader()
const { data: fileDB } = useIDBKeyval(IDB_KEY.FILE, '')
const { data: documentDB, isFinished: isDocumentFinished } = useIDBKeyval<TDocument<Record<string, string>>[]>(
  IDB_KEY.DOCUMENTS,
  [],
)
const { data: messagesDB, isFinished: isMessagesFinished } = useIDBKeyval<Message[]>(IDB_KEY.MESSAGES, [])
const { data: relatedPagesSet } = useIDBKeyval<number[]>(
  IDB_KEY.RELATED_PAGES,
  [],
)
const { data: documentTitle } = useIDBKeyval(IDB_KEY.DOC_TITLE, '')

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
    await deletePdfData()
    const res = await upload(file)
    if (!res) return
    const { documents, pdfToBase64File } = res
    documentDB.value = documents
    await vectorStore.addDocuments(documents)
    fileDB.value = pdfToBase64File
    identifyDocumentThemes()
  }
  catch {
    toast.add({
      title: 'Error',
      description: t('upload-file-error'),
    })
  }
}

async function identifyDocumentThemes() {
  const result = await vectorStore.similaritySearch('Main topic of this book')
  const docs = result.map(s => s.pageContent).join('')
  if (!docs) return
  documentTitle.value = await $fetch('/api/document/theme', {
    method: 'POST',
    body: { docs, model: selectedChatModel.value },
    headers: {
      'x-openai-key': storageOpenAIKey.value,
    },
  })
}

async function deletePdfData() {
  if (vectorStore && vectorStore.embeddings) vectorStore.memoryVectors = []
  fileDB.value = ''
  relatedPagesSet.value = []
  documentDB.value = []
  setMessages([])
  messagesDB.value = []
  documentTitle.value = ''
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

function processSimilarityDocs(docs: Awaited<ReturnType<MemoryVectorStore['similaritySearch']>>) {
  const sortedDocumentPages = docs
    .sort((a, b) => a.metadata.page - b.metadata.page)
    .map(p => p.metadata.page)
  const relatedPages = [...new Set(sortedDocumentPages)]
  const systemPrompt = docs.map(s => s.pageContent).join('')

  return {
    relatedPages,
    systemPrompt,
  }
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

const setupScope = effectScope(true)
onMounted(() => {
  if (storageOpenAIKey.value) initializeVectorStore()
  setupScope.run(() => {
    watchEffect(() => {
      setMessages(messagesDB.value)
      if (vectorStore) vectorStore.addDocuments(documentDB.value)
    })
  })
})

watch([isDocumentFinished, isMessagesFinished], ([a, b]) => {
  if (a && b) {
    setupScope.stop()
    scrollToBottom()
  }
})

onBeforeUnmount(() => {
  if (pdfSrc.value) URL.revokeObjectURL(pdfSrc.value)
  stopIntersectionObserver()
})

const viewerRef = ref()

async function clearData() {
  await deletePdfData()
  toast.add({
    title: 'Success',
    description: t('clear-data-success'),
  })
}

const onSettingModalClose: InstanceType<typeof SettingsModal>['onClose'] = async ({ apiKey, chatModel, embeddingModel }) => {
  const isApiKeyChanged = apiKey !== storageOpenAIKey.value
  const isEmbeddingModelChanged = embeddingModel !== selectedEmbeddingModel.value
  storageOpenAIKey.value = apiKey
  selectedChatModel.value = chatModel
  selectedEmbeddingModel.value = embeddingModel

  if (isApiKeyChanged || isEmbeddingModelChanged) {
    initializeVectorStore()
    await vectorStore.addDocuments(documentDB.value)
    if (isApiKeyChanged) {
      toast.add({
        title: 'Success',
        description: t('open-ai-key-success'),
      })
    }
  }
}

const onDeleteConversation: InstanceType<typeof SettingsModal>['onDeleteConversation'] = () => {
  setMessages([])
  messagesDB.value = []
}
</script>

<template>
  <div class="flex flex-col">
    <AppHeader :title="documentTitle" />
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
        <div class="overflow-y-auto flex flex-col flex-grow">
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
      @close="onSettingModalClose"
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
