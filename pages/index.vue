<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { useChat, type Message } from 'ai/vue'
import type { NuxtError } from 'nuxt/app'
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval'
import { pdfToBase64 } from '~/utils/parser'
import { get } from 'idb-keyval'
import { createDocuments, CustomVectorStore } from '#imports'
import type { Document as TDocument } from '@langchain/core/documents'
import { useVectorStore } from '~/utils/vectorStore'
import { usePDFLoader } from '~/utils/pdfloader'

const toast = useToast()
const storageOpenAIKey = useStorage('openai_key', '')
const {
  messages,
  setMessages,
  handleSubmit,
  input,
  isLoading: useChatLoading
} = useChat({
  onError: (error) => {
    toast.add({
      title: 'Error',
      description: error.message
    })
  }
})

let vectorStore: CustomVectorStore
const showFileModal = ref(false)
const showKeyModal = ref(false)
const uploadFile = ref()

const onFileSelect = (files: FileList) => {
  if (files[0]) uploadFile.value = files[0]
}
const fileUploading = ref(false)
const { data: fileDB } = useIDBKeyval('askpdf-file', '')
const { data: documentDB } = useIDBKeyval<TDocument<Record<string, any>>[]>(
  'askpdf-docs',
  []
)
const { data: messagesDB } = useIDBKeyval<Message[]>('askpdf-msg', [])
const { data: relatedPagesSet } = useIDBKeyval<number[]>(
  'askpdf-related-pages',
  []
)

async function uploadPdf() {
  if (!storageOpenAIKey.value) {
    toast.add({
      title: 'Info',
      description: '請設定 OpenAI API Key'
    })
    return
  }
  if (!uploadFile.value) return
  const file = toRaw(uploadFile.value)
  showFileModal.value = false
  fileUploading.value = true
  try {
    const pdfInfo = await usePDFLoader(file)
    const documents = await createDocuments(pdfInfo.data)
    documentDB.value = documents
    vectorStore.addDocuments(documents)
    fileDB.value = await pdfToBase64(file as File)
    const pdfBlob = new Blob([file], { type: 'application/pdf' })
    pdfSrc.value = URL.createObjectURL(pdfBlob)
  } catch (error) {
    toast.add({
      title: 'Error',
      description: '上傳檔案失敗，請確認檔案類型'
    })
  } finally {
    fileUploading.value = false
  }
}

async function deletePdfData() {
  if (vectorStore && vectorStore.embeddings) await vectorStore.delete()
  fileDB.value = ''
  pdfSrc.value = ''
  relatedPagesSet.value = []
  documentDB.value = []
  setMessages([])
  messagesDB.value = []
}
const answerLoading = ref(false)
const pageLinkElement = ref<HTMLElement>()
const pageLinkElementIsVisible = ref(false)

