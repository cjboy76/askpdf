<template>
  <div class="h-screen grid grid-cols-6">
    <div class="col-span-1 bg-gray-100 h-full flex flex-col">
      <div class="flex-1 p-2">
        <n-button quaternary class="w-full" @click="open()">
          New Document
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
              <NButton quaternary>外觀</NButton>
              <NButton quaternary>歷史</NButton>
              <NButton quaternary>登入</NButton>
            </div>
          </div>
        </nav>
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NIcon } from "naive-ui";
import { SettingsOutline, AddOutline } from "@vicons/ionicons5";
import { useFileDialog } from "@vueuse/core";

const uploadFile = ref<File>();

const { open, onChange } = useFileDialog({
  accept: ".pdf",
});
onChange(uploadFileHandler);

function uploadFileHandler(files: File[] | null) {
  if (!files) return;
  uploadFile.value = files[0];
}
</script>
