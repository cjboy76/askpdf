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
        <n-input class="w-4/5 mx-auto" size="large" placeholder="輸入訊息">
        </n-input>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { NInput } from "naive-ui";
import { useDoc } from "~/store";
// import { useChat } from "ai/vue";

const docStore = useDoc();
const { summarize, status } = useSummary();

docStore.$subscribe(async (_mutation, state) => {
  if (!state.rawTextContent) return;
  const result = await summarize(
    toRaw(state.document),
    toRaw(state.rawTextContent)
  );

  console.log({ result });
});
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@600&display=swap");
</style>
