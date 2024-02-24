<script setup lang="ts">
import {
  NButton,
  NInput,
  NIcon,
  NModal,
  NCard,
  NUpload,
  NUploadDragger,
  NText,
  NP,
  NSkeleton,
  NAvatar,
  NDropdown,
  NInputGroup,
  NForm,
  type UploadFileInfo,
  type UploadProps,
  c
} from 'naive-ui'
import {
  CloudUploadOutline,
  Key,
  AtCircleSharp,
  Document,
  ChevronDown
} from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'
import { useStorage } from '@vueuse/core'
import { useChat } from 'ai/vue'
import type { NuxtError } from 'nuxt/app'
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval'
import { pdfToBase64 } from '~/utils/parser'
import { get } from 'idb-keyval'

const { loggedIn, user, clear } = useUserSession()
const storageOpenAIKey = useStorage('openai_key', '')
const {
  messages,
  setMessages,
  handleSubmit,
  input,
  isLoading: useChatLoading
} = useChat({
  headers: {
    'x-openai-key': storageOpenAIKey.value
  }
})

const uploadFile = ref<UploadFileInfo[]>([])
const showFileModal = ref(false)
const showKeyModal = ref(false)
const message = useMessage()
const relatedPagesSet = new Set<number>()

const onChange: UploadProps['onChange'] = ({ file }) => {
  uploadFile.value.push(file)
}

function uploadPdfCanceller() {
  uploadFile.value = []
  showFileModal.value = false
}
const fileUploading = ref(false)
const { data: fileDB } = useIDBKeyval('askpdf-file', '')
const { data: idsDB } = useIDBKeyval<string[]>('askpdf-ids', [])

async function uploadPdfHandler() {
  const file = toRaw(uploadFile.value[0])
  uploadPdfCanceller()
  if (!file.file) return

  if (idsDB.value.length) {
    await $fetch('/api/deleteVector', {
      method: 'post',
      body: {
        ids: idsDB.value
      }
    })
  }

  fileUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file.file!)
    formData.append('user', user.value.sub)

    const pdfInfo = await $fetch('/api/pdfloader', {
      method: 'post',
      body: formData
    })
    const ids = await $fetch('/api/createVecStore', {
      method: 'post',
      body: {
        data: pdfInfo.data,
        pdf_name: pdfInfo.name,
        user_sub: user.value.sub
      },
      headers: {
        'x-openai-key': storageOpenAIKey.value
      }
    })
    const base64File = await pdfToBase64(file.file as File)
    idsDB.value = ids
    fileDB.value = base64File

    const pdfBlob = new Blob([file.file!], { type: 'application/pdf' })
    pdfSrc.value = URL.createObjectURL(pdfBlob)
  } catch (error) {
    message.error((error as any).message)
  } finally {
    fileUploading.value = false
  }
}

const userDropOptions = [
  {
    label: user.value ? user.value.name : '',
    key: 'profile'
  },
  {
    label: '登出',
    key: 'logout'
  }
]

const onUserSelect = (key: string) => {
  if (key === 'logout') {
    clear()
  }
}
let assistantCount = 0
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
  console.log('trigger scrollToBottom')
  pageLinkElement.value?.scrollIntoView({
    block: 'end',
    inline: 'nearest',
    behavior: 'smooth'
  })
}

type SimilarityDocument = {
  pageContent: string
  metadata: { page: number; user_sub: string; pdf_name: string }
}

async function submitHandler(e: Event) {
  if (!input.value || answerLoading.value) return
  if (!storageOpenAIKey.value) {
    showKeyModal.value = true
    return
  }
  answerLoading.value = true
  try {
    const similarityDocs = await $fetch('/api/queryVector', {
      method: 'post',
      body: { input: input.value },
      headers: {
        'x-openai-key': storageOpenAIKey.value
      }
    })

    relatedPagesSet.clear()
    ;(similarityDocs as SimilarityDocument[])
      .sort((a, b) => a.metadata.page - b.metadata.page)
      .forEach((s) => relatedPagesSet.add(s.metadata.page))

    const systemPrompt = similarityDocs.map((s) => s.pageContent).join('')
    setMessages([
      ...messages.value,
      { id: `${assistantCount++}`, role: 'system', content: systemPrompt }
    ])
    handleSubmit(e)
  } catch (error: unknown) {
    const { message: errorMessage } = error as NuxtError
    message.error(errorMessage)
    answerLoading.value = false
  }
}

watch(useChatLoading, (v) => {
  if (!v) {
    answerLoading.value = false
  }
})

const pdfSrc = ref('')
onMounted(async () => {
  const pdfFromStore = await get('askpdf-file')
  if (pdfFromStore) {
    const file = base64ToPdf(pdfFromStore)
    pdfSrc.value = URL.createObjectURL(file)
  }
})

onUnmounted(() => {
  pdfSrc.value && URL.revokeObjectURL(pdfSrc.value)
  stop()
})

const viewerRef = ref()
function setPage(p: number) {
  viewerRef.value.setPage(p)
}
</script>

