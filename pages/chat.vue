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
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import PrimeButton from 'primevue/button'
import PrimeDialog from 'primevue/dialog'
import PrimeInputText from 'primevue/inputtext'
import PrimeAvatar from 'primevue/avatar'
import PrimeProgressSpinner from 'primevue/progressspinner'
import PrimeFileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload'
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';

const toast = useToast()
const confirm = useConfirm()

const { loggedIn, user, clear } = useUserSession()
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
      severity: 'error',
      summary: 'Error Message',
      detail: error,
      life: 3000
    })
  }
})

let vectorStore: CustomVectorStore
const showFileModal = ref(false)
const showKeyModal = ref(false)
const uploadFile = ref()

const onFileSelect = (event: FileUploadSelectEvent) => {
  if (event.files.length) uploadFile.value = event.files[0]

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

watch(messages, (newValue) => {
  messagesDB.value = newValue
})

async function uploadPdf() {
  if (!storageOpenAIKey.value) {
    toast.add({
      severity: 'info',
      summary: 'Info Message',
      detail: '請設定 OpenAI API Key',
      life: 3000
    })
    return
  }
  if (!uploadFile.value) return
  const file = toRaw(uploadFile.value)
  showFileModal.value = false
  fileUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('user', user.value.sub)

    const pdfInfo = await $fetch('/api/pdfloader', {
      method: 'post',
      body: formData
    })
    const documents = await createDocuments(pdfInfo.data)
    documentDB.value = documents
    vectorStore.addDocuments(documents)
    fileDB.value = await pdfToBase64(file as File)
    const pdfBlob = new Blob([file], { type: 'application/pdf' })
    pdfSrc.value = URL.createObjectURL(pdfBlob)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error Message',
      detail: '上傳檔案失敗，請確認檔案類型',
      life: 3000
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
}

const userDropOptions = [
  {
    label: '登出',
    command: () => {
      clear()
      navigateTo('/')
    }
  }
]
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
      severity: 'error',
      summary: 'Error Message',
      detail: errorMessage,
      life: 3000
    })
    answerLoading.value = false
  }
}

