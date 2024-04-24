import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString()

export class CustomPDFViewer {
  private pdfSrc: string | undefined
  private PDFViewer!: PDFViewer
  private PDFDocument: pdfjs.PDFDocumentProxy | null

  constructor() {
    this.pdfSrc = ''
    this.PDFDocument = null
    this.setupinstance()
  }

  async setPdf(src: string) {
    if (this.PDFViewer) this.PDFViewer._resetView()
    this.pdfSrc = src
    const PDFDocument = await pdfjs.getDocument(this.pdfSrc).promise.then((PDFDocument) => PDFDocument)
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
    const { EventBus, PDFSinglePageViewer } = await import('pdfjs-dist/legacy/web/pdf_viewer.mjs');
    const eventBus = new EventBus()
    this.PDFViewer = new PDFSinglePageViewer({
      container: document.querySelector<HTMLDivElement>('#main-container')!,
      viewer: document.querySelector<HTMLDivElement>('#viewer-container')!,
      eventBus,
      textLayerMode: 0,
      annotationMode: 0
    })
    eventBus.on("pagesinit",  () =>  {
      this.PDFViewer.currentScaleValue = "page-fit";
    });
  }
}
