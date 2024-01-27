<template>
  <div class="overflow-hidden h-full">
    <div class="flex justify-center items-center py-1 bg-white">
      <div class="flex justify-center items-center">
        <n-button
          size="small"
          quaternary
          class="mx-1"
          @click="togglePageHandler(-1)"
          >Up</n-button
        >
        <div class="w-14 flex mx-1">
          <n-input
            ref="inputPageText"
            size="tiny"
            v-model:value="pageNumText"
            @change="pageNumTextHandler"
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
          >Down</n-button
        >
      </div>
    </div>
    <div class="grid place-items-center overflow-hidden h-full">
      <client-only>
        <canvas ref="canvas"></canvas>
      </client-only>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist'
import { ref, onMounted, onUnmounted } from 'vue'
import { NInput, NButton } from 'naive-ui'

const props = defineProps({
  pdfSrc: String
})
const canvas = ref<HTMLCanvasElement | null>()
let loadingTask: PDFDocumentLoadingTask
let pdfDoc: PDFDocumentProxy
const pageNum = ref(1)
const pages = ref(0)
const pageNumText = ref('1')

async function renderPage(number: number) {
  if (!pdfDoc) return
  pdfDoc.getPage(number).then((page) => {
    const viewport = page.getViewport({ scale: 0.8 })
    const context = canvas.value!.getContext('2d')

    let resolution = 2 // for example

    canvas.value!.height = resolution * viewport.height //actual size
    canvas.value!.width = resolution * viewport.width

    canvas.value!.style.height = viewport.height + 'px' //showing size will be smaller size
    canvas.value!.style.width = viewport.width + 'px'

    // Prepare object needed by render method
    var renderContext = {
      canvasContext: context!,
      viewport: viewport,
      transform: [resolution, 0, 0, resolution, 0, 0] // force it bigger size
    }

    // Render PDF page
    page.render(renderContext)
  })
}

async function loadPdf() {
  const PDFJSLib = await import('pdfjs-dist')

  PDFJSLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  loadingTask = PDFJSLib.getDocument({ url: props.pdfSrc })
  loadingTask.promise.then((pdfDoc_) => {
    pdfDoc = pdfDoc_
    pages.value = pdfDoc.numPages
    renderPage(pageNum.value)
  })
}

function togglePageHandler(direction: number) {
  pageNum.value += direction
  if (pageNum.value < 1) {
    pageNum.value = 1
    return
  }
  if (pageNum.value > pdfDoc.numPages) {
    pageNum.value = pdfDoc.numPages
    return
  }
  pageNumText.value = String(pageNum.value)
  renderPage(pageNum.value)
}

const inputPageText = ref()
function pageNumTextHandler() {
  pageNum.value = Number(pageNumText.value)
  inputPageText.value && inputPageText.value.blur()
  renderPage(pageNum.value)
}

onMounted(() => loadPdf())

onUnmounted(() => {
  if (loadingTask) loadingTask.destroy()
})
</script>
