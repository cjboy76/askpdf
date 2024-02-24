import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist'

export class PDFViewer {
  private pdfSrc: string
  public pdfDoc: PDFDocumentProxy | null
  public loadingTask: PDFDocumentLoadingTask | null
  public canvas: HTMLCanvasElement | null

  constructor(canvas: HTMLCanvasElement | null) {
    this.pdfSrc = ''
    this.loadingTask = null
    this.pdfDoc = null
    this.canvas = canvas ? canvas : document.querySelector('canvas')
  }

  async renderPage(number: number) {
    if (!this.pdfDoc) return
    this.pdfDoc.getPage(number).then((page) => {
      const viewport = page.getViewport({ scale: 0.8 })
      const context = this.canvas!.getContext('2d')

      let resolution = 2 // for example

      this.canvas!.height = resolution * viewport.height //actual size
      this.canvas!.width = resolution * viewport.width

      this.canvas!.style.height = viewport.height + 'px' //showing size will be smaller size
      this.canvas!.style.width = viewport.width + 'px'

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

  async loadPdf() {
    try {
      const PDFJSLib = await import('pdfjs-dist')

      PDFJSLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString()

      this.loadingTask = PDFJSLib.getDocument({ url: this.pdfSrc })
      const _pdfDoc = await this.loadingTask.promise
      this.pdfDoc = _pdfDoc
      this.renderPage(1)
    } finally {
      return this.pdfDoc
    }
  }

  setPdfSrc(value: string) {
    this.pdfSrc = value
    return this.loadPdf()
  }

  destroyLoadingTask() {
    if (this.loadingTask) this.loadingTask.destroy()
  }
}
