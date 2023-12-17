<script setup lang="ts">
import {
  NButton,
  NIcon,
  NModal,
  NCard,
  NUpload,
  NUploadDragger,
  NText,
  NP,
  type UploadFileInfo,
  type UploadProps,
} from "naive-ui";
import {
  SettingsOutline,
  AddOutline,
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

async function uploadPdfHandler() {
  try {
    const file = toRaw(uploadFile.value[0]);
    const formData = new FormData();
    formData.append("file", file.file!);
    const pdfInfo = await $fetch("/api/pdfloader", {
      method: "post",
      body: formData,
    });
    setDocument(pdfInfo);
  } catch (error) {
    message.error(error as string);
  } finally {
    uploadPdfCanceller();
  }
}
</script>

<template>
  <div class="h-screen grid grid-cols-6 dark:bg-stone-900 dark:text-white">
    <div
      class="col-span-1 bg-gray-100 h-full flex flex-col dark:bg-stone-800 dark:text-white"
    >
      <div class="flex-1 p-2">
        <n-button
          class="w-full mt-2 dark:text-[#e5e7eb]"
          @click="showModal = true"
        >
          新增文件
          <template #icon>
            <n-icon>
              <AddOutline />
            </n-icon>
          </template>
        </n-button>
      </div>
      <div class="py-2 px-4">
        <n-button quaternary circle>
          <template #icon>
            <n-icon>
              <SettingsOutline />
            </n-icon>
          </template>
        </n-button>
      </div>
    </div>
    <div class="col-span-5">
      <div class="container mx-auto flex flex-col h-full">
        <nav class="py-4 px-4">
          <div class="flex justify-between items-center">
            <div>ChatPDF</div>
            <div class="flex">
              <NButton
                @click="() => toggleDark()"
                quaternary
                class="dark:text-[#e5e7eb]"
              >
                <template #icon>
                  <n-icon>
                    <MoonOutline v-show="isDark" />
                    <SunnyOutline v-show="!isDark" />
                  </n-icon>
                </template>
              </NButton>
              <NButton quaternary class="dark:text-[#e5e7eb]">歷史</NButton>
              <NButton quaternary class="dark:text-[#e5e7eb]">登入</NButton>
            </div>
          </div>
        </nav>
        <slot />
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
