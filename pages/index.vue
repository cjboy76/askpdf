<template>
  <main class="flex-grow flex flex-col">
    <div class="flex-1 flex justify-center mt-[20%]">
      <div class="w-4/5 text-center">
        <h1 class="text-4xl font-bold text-center mb-4">ChatPDF</h1>
        <h2 class="text-xl font-bold text-center mb-4">用 AI 和 PDF 聊天吧</h2>
      </div>
    </div>
    <div class="px-4 pb-6">
      <div class="w-4/5 mx-auto">
        <n-input class="w-4/5 mx-auto" size="large" placeholder="Large">
        </n-input>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { NInput } from "naive-ui";

// const source = "https://www.scholastic.com/hpread/HP_Book1_Chapter_Excerpt.pdf";
// async function createPdfFile(source: string | File) {
//   const users = await $fetch("/api/pdfloader", {
//     method: "POST",
//     body: { source },
//   });
// }
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@600&display=swap");
</style>
