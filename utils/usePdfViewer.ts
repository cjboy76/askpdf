import pdfjsLib, { getDocument, type PDFDocumentProxy } from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://unpkg.com/pdfjs-dist/build/pdf.worker.min.mjs'

export default async function () {
  //
  const CMAP_URL = 'pdfjs-dist/cmaps/'
  const CMAP_PACKED = true
  const SEARCH_FOR = '' // try "Mozilla";

  const container = document.getElementById('viewerContainer')

  const canvas = ref(null)
  let loadingTask = null

  let pdfDoc: PDFDocumentProxy
  let pageNum = 1

  const renderPage = async (num: number) => {
      pdfDoc.getPage(pageNum).then((pages) => {
        const page = pages[num - 1]
        const viewport = page.getViewport({ scale })
        const context = canvas.value.getContext('2d')
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }
        page.render(renderContext)
      })
    }
  }

  return {
    render: async (url: string) => {
      // Loading document.
      const loadingTask = getDocument({
        url,
        cMapUrl: CMAP_URL,
        cMapPacked: CMAP_PACKED
      })

      loadingTask.promise.then((pdfDoc_) => {
        pdfDoc = pdfDoc_
        renderPage(pageNum)
      })
    },
    search: (query: string) => {
      eventBus.dispatch('find', { type: '', query })
    }
  }
}
