<template>
  <div class="h-full relative">
    <div class="h-[6%] flex justify-between items-center py-1 bg-zinc-800">
      <div class="flex justify-center items-center">
        <UButton icon="i-heroicons-chevron-up" size="sm" color="primary" square variant="ghost"
          class="mx-1" @click="setPageHandler(pageNum - 1)" :disabled="!props.pdfSrc" />
        <div class="flex mx-1">
          <UInput class="w-20" type="number" v-model="pageNum" :useGrouping="false" :min="1" :max="pages"
            :disabled="!props.pdfSrc" @keyup.enter="setPageHandler(pageNum)" />
        </div>
        <div class="grid place-items-center mx-1">
          <span> / {{ pages }}</span>
        </div>
        <UButton icon="i-heroicons-chevron-down" size="sm" color="primary" square variant="ghost"
          class="mx-1" @click="setPageHandler(pageNum + 1)" :disabled="!props.pdfSrc" />
      </div>
    </div>
    <div id="main-container" class="absolute left-0 bottom-0 w-full h-[94%] grid place-items-center bg-zinc-700">
      <div id="viewer-container" class="grid place-items-center"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CustomPDFViewer } from '#imports'

const props = defineProps({
  pdfSrc: String
})
const pageNum = ref(1)
const pages = ref(0)

let pdfViewer: CustomPDFViewer

function setPageHandler(v: number) {
  const page = pageRangeHandler(v)
  pdfViewer.setPage(page)
  pageNum.value = page
}

function pageRangeHandler(value: number) {
  if (value < 1) return 1
  if (value > pdfViewer.numPages()) return pdfViewer.numPages()
  return value
}

watchEffect(async () => {
  if (!pdfViewer) pdfViewer = new CustomPDFViewer()
  await pdfViewer.setPdf(props.pdfSrc || '')
  pages.value = pdfViewer.numPages()

})

defineExpose({
  setViewerPage: (num: number) => {
    pageNum.value = num
    pdfViewer.setPage(num)
  }
})
</script>
