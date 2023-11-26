<template>
  <!-- <div class="h-screen flex flex-col">
    <nav>
      <div class="flex justify-between">
        <div>chatPdf</div>
        <div class="flex">
          <UiButton>Theme</UiButton>
          <UiButton>歷史</UiButton>
          <UiButton>登入</UiButton>
        </div>
      </div>
    </nav> -->
  <main class="flex-grow">
    <div class="flex justify-center mt-[20%]">
      <div class="w-1/3">
        <h1 class="text-4xl font-bold text-center mb-4">ChatPDF</h1>
        <h2 class="text-xl font-bold text-center mb-4">
          用全新方式完成你的報告
        </h2>
        <div class="text-center">
          <UiInput placeholder="pdf url" class="mb-2" v-model="pdfUrl" />
          <UiButton @click="open()">
            <span v-show="!uploadFile?.name">選擇檔案</span>
            {{ uploadFile?.name }}
            <XCircle v-show="uploadFile?.name" class="ml-2" />
          </UiButton>
          <UiButton @click="open()"> 開始 </UiButton>
        </div>
        <!-- <div class="flex justify-center items-center mt-4">
              <span>{{ fileName }}</span>
              <UiButton variant="ghost" class="ml-2">開始</UiButton>
            </div> -->
      </div>
    </div>
  </main>
  <!-- </div> -->
</template>

<script setup lang="ts">
import { useFileDialog } from "@vueuse/core";
import { XCircle } from "lucide-vue-next";

// const source = "https://www.scholastic.com/hpread/HP_Book1_Chapter_Excerpt.pdf";
// async function createPdfFile(source: string | File) {
//   const users = await $fetch("/api/pdfloader", {
//     method: "POST",
//     body: { source },
//   });
// }
const pdfUrl = ref("");
const uploadFile = ref<File>();

const { open, reset, onChange } = useFileDialog({
  accept: ".pdf", // Set to accept only image files
});
onChange((files: FileList) => {
  /** do something with files */
  console.log(files);
  uploadFile.value = files[0];
});
// const { data } = await useFetch(`/api/pdfloader?url=${source}`);

// console.log(data.value);
</script>

<style>
@import "./assets/css/tailwind.css";
@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@600&display=swap");
</style>
