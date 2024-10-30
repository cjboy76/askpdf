// import { EventBus, PDFSinglePageViewer } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs'
import { GlobalWorkerOptions, type PDFDocumentProxy, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer';

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString()

export class CustomPDFViewer {
  private pdfSrc: string | undefined
  private PDFViewer!: PDFViewer
  private PDFDocument: PDFDocumentProxy | null

  constructor() {
    this.pdfSrc = ''
    this.PDFDocument = null
  }

  async setPdf(src: string) {
    if (!this.PDFViewer) await this.setupinstance()
    this.pdfSrc = src
    const PDFDocument = await getDocument(this.pdfSrc).promise
    this.PDFViewer.setDocument(PDFDocument)
    this.PDFDocument = PDFDocument
    return PDFDocument
  }

  setPage(pageNumber: number) {
    this.PDFViewer.currentPageNumber = pageNumber
  }

  numPage() {
    return this.PDFViewer.currentPageNumber || 0
  }

  numPages() {
    return this.PDFDocument ? this.PDFDocument.numPages : 0
  }

  async setupinstance() {
    // NOTE: https://github.com/mozilla/pdf.js/issues/17228#issuecomment-1804825465
    const { EventBus, PDFSinglePageViewer } = await import('pdfjs-dist/legacy/web/pdf_viewer.mjs')
    const eventBus = new EventBus()
    this.PDFViewer = new PDFSinglePageViewer({
      container: document.querySelector<HTMLDivElement>('#viewer-container')!,
      viewer: document.querySelector<HTMLDivElement>('#viewer')!,
      eventBus,
      textLayerMode: 0,
      annotationMode: 0,
    })
    eventBus.on("pagesinit",  () =>  {
      console.log("pagesinit")
      this.PDFViewer.currentScaleValue = "page-fit";
    });
  }
}
