import { getDocument } from "pdfjs-dist";

async function loadPdf(url: string) {
    const loadingTask = getDocument(url);
    return loadingTask.promise.then((pdfDocument) => pdfDocument);
}

export default defineEventHandler(async (event) => {
    const query = getQuery<{ url: string }>(event)

    const pdfDocument = await loadPdf(query.url)

    const page = await pdfDocument.getPage(1)
    const textContent = await page.getTextContent()
    console.log(textContent)

    return {
        pages: 10
    }
})
