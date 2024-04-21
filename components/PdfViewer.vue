<template>
  <div class="overflow-hidden h-full">
    <div class="flex justify-between items-center py-1 bg-zinc-800 h-8">
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
    <div id="main-container" class="absolute w-full h-[calc(100vh-32px)] grid place-items-center bg-zinc-700">
        <div id="viewer-container" class="grid place-items-center"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NInput, NButton, NIcon } from 'naive-ui'
import {
  ChevronUp,
  ChevronDown,
  AddOutline,
  RemoveOutline
} from '@vicons/ionicons5'
import { CustomPDFViewer } from '#imports'

const props = defineProps({
  pdfSrc: String
})
const pageNum = ref(1)
const pages = ref(0)
const pageNumText = ref('1')

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
  pageNumText.value = String(pageNum.value)
  console.log("togglePageHandler", pageNum.value)
  pdfViewer.setPage(pageNum.value)
}

function setPage(num: number) {
  pageNum.value = num
  pageNumText.value = num.toString()
  pdfViewer.setPage(num)
}

const inputPageText = ref()
function pageNumTextHandler() {
  console.log("triggger")
  const num = Number(pageNumText.value)
  if (!num || num < 1 || num > pdfViewer.numPage()) {
    pageNumText.value = ''
    return
  }
  pageNum.value = num
  inputPageText.value && inputPageText.value.blur()
  console.log("first ", pageNum.value)
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
  setPage
})
</script>
