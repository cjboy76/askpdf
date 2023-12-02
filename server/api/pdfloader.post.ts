import { getDocument, PDFDocumentProxy } from "pdfjs-dist";

export default defineEventHandler(async (event) => {
    const body = await readFormData(event)
    const file = body.get('file') as File
    if (!file || !file.type || !file.size) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid file',
        })
    }

    const unitArray = await fileToUint8Array(file)

    const pdfDocument = await loadPdf(unitArray)

    const data = await extractPdfContent(pdfDocument)

    return {
        data
    }
})

async function loadPdf(url: string | ArrayBuffer) {
    const loadingTask = getDocument(url);
    return loadingTask.promise.then((pdfDocument) => pdfDocument);
}

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

async function fileToUint8Array(file: File) {
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    return uint8Array;
}