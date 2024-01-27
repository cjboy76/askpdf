<template>
  <div class="overflow-hidden">
    <div class="flex justify-center items-center py-1">
      <div class="flex justify-center items-center">
        <n-button size="small" quaternary class="mx-1">Up</n-button>
        <div class="w-14 flex mx-1">
          <n-input type="text" size="tiny" />
        </div>
        <div class="grid place-items-center mx-1">
          <span> / 20</span>
        </div>
        <n-button size="small" quaternary class="mx-1">Down</n-button>
      </div>
    </div>
    <div class="grid place-items-center overflow-hidden">
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
let pageNum = 3

const renderPage = async (num: number) => {
  pdfDoc.getPage(num).then((page) => {
    const viewport = page.getViewport({ scale: 1 })
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

const loadPdf = async () => {
  const PDFJSLib = await import('pdfjs-dist')

  PDFJSLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  loadingTask = PDFJSLib.getDocument({ url: props.pdfSrc })
  loadingTask.promise.then((pdfDoc_) => {
    pdfDoc = pdfDoc_
    renderPage(pageNum)
  })
}

// onMounted(() => loadPdf())

onUnmounted(() => {
  if (loadingTask) loadingTask.destroy()
})
</script>
