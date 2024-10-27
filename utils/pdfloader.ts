import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString()

export async function usePDFLoader(file: File) {
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
}

async function loadPdf(url: string | ArrayBuffer) {
  const loadingTask = getDocument(url)
  return loadingTask.promise.then((pdfDocument) => pdfDocument)
}

function getPageContent(
    pdfDocument: PDFDocumentProxy,
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
  
  function extractPdfContent(pdfDocument: PDFDocumentProxy) {
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