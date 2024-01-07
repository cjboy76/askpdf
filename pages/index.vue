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
  type UploadFileInfo,
  type UploadProps,
} from "naive-ui";
import {
  CloudUploadOutline,
  MoonOutline,
  SunnyOutline,
} from "@vicons/ionicons5";
import { useDoc } from "~/store";
import { useMessage } from "naive-ui";
import { useDark, useToggle } from "@vueuse/core";

const isDark = useDark();
const toggleDark = useToggle(isDark);

const uploadFile = ref<UploadFileInfo[]>([]);
const showModal = ref(false);
const { setDocument } = useDoc();
const message = useMessage();

const onChange: UploadProps["onChange"] = ({ file }) => {
  uploadFile.value.push(file);
};

function uploadPdfCanceller() {
  uploadFile.value = [];
  showModal.value = false;
}
const loading = ref(false);

async function uploadPdfHandler() {
  loading.value = true;
  try {
    const file = toRaw(uploadFile.value[0]);
    const formData = new FormData();
    formData.append("file", file.file!);
    const pdfInfo = await $fetch("/api/pdfloader", {
      method: "post",
      body: formData,
    });
    await $fetch("/api/createDocument", {
      method: "post",
      body: pdfInfo,
    });
    setDocument(pdfInfo);
  } catch (error) {
    message.error(error as string);
  } finally {
    uploadPdfCanceller();
    loading.value = false;
  }
}

const messages = <{ user: string; message: string; time: number }[]>[
  { user: "system", message: "今天天氣真好", time: 2101101010101 },
  {
    user: "user",
    message: `The collection instance this model uses. A Mongoose collection is a thin wrapper around a [MongoDB Node.js driver collection](MongoDB Node.js driver collection). Using Model.collection means you bypass Mongoose middleware, validation, and casting.

This property is read-only. Modifying this property is a no-op.`,
    time: 24011313010101,
  },
  {
    user: "system",
    message: `The collection instance this model uses. A Mongoose collection is a thin wrapper around a [MongoDB Node.js driver collection](MongoDB Node.js driver collection). Using Model.collection means you bypass Mongoose middleware, validation, and casting.

This property is read-only. Modifying this property is a no-op.`,
    time: 2401131301,
  },
  {
    user: "user",
    message: `The collection instance this model uses. A Mongoose collection is a thin wrapper around a [MongoDB Node.js driver collection](MongoDB Node.js driver collection). Using Model.collection means you bypass Mongoose middleware, validation, and casting.

This property is read-only. Modifying this property is a no-op.`,
    time: 24011322220101,
  },
  {
    user: "system",
    message: `The collection instance this model uses. A Mongoose collection is a thin wrapper around a [MongoDB Node.js driver collection](MongoDB Node.js driver collection). Using Model.collection means you bypass Mongoose middleware, validation, and casting.

This property is read-only. Modifying this property is a no-op.`,
    time: 24013333010101,
  },
  {
    user: "user",
    message: `The collection instance this model uses. A Mongoose collection is a thin wrapper around a [MongoDB Node.js driver collection](MongoDB Node.js driver collection). Using Model.collection means you bypass Mongoose middleware, validation, and casting.

This property is read-only. Modifying this property is a no-op.`,
    time: 4444,
  },
];
</script>

<template>
  <div class="h-screen grid grid-cols-6 dark:bg-stone-800 dark:text-stone-100">
    <div
      class="col-span-3 bg-gray-100 h-full flex flex-col dark:bg-stone-600 dark:text-stone-100"
    ></div>
    <div class="col-span-3 flex flex-col h-full">
      <div class="max-h-[calc(100vh-64px)] overflow-y-auto flex flex-col">
        <div
          class="sticky top-0 py-4 px-4 z-10 bg-stone-800 flex justify-end items-center"
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
          >
            上傳文件
          </n-button>
          <n-avatar
            class="mx-4 cursor-pointer"
            round
            size="medium"
            src="https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg"
          />
        </div>
        <div v-if="messages.length === 0" class="text-center">
          <h1 class="text-4xl font-bold text-center mb-4">AskPDF</h1>
          <h2 class="text-xl font-bold text-center mb-4">
            用 AI 和 PDF 聊天吧
          </h2>
        </div>
        <div v-show="loading" class="w-4/5 mx-auto">
          <n-skeleton text :repeat="2" />
          <n-skeleton text style="width: 80%; margin: 0 auto" />
        </div>
        <div v-for="{ time, message, user } of messages" :key="time">
          <div class="w-4/5 mx-auto grid grid-cols-8 py-6">
            <div class="col-span-1 flex justify-center">
              <n-avatar
                class="h-10 w-10"
                round
                size="medium"
                src="https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg"
              />
            </div>
            <div class="col-span-7">
              <div class="h-10 w-10 mb-2 grid items-center font-bold">
                {{ user === "system" ? "AskPDF" : user }}
              </div>
              <p>
                {{ message }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="h-16 px-4 pb-6 pt-2">
        <div class="w-5/6 mx-auto">
          <n-input class="w-4/5 mx-auto" size="large" placeholder="輸入訊息">
          </n-input>
        </div>
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
@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@600&display=swap");
html {
  background-color: rgb(41 37 36);
}
</style>
