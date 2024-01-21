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
import { CloudUploadOutline } from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'
import { useDark, useToggle } from '@vueuse/core'
import { useChat } from 'ai/vue'

const isDark = useDark()
const toggleDark = useToggle(isDark)
const { loggedIn, user, clear } = useUserSession()
const { messages, setMessages, handleSubmit, input } = useChat()

const uploadFile = ref<UploadFileInfo[]>([])
const showModal = ref(false)
const message = useMessage()

const onChange: UploadProps['onChange'] = ({ file }) => {
  uploadFile.value.push(file)
}

function uploadPdfCanceller() {
  uploadFile.value = []
  showModal.value = false
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

async function submitHandler(e: Event) {
  if (!input.value) return
  const similarityDocs = await $fetch('/api/queryVector', {
    method: 'post',
    body: { input: input.value }
  })
  const assistantPrompt = similarityDocs.map((s) => s.pageContent).join('')
  setMessages([
    ...messages.value,
    { id: `${assistantCount++}`, role: 'assistant', content: assistantPrompt }
  ])
  handleSubmit(e)
}
</script>

<template>
  <div class="h-screen grid grid-cols-6 dark:bg-stone-800 dark:text-stone-100">
    <div
      class="col-span-3 bg-gray-100 h-full flex flex-col dark:bg-stone-600 dark:text-stone-100"
    ></div>
    <div class="col-span-3 flex flex-col h-full">
      <div
        class="max-h-[calc(100vh-64px)] overflow-y-auto flex flex-col flex-grow"
      >
        <div
          class="sticky top-0 py-4 px-4 z-10 bg-white dark:bg-stone-800 flex justify-end items-center"
        >
          <n-button
            @click="() => toggleDark()"
            quaternary
            class="dark:text-[#e5e7eb]"
          >
            外觀
          </n-button>
          <n-button
            quaternary
            class="dark:text-[#e5e7eb]"
            @click="showModal = true"
            :disabled="fileUploading"
          >
            上傳文件
          </n-button>
          <a href="/api/auth/google" v-if="!loggedIn">
            <n-button quaternary class="dark:text-[#e5e7eb]"> 登入 </n-button>
          </a>
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
        <div v-if="messages.length === 0" class="text-center">
          <h1 class="text-4xl font-bold text-center mb-4">AskPDF</h1>
          <h2 class="text-xl font-bold text-center mb-4">
            用 AI 和 PDF 聊天吧
          </h2>
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
            <div class="col-span-1 flex justify-center">
              <n-avatar
                class="w-8 h-8"
                round
                :src="
                  role === 'user'
                    ? user.picture
                    : 'https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg'
                "
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
      </div>
      <div class="h-16 px-4 pb-6 pt-2">
        <n-form class="w-5/6 mx-auto" @submit.prevent="submitHandler">
          <n-input-group>
            <n-input size="large" v-model:value="input" placeholder="輸入訊息">
            </n-input>
            <n-button attr-type="submit" size="large"> Enter </n-button>
          </n-input-group>
        </n-form>
      </div>
    </div>
  </div>
  <n-modal v-model:show="showModal">
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
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600&display=swap');

.dark html {
  background-color: rgb(41 37 36);
}
</style>
