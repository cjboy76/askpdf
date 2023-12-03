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
import { useDoc } from "~/store";

const { compiled } = useDoc();

async function trigger() {
  const messages = ["hello world"];

  const result = await $fetch("/api/chat", {
    method: "post",
    body: messages,
  });

  console.log(result);
}

trigger();

// watchEffect(async () => {
//   if (compiled) return;

//   const result = await $fetch("/api/pdfloader", {
//     method: "post",
//     body: messages,
//   });

//   console.log(result);
//   // send to openai
// });
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@600&display=swap");
</style>
