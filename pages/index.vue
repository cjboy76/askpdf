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
  type UploadProps
} from 'naive-ui'
import {
  CloudUploadOutline,
  Key,
  AtCircleSharp,
  Document,
  ColorPaletteOutline
} from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'
import { useDark, useToggle, useStorage } from '@vueuse/core'
import { useChat } from 'ai/vue'
import type { NuxtError } from 'nuxt/app'

const isDark = useDark()
const toggleDark = useToggle(isDark)
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

const onChange: UploadProps['onChange'] = ({ file }) => {
  uploadFile.value.push(file)
}

function uploadPdfCanceller() {
  uploadFile.value = []
  showFileModal.value = false
}
const fileUploading = ref(false)

async function uploadPdfHandler() {
  fileUploading.value = true
  try {
    const file = toRaw(uploadFile.value[0])
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
        user_sub: user.sub
      },
      headers: {
        'x-openai-key': storageOpenAIKey.value
      }
    })
    console.log({ ids })
  } catch (error) {
    message.error(error as string)
  } finally {
    uploadPdfCanceller()
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
    const systemPrompt = similarityDocs.map((s) => s.pageContent).join('')
    setMessages([
      ...messages.value,
      { id: `${assistantCount++}`, role: 'system', content: systemPrompt }
    ])
    handleSubmit(e)
  } catch (error: unknown) {
    const { message: errorMessage } = error as NuxtError
    message.error(errorMessage)
  } finally {
  }
  answerLoading.value = false
}

watch(useChatLoading, (v) => {
  if (!v) {
    answerLoading.value = false
  }
})
</script>

<template>
  <div class="h-screen grid grid-cols-6 dark:bg-stone-800 dark:text-stone-100">
    <div
      class="col-span-1 bg-gray-100 h-full flex flex-col dark:bg-stone-600 dark:text-stone-100"
    ></div>
    <div class="col-span-5 flex flex-col h-full">
      <div
        class="max-h-[calc(100vh-80px)] overflow-y-auto flex flex-col flex-grow"
      >
        <div
          class="sticky top-0 py-4 px-4 z-10 bg-white dark:bg-stone-800 flex justify-end items-center"
        >
          <n-button
            @click="() => toggleDark()"
            quaternary
            class="dark:text-[#e5e7eb] mx-1"
          >
            外觀
            <template #icon>
              <n-icon><ColorPaletteOutline /></n-icon>
            </template>
          </n-button>
          <n-button
            v-if="user"
            quaternary
            class="dark:text-[#e5e7eb] mx-1"
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
            class="dark:text-[#e5e7eb] mx-1"
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
          <a href="/api/auth/google" v-if="!loggedIn">
            <n-button class="dark:text-[#e5e7eb]"> 登入 Google </n-button>
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
      </div>
      <div class="h-12 pt-2">
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
          <n-button class="mr-4" @click="uploadPdfCanceller">取消</n-button>
          <n-button
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
          <n-button @click="showKeyModal = false">關閉</n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600&display=swap');

.dark html {
  background-color: rgb(41 37 36);
}
</style>
