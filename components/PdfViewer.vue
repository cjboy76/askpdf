<template>
  <div class="overflow-hidden h-full">
    <div class="flex justify-between items-center py-1 bg-zinc-800 h-8">
      <div class="flex justify-center items-center">
        <Button text rounded icon="pi pi-angle-up"          class="mx-1"
          @click="togglePageHandler(-1)"
          :disabled="!props.pdfSrc" />
        <div class="w-14 flex mx-1">
          <InputNumber v-model="pageNum" :useGrouping="false" :min="1" :max="pages" :disabled="!props.pdfSrc" @blur="setPageHandler" />
        </div>
        <div class="grid place-items-center mx-1">
          <span> / {{ pages }}</span>
        </div>
        <Button text rounded icon="pi pi-angle-down"          class="mx-1"
          @click="togglePageHandler(1)"
          :disabled="!props.pdfSrc" />
      </div>
      <div>
        <button class="mx-1" :disabled="!props.pdfSrc">
          minus
        </button>
        <button class="mx-1" :disabled="!props.pdfSrc">
          plus
        </button>
      </div>
    </div>
    <div
      id="main-container"
      class="absolute w-full h-[calc(100vh-32px)] grid place-items-center bg-zinc-700"
    >
      <div id="viewer-container" class="grid place-items-center"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CustomPDFViewer } from '#imports'
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';

const props = defineProps({
  pdfSrc: String
})
const pageNum = ref(1)
const pages = ref(0)

let pdfViewer: CustomPDFViewer

function togglePageHandler(direction: number) {
  pageNum.value += direction
  if (pageNum.value < 1) {
    pageNum.value = 1
    return
  }
  if (pageNum.value > pdfViewer.numPages()) {
    pageNum.value = pdfViewer.numPages()
    return
  }
  pdfViewer.setPage(pageNum.value)
}

function setPageHandler() {
  pdfViewer.setPage(pageNum.value)
}

watch(
  () => props.pdfSrc,
  async (value = '') => {
    await pdfViewer.setPdf(value)
    pages.value = pdfViewer.numPages()
  }
)

onMounted(() => (pdfViewer = new CustomPDFViewer()))

defineExpose({
  setViewerPage: (num: number) => {
    pageNum.value = num
  pdfViewer.setPage(num)
  }
})
</script>
