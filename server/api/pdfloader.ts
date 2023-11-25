import { PDFPageProxy, getDocument, PDFDocumentProxy } from "pdfjs-dist";

async function loadPdf(url: string) {
    const loadingTask = getDocument(url);
    return loadingTask.promise.then((pdfDocument) => pdfDocument);
}

export default defineEventHandler(async (event) => {
    const query = getQuery<{ url: string }>(event)

    const pdfDocument = await loadPdf(query.url)

    const text = await extractPdfContent(pdfDocument)

    return {
        text
    }
})

function getPageContent(pdfDocument: PDFDocumentProxy, page: number) {
    return new Promise((resolve) => {
        pdfDocument.getPage(page)
            .then(pageDocument => pageDocument.getTextContent())
            .then(pageContent => {
                const { items } = pageContent
                let textContent = ''
                for (const item of items) {
                    if ('str' in item) textContent += item.str
                }
                resolve(textContent)
            })
    })
}

async function extractPdfContent(pdfDocument: PDFDocumentProxy) {
    const pool = Array.from({ length: pdfDocument.numPages }, (_, index) => {
        return getPageContent(pdfDocument, index + 1)
    })
    const pdfContent = await Promise.all(pool)
    return pdfContent.join('')
}