const { stop } = useIntersectionObserver(
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
      options: {
        headers: {
          'x-openai-key': storageOpenAIKey.value
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

const pdfSrc = ref('')

async function refreshFromCache() {
  const pdfFromStore = await get('askpdf-file')
  if (pdfFromStore) {
    const file = base64ToPdf(pdfFromStore)
    pdfSrc.value = URL.createObjectURL(file)
  }
  const msgFromStore = await get('askpdf-msg')
  if (msgFromStore) setMessages(msgFromStore)

  const docsFromStore = await get('askpdf-docs')
  if (docsFromStore && storageOpenAIKey.value) {
    vectorStore = useVectorStore(storageOpenAIKey.value)
    vectorStore.addDocuments(docsFromStore)
  }

  const relatedPageNumFromStore = await get('askpdf-related-pages')
  if (relatedPageNumFromStore.length > 0)
    relatedPagesSet.value = relatedPageNumFromStore
}
onMounted(() => {
  if (storageOpenAIKey.value) {
    vectorStore = useVectorStore(storageOpenAIKey.value)
  }
  refreshFromCache()
})

onBeforeUnmount(() => {
  pdfSrc.value && URL.revokeObjectURL(pdfSrc.value)
  stop()
})

const viewerRef = ref()
const showRemoveDataConfirmModal = ref(false)

async function removeData() {
  await deletePdfData()
  toast.add({
    title: 'Success',
    description: '資料已刪除'
  })
  showRemoveDataConfirmModal.value = false
}

async function refreshStore(key: string) {
  vectorStore = useVectorStore(key)
  if (documentDB.value) await vectorStore.addDocuments(documentDB.value)
  toast.add({
    title: 'Success',
    description: 'OpenAI API key 已更新'
  })
}
</script>

<template>
  <div class="grid grid-cols-6">
    <div class="col-span-3 h-full flex flex-col flex-grow relative">
      <client-only fallback-tag="span" fallback="">
        <PdfViewer v-if="pdfSrc" ref="viewerRef" :pdfSrc="pdfSrc" />
        <div v-else class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          d(`･∀･)b
        </div>
      </client-only>
    </div>
    <div class="col-span-3 flex flex-col h-full">
      <div class="max-h-[calc(100vh-80px)] overflow-y-auto flex flex-col flex-grow">
        <div class="sticky top-0 py-4 px-4 z-10 flex justify-end items-center bg-zinc-800">
          <UButton text class="mx-1" @click="showRemoveDataConfirmModal = true">
            清除資料
          </UButton>
          <UButton text class="mx-1" @click="showKeyModal = true" :disabled="fileUploading">
            OpenAI
          </UButton>
          <UButton text class="mx-1" @click="showFileModal = true" :disabled="fileUploading">
            上傳文件
          </UButton>
        </div>
        <div v-if="!fileDB" class="text-center mt-20">
          <h1 class="text-4xl font-bold text-center mb-4 opacity-50">AskPDF</h1>
          <h3 v-if="!pdfSrc" class="font-bold text-center mb-4 opacity-50">
            上傳文件，開始體驗
          </h3>
        </div>
        <div v-for="{ content, role, id } of messages" :key="id" v-show="role !== 'system'">
          <div class="w-4/5 mx-auto grid grid-cols-8 gap-2 py-6">
            <div class="col-span-1 flex justify-end">
              <UIcon v-if="role === 'assistant'" class="w-8 h-8" name="i-heroicons-face-smile-16-solid" />
              <UIcon v-if="role === 'user'" class="w-8 h-8" name="i-heroicons-user-solid" />
            </div>
            <div class="col-span-7">
              <div class="h-8 mb-2 grid items-center font-bold">
                {{ role === 'assistant' ? 'AskPDF' : 'You' }}
              </div>
              <p>
                {{ content }}
              </p>
            </div>
          </div>
        </div>
        <div ref="pageLinkElement" v-show="!answerLoading" class="w-3/5 mx-auto pb-10">
          <span v-for="(page, index) of relatedPagesSet" :key="index"
            class="font-bold p-1 rounded cursor-pointer hover:bg-yellow-200 hover:underline"
            @click="viewerRef.setViewerPage(page)">
            #{{ page }}</span>
        </div>
      </div>
      <div class="h-12 pt-2 relative">
        <form class="w-5/6 max-w-2xl mx-auto flex" @submit.prevent="submitHandler">
          <UInput class="flex-grow" v-model="input" placeholder="Message..." :disabled="answerLoading || fileUploading">
          </UInput>
          <UButton :loading="answerLoading" class="ml-2" :disabled="fileUploading">
            Enter
          </UButton>
        </form>
        <UButton v-show="!pageLinkElementIsVisible" circle
          class="absolute -top-8 left-1/2 -translate-x-1/2 color-zinc-100" @click="scrollToBottom"
          icon="i-heroicons-chevron-down">
        </UButton>
      </div>
      <div class="text-center text-zinc-400 py-1">cjboy76 © 2024</div>
    </div>
    <UModal v-model="showFileModal" :style="{ width: '25rem' }">
      <UCard>
        <template #header>
          <div>上傳文件</div>
        </template>
        <UInput type="file" icon="i-heroicons-folder" class="flex justify-center" accept=".pdf" @change="onFileSelect">
        </UInput>
        <template #footer>
          <div class="flex justify-end">
            <UButton text class="mr-4" @click="showFileModal = false">取消</UButton>
            <UButton text :disabled="!uploadFile" @click="uploadPdf">確認</UButton>
          </div>
        </template>

      </UCard>
    </UModal>
    <UModal v-model="showKeyModal" :style="{ width: '25rem' }">
      <UCard>
        <template #header>
          <div>OpenAI Key</div>
        </template>
        <div class="mb-4">
          <a class="underline" target="_blank"
            href="https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key"> 取得 OpenAI API Key</a>
        </div>
        <UInput placeholder="API Key" v-model="storageOpenAIKey" @change="refreshStore(storageOpenAIKey)" />
        <template #footer>

          <div class="flex justify-end">
            <UButton text @click="showKeyModal = false">關閉</UButton>
          </div>

        </template>
      </UCard>
    </UModal>
    <UModal v-model="showRemoveDataConfirmModal">
      <UCard>
        <template #header>
          <h3>清除資料</h3>
        </template>

        <div>
          即將刪除 PDF 文件、對話紀錄
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton class="mr-4" @click="showRemoveDataConfirmModal = false">先不要</UButton>
            <UButton @click="removeData">確定</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