watch(useChatLoading, (v) => {
  if (!v) {
    answerLoading.value = false
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

onUnmounted(() => {
  pdfSrc.value && URL.revokeObjectURL(pdfSrc.value)
  stop()
})

const viewerRef = ref()

function removeData() {
  confirm.require({
    header: '清除資料',
    message: '即將刪除 PDF 文件、對話紀錄',
    acceptLabel: '確定',
    rejectLabel: '先不要',
    accept: async () => {
      await deletePdfData()
      toast.add({
        severity: 'success',
        summary: 'Success Message',
        detail: '資料已刪除',
        life: 3000
      })
    }
  })
}

async function refreshStore(key: string) {
  vectorStore = useVectorStore(key)
  if (documentDB.value) await vectorStore.addDocuments(documentDB.value)
  toast.add({
    severity: 'success',
    summary: 'Success Message',
    detail: 'OpenAI API key 已更新',
    life: 3000
  })
}

const menu = ref()

function toggleMenu(e: Event) {
  menu.value.toggle(e)
}
</script>

<template>
  <div class="grid grid-cols-6">
    <div class="col-span-3 h-full flex flex-col flex-grow relative">
      <client-only fallback-tag="span" fallback="Loading comments...">
        <PdfViewer v-if="user" ref="viewerRef" :pdfSrc="pdfSrc" />
        <div
          v-else
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          d(`･∀･)b
        </div>
      </client-only>
    </div>
    <div class="col-span-3 flex flex-col h-full">
      <div
        class="max-h-[calc(100vh-80px)] overflow-y-auto flex flex-col flex-grow"
      >
        <div
          class="sticky top-0 py-4 px-4 z-10 flex justify-end items-center bg-zinc-800"
        >
          <PrimeButton
            v-if="user"
            text
            class="mx-1"
            @click="removeData"
          >
            清除資料
          </PrimeButton>
          <PrimeButton
            v-if="user"
            text
            class="mx-1"
            @click="showKeyModal = true"
            :disabled="fileUploading"
          >
            OpenAI
          </PrimeButton>
          <PrimeButton
            v-if="user"
            text
            class="mx-1"
            @click="showFileModal = true"
            :disabled="fileUploading"
          >
            上傳文件
          </PrimeButton>
          <PrimeAvatar
            v-if="loggedIn"
            class="mx-4 cursor-pointer"
            :image="user.picture"
            @click="toggleMenu"
          />
          <Menu
            ref="menu"
            id="overlay_menu"
            :model="userDropOptions"
            :popup="true"
          />
        </div>
        <div v-if="!fileDB" class="text-center mt-20">
          <h1 class="text-4xl font-bold text-center mb-4 opacity-50">AskPDF</h1>
          <h3 v-if="loggedIn" class="font-bold text-center mb-4 opacity-50">
            上傳文件，開始體驗
          </h3>
        </div>
        <div
          v-show="fileUploading"
          class="w-4/5 mx-auto grid place-items-center"
        >
          <PrimeProgressSpinner size="medium" />
        </div>
        <div
          v-for="{ content, role, id } of messages"
          :key="id"
          v-show="role !== 'system'"
        >
          <div class="w-4/5 mx-auto grid grid-cols-8 gap-2 py-6">
            <div class="col-span-1 flex justify-end">
              <PrimeAvatar
                v-if="role === 'user'"
                class="w-8 h-8"
                round
                :image="user.picture"
              />
              <PrimeAvatar
                v-if="role === 'assistant'"
                class="w-8 h-8"
                round
                icon="pi pi-user"
              />
            </div>
            <div class="col-span-7">
              <div class="h-8 mb-2 grid items-center font-bold">
                {{ role === 'assistant' ? 'AskPDF' : user.name }}
              </div>
              <p>
                {{ content }}
              </p>
            </div>
          </div>
        </div>
        <div
          ref="pageLinkElement"
          v-show="!answerLoading"
          class="w-3/5 mx-auto pb-10"
        >
          <span
            v-for="(page, index) of relatedPagesSet"
            :key="index"
            class="font-bold p-1 rounded cursor-pointer hover:bg-yellow-200 hover:underline"
            @click="viewerRef.setViewerPage(page)"
          >
            #{{ page }}</span
          >
        </div>
      </div>
      <div class="h-12 pt-2 relative">
        <form
          class="w-5/6 max-w-2xl mx-auto flex"
          @submit.prevent="submitHandler"
        >
          <PrimeInputText
            class="flex-grow"
            v-model="input"
            placeholder="Message..."
            :disabled="answerLoading || fileUploading"
          >
          </PrimeInputText>
          <PrimeButton text outlined class="ml-2" :disabled="!user || fileUploading">
            <span v-show="answerLoading"><i class="pi pi-spin pi-spinner"></i></span>
            <span v-show="!answerLoading">Enter</span>
          </PrimeButton>
        </form>
        <PrimeButton
          v-show="!pageLinkElementIsVisible"
          size="small"
          circle
          class="absolute -top-8 left-1/2 -translate-x-1/2 color-zinc-100"
          @click="scrollToBottom"
          style="background-color: black"
          icon="pi pi-caret-down"
        >
        </PrimeButton>
      </div>
      <div class="text-center text-zinc-400 py-1">cjboy76 © 2024</div>
    </div>
    <PrimeDialog v-model:visible="showFileModal" :style="{ width: '25rem' }">
      <template #header>
        <div>上傳文件</div>
      </template>
      <PrimeFileUpload
        class="flex justify-center"
        mode="basic"
        accept=".pdf"
        chooseLabel="上傳"
        @select="onFileSelect"
      >
      </PrimeFileUpload>
      <div class="mt-4 flex justify-end">
        <PrimeButton text class="mr-4" @click="showFileModal = false"
          >取消</PrimeButton
        >
        <PrimeButton text :disabled="!uploadFile" @click="uploadPdf">確認</PrimeButton>
      </div>
    </PrimeDialog>
    <PrimeDialog v-model:visible="showKeyModal" :style="{ width: '25rem' }">
      <template #header>
        <div>OpenAI Key</div>
      </template>
      <PrimeInputText
        class="w-full"
        placeholder="貼上 OpenAI API Key"
        v-model="storageOpenAIKey"
        @change="refreshStore(storageOpenAIKey)"
      />
      <div class="mt-4 flex justify-end">
        <PrimeButton text @click="showKeyModal = false">關閉</PrimeButton>
      </div>
    </PrimeDialog>
    <ConfirmDialog />
    <Toast />
  </div>
</template>

<style>
/* @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600&display=swap'); */
</style>
