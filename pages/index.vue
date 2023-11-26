<template>
  <main class="flex-grow">
    <div class="flex justify-center mt-[20%]">
      <div class="w-4/5 text-center">
        <h1 class="text-4xl font-bold text-center mb-4">ChatPDF</h1>
        <h2 class="text-xl font-bold text-center mb-4">
          用全新方式完成你的報告
        </h2>
        <div class="text-center mt-4">
          <AppButton @click="open">
            <span v-show="!uploadFile">選擇檔案</span>
            {{ uploadFile?.name }}</AppButton
          >
          <AppButton
            v-show="uploadFile"
            variant="ghost"
            @click="router.push({ path: '/chat' })"
          >
            <div
              class="i-streamline-interface-arrows-right-arrow-right-keyboard"
            ></div>
          </AppButton>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useFileDialog } from "@vueuse/core";

const router = useRouter();

// const source = "https://www.scholastic.com/hpread/HP_Book1_Chapter_Excerpt.pdf";
// async function createPdfFile(source: string | File) {
//   const users = await $fetch("/api/pdfloader", {
//     method: "POST",
//     body: { source },
//   });
// }
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

<style>
@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@600&display=swap");
</style>
