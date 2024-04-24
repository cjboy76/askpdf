import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = '//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js'

export default defineEventHandler(async (event) => {
  const body = await readFormData(event)
  const file = body.get('file') as File
  if (!file || !file.type || !file.size) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid file'
    })
  }
  const unitArray = await fileToUint8Array(file)
  const pdfDocument = await loadPdf(unitArray)
  const data = await extractPdfContent(pdfDocument)
  const raw = data.reduce((prev, curr) => prev + curr.textContent, '')

  return {
    data,
    raw,
    name: file.name
  }
})

async function loadPdf(url: string | ArrayBuffer) {
  // Issue: https://github.com/dictadata/pdf-data-parser/issues/1#issuecomment-2065503342
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");     
  const loadingTask = getDocument(url)
  return loadingTask.promise.then((pdfDocument) => pdfDocument)
}

function getPageContent(
  pdfDocument: pdfjsLib.PDFDocumentProxy,
  page: number
): Promise<PageContent> {
  return new Promise((resolve) => {
    pdfDocument
      .getPage(page)
      .then((pageDocument) => pageDocument.getTextContent())
      .then((pageContent) => {
        const { items } = pageContent
        let textContent = ''
        for (const item of items) {
          if ('str' in item) textContent += item.str
        }
        resolve({ textContent, page })
      })
  })
}

function extractPdfContent(pdfDocument: pdfjsLib.PDFDocumentProxy) {
  const pool = Array.from({ length: pdfDocument.numPages }, (_, index) => {
    return getPageContent(pdfDocument, index + 1)
  })
  return Promise.all(pool)
}

async function fileToUint8Array(file: File) {
  const buffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(buffer)

  return uint8Array
}