<template>
  <div class="h-screen grid grid-cols-6">
    <div class="col-span-3 bg-gray-100 h-full flex flex-col flex-grow relative">
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
          class="sticky top-0 py-4 px-4 z-10 bg-white flex justify-end items-center"
        >
          <span @click="scrollToBottom">click me</span>
          <n-button
            v-if="user"
            quaternary
            class="mx-1"
            @click="showKeyModal = true"
            :disabled="fileUploading"
          >
            OpenAI
            <template #icon>
              <n-icon><Key /></n-icon>
            </template>
          </n-button>
          <n-button
            v-if="user"
            quaternary
            class="mx-1"
            @click="showFileModal = true"
            :disabled="fileUploading"
          >
            上傳文件
            <template #icon>
              <n-icon><Document /></n-icon>
            </template>
          </n-button>
          <client-only>
            <n-dropdown
              v-if="loggedIn"
              trigger="click"
              :options="userDropOptions"
              @select="onUserSelect"
            >
              <n-avatar
                class="mx-4 cursor-pointer"
                round
                size="medium"
                :src="user.picture"
              />
            </n-dropdown>
          </client-only>
        </div>
        <div v-if="messages.length === 0" class="text-center mt-20">
          <h1 class="text-4xl font-bold text-center mb-4 opacity-50">AskPDF</h1>
          <h3 v-if="loggedIn" class="font-bold text-center mb-4 opacity-50">
            上傳文件，開始體驗
          </h3>
          <a href="/api/auth/google" v-if="!loggedIn">
            <n-button> 登入 Google </n-button>
          </a>
        </div>
        <div v-show="fileUploading" class="w-4/5 mx-auto">
          <n-skeleton text :repeat="2" />
          <n-skeleton text style="width: 80%; margin: 0 auto" />
        </div>
        <div
          v-for="{ content, role, id } of messages"
          :key="id"
          v-show="role !== 'system'"
        >
          <div class="w-4/5 mx-auto grid grid-cols-8 gap-2 py-6">
            <div class="col-span-1 flex justify-end">
              <n-avatar
                v-show="role === 'user'"
                class="w-8 h-8"
                round
                :src="user.picture"
              />
              <n-avatar v-show="role === 'assistant'" class="w-8 h-8" round>
                <n-icon>
                  <AtCircleSharp />
                </n-icon>
              </n-avatar>
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
          v-show="!answerLoading && relatedPagesSet.size !== 0"
          class="w-3/5 mx-auto pb-10"
        >
          <span
            v-for="(page, index) of relatedPagesSet"
            :key="index"
            class="font-bold p-1 rounded cursor-pointer hover:bg-yellow-200 hover:underline"
            @click="setPage(page)"
          >
            #{{ page }}</span
          >
        </div>
      </div>
      <div class="h-12 pt-2 relative">
        <n-form class="w-5/6 max-w-2xl mx-auto" @submit.prevent="submitHandler">
          <n-input-group>
            <n-input
              size="large"
              v-model:value="input"
              placeholder="輸入訊息"
              :disabled="answerLoading"
            >
            </n-input>
            <n-button
              attr-type="submit"
              size="large"
              :loading="answerLoading"
              :disabled="!user"
            >
              Enter
            </n-button>
          </n-input-group>
        </n-form>
        <n-button
          v-show="
            messages.length && !answerLoading && !pageLinkElementIsVisible
          "
          size="small"
          circle
          class="absolute -top-8 left-1/2 -translate-x-1/2"
          @click="scrollToBottom"
          style="background-color: white"
        >
          <template #icon>
            <n-icon><ChevronDown /></n-icon>
          </template>
        </n-button>
      </div>
      <div class="text-center text-stone-400 py-1">cjboy76 © 2024</div>
    </div>
  </div>
  <n-modal v-model:show="showFileModal">
    <n-card
      title="上傳文件"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="w-[500px]"
    >
      <n-upload
        :multiple="false"
        directory-dnd
        accept=".pdf"
        :on-change="onChange"
        :show-remove-button="true"
        :max="1"
      >
        <n-upload-dragger>
          <div style="margin-bottom: 12px">
            <n-icon size="48" :depth="3">
              <CloudUploadOutline />
            </n-icon>
          </div>
          <n-text class="text-xl"> 點擊或拖曳文件至此區域上傳 </n-text>
          <n-p depth="3" class="mt-2">
            嚴禁上傳敏感資訊，例如您的銀行卡PIN碼或信用卡到期日。
          </n-p>
        </n-upload-dragger>
      </n-upload>
      <template #footer>
        <div class="flex justify-end">
          <n-button quaternary class="mr-4" @click="uploadPdfCanceller"
            >取消</n-button
          >
          <n-button
            quaternary
            :disabled="uploadFile.length === 0"
            @click="uploadPdfHandler"
            >確認</n-button
          >
        </div>
      </template>
    </n-card>
  </n-modal>
  <n-modal v-model:show="showKeyModal">
    <n-card
      title="OpenAI Key"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="w-[500px]"
    >
      <n-input
        type="password"
        show-password-on="mousedown"
        placeholder="貼上 OpenAI API Key"
        v-model:value="storageOpenAIKey"
      />
      <template #footer>
        <div class="flex justify-end">
          <n-button quaternary @click="showKeyModal = false">關閉</n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600&display=swap');
</style>
