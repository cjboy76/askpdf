import { getDocument, PDFDocumentProxy } from "pdfjs-dist";

export default defineEventHandler(async (event) => {
    const { source } = await readBody<{ source: string | File }>(event)
    const payload = await formatSource(source)

    const pdfDocument = await loadPdf(payload)

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

async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                resolve(reader.result);
            } else {
                reject(new Error("Failed to read file as ArrayBuffer"));
            }
        };

        reader.onerror = () => {
            reject(new Error("Error reading file"));
        };

        reader.readAsArrayBuffer(file);
    });
}

function formatSource(source: string | File): Promise<string | ArrayBuffer> {
    return new Promise((resolve) => {
        if (source instanceof File) {
            fileToArrayBuffer(source).then(response => resolve(response))
        } else {
            resolve(source)
        }
    })
}
