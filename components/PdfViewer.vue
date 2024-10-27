<template>
  <div class="h-full relative">
    <div class="h-[6%] flex justify-between items-center py-1 bg-zinc-300 dark:bg-zinc-800">
      <div class="flex justify-center items-center">
        <UButton
icon="i-heroicons-chevron-up" size="sm" color="primary" square variant="ghost"
          class="mx-1" :disabled="!props.pdfSrc" @click="setPageHandler(currentPage - 1)" />
        <div class="flex mx-1">
          <UInput
v-model="currentPage" class="w-20" type="number" :use-grouping="false" :min="1" :max="totalPages"
            :disabled="!props.pdfSrc" @keyup.enter="setPageHandler(currentPage)" />
        </div>
        <div class="grid place-items-center mx-1">
          <span> / {{ totalPages }}</span>
        </div>
        <UButton
icon="i-heroicons-chevron-down" size="sm" color="primary" square variant="ghost"
          class="mx-1" :disabled="!props.pdfSrc" @click="setPageHandler(currentPage + 1)" />
      </div>
    </div>
    <div id="viewer-container" class="absolute w-full h-[94%] overflow-auto bg-zinc-200 dark:bg-zinc-700">
      <div id="viewer" class="flex justify-center"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CustomPDFViewer } from '#imports'

defineExpose({
  setViewerPage: (num: number) => {
    currentPage.value = num
    pdfViewer.setPage(num)
  }
})

const props = defineProps({
  pdfSrc: {
    type: String,
    default: ''
  }
})
const currentPage = ref(1)
const totalPages = ref(0)
const pdfViewer = new CustomPDFViewer()

watch(() => props.pdfSrc, (value) => setPDF(value))

onMounted(() => {
  if (props.pdfSrc) setPDF(props.pdfSrc)
})

async function setPDF(source: string) {
  await pdfViewer.setPdf(source)
  totalPages.value = pdfViewer.numPages()
}

function setPageHandler(v: number) {
  const page = pageRangeHandler(v)
  pdfViewer.setPage(page)
  currentPage.value = page
}

function pageRangeHandler(value: number) {
  if (value < 1) return 1
  if (value > pdfViewer.numPages()) return pdfViewer.numPages()
  return value
}
</script>

<style scoped>
#viewer :deep(.canvasWrapper canvas) {
  width: 100%;
}
</style>
