<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { useChat, type Message } from '@ai-sdk/vue'
import type { NuxtError } from 'nuxt/app'
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval'
import type { Document as TDocument } from '@langchain/core/documents'
import { useI18n } from 'vue-i18n'
import type { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { usePdfUploader } from '~/composables/usePdfUploader'
import AppHeader from '~/components/AppHeader.vue'
import { useAppModal } from '~/composables/useAppModal'
import SettingsModal from '~/components/SettingsModal.vue'
import FileModal from '~/components/FileModal.vue'
import type { ChatModel } from 'openai/resources/index.mjs'
import type { EmbeddingModel } from 'openai/src/resources/embeddings.js'
import MessagesList from '~/components/MessagesList.vue'
import { IDB_KEY } from '~/share'

const { t } = useI18n()
const toast = useToast()
const storageOpenAIKey = useStorage('openai_key', '')

let vectorStore: MemoryVectorStore
const { isFileModalOpen, isSettingModalOpen } = useAppModal()
const { isPending: isFileUploading, upload } = usePdfUploader()
const { data: fileDB } = useIDBKeyval(IDB_KEY.FILE, '')
const { data: documentDB, isFinished: isDocumentFinished } = useIDBKeyval<TDocument<Record<string, any>>[]>(
  IDB_KEY.DOCUMENTS,
  []
)
const { data: messagesDB, isFinished: isMessagesFinished } = useIDBKeyval<Message[]>(IDB_KEY.MESSAGES, [])
const { data: relatedPagesSet } = useIDBKeyval<number[]>(
  IDB_KEY.RELATED_PAGES,
  []
)

const {
  messages,
  setMessages,
  handleSubmit,
  input,
  isLoading: useChatLoading
} = useChat({
  api: '/api/chat',
  initialMessages: messagesDB.value,
  onError: (error) => {
    toast.add({
      title: 'Error',
      description: error.message
    })
  },
})

async function uploadPdf(file: File) {
  if (!storageOpenAIKey.value) {
    toast.add({
      title: 'Info',
      description: t('open-ai-key-required')
    })
    return
  }
  try {
    const res = await upload(file)
    if (!res) return
    const { documents, pdfToBase64File } = res
    documentDB.value = documents
    vectorStore.addDocuments(documents)
    fileDB.value = pdfToBase64File
  } catch (error) {
    toast.add({
      title: 'Error',
      description: t('upload-file-error')
    })
  }
}

async function deletePdfData() {
  if (vectorStore && vectorStore.embeddings) await vectorStore.delete()
  fileDB.value = ''
  relatedPagesSet.value = []
  documentDB.value = []
  setMessages([])
  messagesDB.value = []
}
const answerLoading = ref(false)
const pageLinkElement = ref<HTMLElement>()
const pageLinkElementIsVisible = ref(false)

const { stop: stopIntersectionObserver } = useIntersectionObserver(
  pageLinkElement,
  ([{ isIntersecting }]) => {
    pageLinkElementIsVisible.value = isIntersecting
  }
)

function scrollToBottom() {
  pageLinkElement.value?.scrollIntoView({
    block: 'end',
    inline: 'nearest',
    behavior: 'smooth'
  })
}

async function submitHandler(e: Event) {
  try {
    if (!input.value || answerLoading.value) return
    answerLoading.value = true
    const similarityDocs = await vectorStore.similaritySearch(input.value, 5)
    const relatedPageNum = similarityDocs
      .sort((a, b) => a.metadata.page - b.metadata.page)
      .map((p) => p.metadata.page)
    relatedPagesSet.value = [...new Set(relatedPageNum)]

    const systemPrompt = similarityDocs.map((s) => s.pageContent).join('')
    setMessages([
      ...messages.value,
      {
        id: `${new Date().toISOString()}`,
        role: 'system',
        content: systemPrompt
      }
    ])
    handleSubmit(e, {
      allowEmptySubmit: true,
      headers: {
        'x-openai-key': storageOpenAIKey.value
      },
      body: {
        data: {
          model: selectedChatModel.value,
        }
      }
    })
  } catch (error: unknown) {
    const { message: errorMessage } = error as NuxtError
    toast.add({
      title: 'Error',
      description: errorMessage
    })
    answerLoading.value = false
  }
}

watch(useChatLoading, (v) => {
  if (!v) {
    answerLoading.value = false
    messagesDB.value = messages.value.map((m) => {
      if (isProxy(m)) return toRaw(m)
      return m
    })
  }
})

const pdfSrc = computed(() => {
  if (!fileDB.value) return ''
  return URL.createObjectURL(base64ToPdf(fileDB.value))
})

const setupScope = effectScope(true)
onMounted(() => {
  // TODO: no key condition
  if (storageOpenAIKey.value) {
    vectorStore = createMemoryVectorStore({ openAIApiKey: storageOpenAIKey.value, modelName: seletedEmbeddingModel.value })
  }
  setupScope.run(() => {
    watchEffect(() => setMessages(messagesDB.value))
    watchEffect(() => vectorStore && vectorStore.addDocuments(documentDB.value))
  })
})

watch([isDocumentFinished, isMessagesFinished], ([a, b]) => {
  if (a && b) {
    setupScope.stop()
    scrollToBottom()
  }
})

onBeforeUnmount(() => {
  pdfSrc.value && URL.revokeObjectURL(pdfSrc.value)
  stopIntersectionObserver()
})

const viewerRef = ref()
const showClearDataConfirmModal = ref(false)

async function clearData() {
  await deletePdfData()
  toast.add({
    title: 'Success',
    description: t('clear-data-success')
  })
  showClearDataConfirmModal.value = false
}

const seletedEmbeddingModel = ref<EmbeddingModel>('text-embedding-3-small')
const selectedChatModel = ref<ChatModel>('gpt-4o-mini')

const onSettingModalClose: InstanceType<typeof SettingsModal>['onClose'] = async ({ apiKey, chatModel, embeddingModel }) => {
  const isApiKeyChanged = apiKey !== storageOpenAIKey.value
  const isEmbeddingModelChanged = embeddingModel !== seletedEmbeddingModel.value
  storageOpenAIKey.value = apiKey
  selectedChatModel.value = chatModel
  seletedEmbeddingModel.value = embeddingModel

  if (isApiKeyChanged || isEmbeddingModelChanged) {
    vectorStore = createMemoryVectorStore({ openAIApiKey: storageOpenAIKey.value, modelName: seletedEmbeddingModel.value })
    await vectorStore.addDocuments(documentDB.value)
    if (isApiKeyChanged) {
      toast.add({
        title: 'Success',
        description: t('open-ai-key-success')
      })
    }
  }
}
</script>

<template>
  <div class="flex flex-col">
    <AppHeader />
    <div class="grid grid-cols-6 gap-2 pb-2 px-2">
      <div class="overflow-hidden col-span-3 h-[calc(100vh-64px)] flex flex-col flex-grow relative rounded">
        <client-only fallback-tag="span" fallback="">
          <PdfViewer v-if="pdfSrc" ref="viewerRef" :pdfSrc="pdfSrc" />
          <div v-else class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
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
          <div ref="pageLinkElement" v-show="!answerLoading && messages.length" class="w-3/5 mx-auto pb-10">
            <span v-for="(page, index) of relatedPagesSet" :key="index"
              class="font-bold p-1 rounded cursor-pointer hover:bg-yellow-200 hover:underline"
              @click="viewerRef.setViewerPage(page)">
              #{{ page }}</span>
          </div>
        </div>
        <div class="h-12 pt-2 relative">
          <form class="w-5/6 max-w-2xl mx-auto flex" @submit.prevent="submitHandler">
            <UInput class="flex-grow" v-model="input" :placeholder="t('input-placeholder')"
              :disabled="answerLoading || isFileUploading">
            </UInput>
            <UButton :loading="answerLoading" class="ml-2" :disabled="isFileUploading" type="submit">
              Enter
            </UButton>
          </form>
          <UButton v-show="!pageLinkElementIsVisible && messages.length" circle
            class="absolute -top-8 left-1/2 -translate-x-1/2 color-zinc-100" @click="scrollToBottom"
            icon="i-heroicons-chevron-down">
          </UButton>
        </div>
        <div class="text-center text-zinc-400 py-1">cjboy76 © 2024</div>
      </div>
    </div>
    <FileModal v-model="isFileModalOpen" @on-upload="uploadPdf" />
    <SettingsModal :api-key="storageOpenAIKey" :embedding-model="seletedEmbeddingModel"
      :chat-model="selectedChatModel" v-model="isSettingModalOpen" @clear-data="clearData"
      @close="onSettingModalClose" />
  </div>
</template>
