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
// import { useChat } from "ai/vue";

const docStore = useDoc();

docStore.$subscribe(async (_mutation, state) => {
  if (!state.document.length) return;
  const result = await getSummarize(
    toRaw(state.document),
    toRaw(state.rawTextContent)
  );

  console.log({ result });
});

const systemPrompt = `You are a helpful assistant. A user will provide you with a various genre of an article and you will provide a comprehensive summary of the given text. The summary should cover all the key points and main ideas presented in the original text, while also condensing the information into a concise and easy-to-understand format. Please ensure that the summary includes relevant details and examples that support the main ideas, while avoiding any unnecessary information or repetition. The length of the summary should be appropriate for the length and complexity of the original text, providing a clear and accurate overview without omitting any important information.`;

async function getSummarize(document: PageContent[], rawTextContent: string) {
  if (!document.length) return;
  const tokenLimit = 5000;
  const tokenLength = await $fetch("/api/tokenizer", {
    method: "post",
    body: { data: rawTextContent },
  });

  const assistantMessages = getAssisttantMessages(document);
  const chunkLimit = Math.ceil(
    assistantMessages.length / Math.ceil(tokenLength / tokenLimit)
  );
  const splitChunks = getSplitChunks(chunkLimit, assistantMessages);
  return splitChunks.reduce(async (prevPromise, currChunk) => {
    if (prevPromise) {
      const prevSum = await prevPromise;
      currChunk = [{ role: "assistant", content: prevSum }, ...currChunk];
    }
    return chunkPromise(currChunk);
  }, Promise.resolve(""));
}

function getAssisttantMessages(document: PageContent[]) {
  return document.map((page) => {
    return {
      role: "assistant",
      content: page.textContent,
    };
  });
}

function getSplitChunks(
  limit: number,
  assistantMessages: { role: string; content: string }[]
) {
  let temp = [];
  const chunks = [];
  for (const m of assistantMessages) {
    if (temp.length === limit) {
      chunks.push([...temp]);
      temp = [];
    }
    temp.push(m);
  }

  if (temp) chunks.push(temp);

  return chunks;
}

function chunkPromise(assistantMessages: { role: string; content: string }[]) {
  return new Promise<string>((resolve) => {
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...assistantMessages,
      { role: "user", content: "Summarize this article." },
    ];
    const chunkSum = $fetch("/api/summary", {
      method: "post",
      body: messages,
    });

    return chunkSum.then((result) => resolve(result || ""));
  });
}
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@600&display=swap");
</style>
