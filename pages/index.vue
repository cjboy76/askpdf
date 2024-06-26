<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { useChat, type Message } from 'ai/vue'
import type { NuxtError } from 'nuxt/app'
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval'
import { pdfToBase64 } from '~/utils/parser'
import { get } from 'idb-keyval'
import { createDocuments, CustomVectorStore } from '#imports'
import type { Document as TDocument } from '@langchain/core/documents'
import { createVectorStore } from '~/utils/vectorStore'
import { usePDFLoader } from '~/utils/pdfloader'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
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
      description: t('open-ai-key-required')
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
      description: t('upload-file-error')
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
        },
      },
      data: {
        model: selectedChatModel.value,
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
    vectorStore = createVectorStore({ openAIApiKey: storageOpenAIKey.value, modelName: seletedEmbeddingModel.value })
    vectorStore.addDocuments(docsFromStore)
  }

  const relatedPageNumFromStore = await get('askpdf-related-pages')
  if (relatedPageNumFromStore.length > 0)
    relatedPagesSet.value = relatedPageNumFromStore
}
onMounted(() => {
  if (storageOpenAIKey.value) {
    vectorStore = createVectorStore({ openAIApiKey: storageOpenAIKey.value, modelName: seletedEmbeddingModel.value })
  }
  refreshFromCache()
})

onBeforeUnmount(() => {
  pdfSrc.value && URL.revokeObjectURL(pdfSrc.value)
  stop()
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

const colorMode = useColorMode()
const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
})

const showSettingModal = ref(false)
const seletedEmbeddingModel = ref<'text-embedding-3-small' | 'text-embedding-3-large' | 'text-embedding-ada-002'>('text-embedding-3-small')
const selectedChatModel = ref<'gpt-4o' | 'gpt-4-turbo' | 'gpt-4' | 'gpt-3.5-turbo'>('gpt-4o')

watch(storageOpenAIKey, (newValue, oldValue) => {
  if (newValue !== oldValue) refreshStore(newValue)
})

async function refreshStore(key: string) {
  vectorStore = createVectorStore({ openAIApiKey: key, modelName: seletedEmbeddingModel.value })
  if (documentDB.value) await vectorStore.addDocuments(documentDB.value)
  toast.add({
    title: 'Success',
    description: t('open-ai-key-success')
  })
}
</script>

<template>
  <div class="flex flex-col">
    <header class="py-2 px-4 z-10 flex justify-between">
      <div class="grid place-items-center font-bold">AskPDF</div>
      <div class="flex justify-end items-center">
        <ClientOnly>
          <UButton class="mx-1" :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'" color="gray"
            variant="ghost" aria-label="Theme" @click="isDark = !isDark" />
          <template #fallback>
            <div class="w-8 h-8" />
          </template>
        </ClientOnly>
        <UButton text class="mx-1" @click="showFileModal = true" :disabled="fileUploading">
          {{ t('upload-file') }}
        </UButton>
        <UButton text class="mx-1" @click="showSettingModal = true" :disabled="fileUploading">
          {{ t('settings') }}
        </UButton>
        <LangSelector class="mx-1" />
      </div>
    </header>
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
          <div v-for="{ content, role, id } of messages" :key="id" v-show="role !== 'system'">
            <div class="w-4/5 mx-auto grid grid-cols-8 gap-2 py-6">
              <div class="col-span-1 flex justify-end">
                <UIcon v-if="role === 'assistant'" class="w-8 h-8" name="i-heroicons-face-smile-16-solid" />
                <UIcon v-if="role === 'user'" class="w-8 h-8" name="i-heroicons-user-solid" />
              </div>
              <div class="col-span-7">
                <div class="h-8 mb-2 grid items-center font-bold">
                  {{ role === 'assistant' ? 'AskPDF' : t('you') }}
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
            <UInput class="flex-grow" v-model="input" :placeholder="t('input-placeholder')"
              :disabled="answerLoading || fileUploading">
            </UInput>
            <UButton :loading="answerLoading" class="ml-2" :disabled="fileUploading" type="submit">
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
    </div>
    <UModal v-model="showFileModal" :style="{ width: '25rem' }" prevent-close>
      <UCard>
        <template #header>
          <div>{{ t('upload-file') }}</div>
        </template>
        <UInput type="file" icon="i-heroicons-folder" class="flex justify-center" accept=".pdf" @change="onFileSelect">
        </UInput>
        <template #footer>
          <div class="flex justify-end">
            <UButton text class="mr-4" @click="showFileModal = false">{{ t('cancel') }}</UButton>
            <UButton text :disabled="!uploadFile" @click="uploadPdf">{{ t('confirm') }}</UButton>
          </div>
        </template>

      </UCard>
    </UModal>
    <UModal v-model="showClearDataConfirmModal">
      <UCard>
        <template #header>
          <h3>{{ t('clear-data') }}</h3>
        </template>

        <div>
          {{ t('clear-data-message') }}
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton class="mr-4" @click="showClearDataConfirmModal = false">{{ t('cancel') }}</UButton>
            <UButton @click="clearData">{{ t('confirm') }}</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
    <UModal v-model="showSettingModal" prevent-close>
      <UCard>
        <template #header>
          <h3>{{ t('settings') }}</h3>
        </template>
        <div class="mb-4">
          <h5 class="text-black text-opacity-50 mb-1 dark:text-white dark:text-opacity-50">Embedding models</h5>
          <USelect v-model="seletedEmbeddingModel"
            :options="['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002']" />

        </div>
        <div class="mb-4">
          <h5 class="text-black text-opacity-50 mb-1 dark:text-white dark:text-opacity-50">Chat models</h5>
          <USelect v-model="selectedChatModel" :options="['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']" />

        </div>
        <div class="mb-4">
          <h5 class="text-black text-opacity-50 mb-1 dark:text-white dark:text-opacity-50">OpenAI API Key

          </h5>
          <UInput placeholder="API Key" v-model="storageOpenAIKey" />
          <div class="flex justify-end">
            <a class="text-sm text-white text-opacity-50 mt-2 hover:underline text-right" target="_blank"
              href="https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key"> {{
                t('open-ai-key-message') + '?' }}</a>
          </div>
        </div>
        <UDivider class="my-4"></UDivider>
        <UButton color="red" block @click="showClearDataConfirmModal = true">
          {{ t('clear-data') }}
        </UButton>
        <template #footer>
          <div class="flex justify-end">
            <UButton @click="showSettingModal = false">{{
              t('close')
              }}</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>



</template>
