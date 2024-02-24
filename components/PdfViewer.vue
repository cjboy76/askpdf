<template>
  <div class="overflow-hidden h-full">
    <div class="flex justify-between items-center py-1 bg-white">
      <div class="flex justify-center items-center">
        <n-button
          size="small"
          quaternary
          class="mx-1"
          @click="togglePageHandler(-1)"
          :disabled="!props.pdfSrc"
        >
          <template #icon>
            <n-icon><ChevronUp /></n-icon>
          </template>
        </n-button>
        <div class="w-14 flex mx-1">
          <n-input
            ref="inputPageText"
            size="tiny"
            v-model:value="pageNumText"
            placeholder="1"
            @change="pageNumTextHandler"
            :disabled="!props.pdfSrc"
          />
        </div>
        <div class="grid place-items-center mx-1">
          <span> / {{ pages }}</span>
        </div>
        <n-button
          size="small"
          quaternary
          class="mx-1"
          @click="togglePageHandler(1)"
          :disabled="!props.pdfSrc"
        >
          <template #icon>
            <n-icon><ChevronDown /></n-icon>
          </template>
        </n-button>
      </div>
      <div>
        <n-button
          size="small"
          quaternary
          class="mx-1"
          :disabled="!props.pdfSrc"
        >
          <template #icon>
            <n-icon><RemoveOutline /></n-icon>
          </template>
        </n-button>
        <n-button
          size="small"
          quaternary
          class="mx-1"
          :disabled="!props.pdfSrc"
        >
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
        </n-button>
      </div>
    </div>
    <div class="grid place-items-center overflow-hidden h-full">
      <canvas ref="canvas" id="canvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { NInput, NButton, NIcon } from 'naive-ui'
import {
  ChevronUp,
  ChevronDown,
  AddOutline,
  RemoveOutline
} from '@vicons/ionicons5'
import { PDFViewer } from '#imports'

const props = defineProps({
  pdfSrc: String
})
const canvas = ref<HTMLCanvasElement | null>()
const pageNum = ref(1)
const pages = ref(0)
const pageNumText = ref('1')

let pdfViewer: PDFViewer

function togglePageHandler(direction: number) {
  pageNum.value += direction
  if (pageNum.value < 1) {
    pageNum.value = 1
    return
  }
  if (pageNum.value > pdfViewer.pdfDoc!.numPages) {
    pageNum.value = pdfViewer.pdfDoc!.numPages
    return
  }
  pageNumText.value = String(pageNum.value)
  pdfViewer.renderPage(pageNum.value)
}

function setPage(num: number) {
  pageNum.value = num
  pageNumText.value = num.toString()
  pdfViewer.renderPage(num)
}

const inputPageText = ref()
function pageNumTextHandler() {
  const num = Number(pageNumText.value)
  if (!num || num < 1 || num > pdfViewer.pdfDoc!.numPages) {
    pageNumText.value = ''
    return
  }
  pageNum.value = num
  inputPageText.value && inputPageText.value.blur()
  pdfViewer.renderPage(pageNum.value)
}

watch(
  () => props.pdfSrc,
  async (value) => {
    if (!value) return
    const pdfDoc = await pdfViewer.setPdfSrc(value)
    pages.value = pdfDoc ? pdfDoc.numPages : 0
  }
)

onMounted(() => (pdfViewer = new PDFViewer(document.querySelector('#canvas'))))

onUnmounted(() => {
  if (pdfViewer.loadingTask) pdfViewer.destroyLoadingTask()
})

defineExpose({
  setPage
})
</script>
