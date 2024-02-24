import { Document } from '@langchain/core/documents'
import { usePinecone } from '../utils'

type CreateDocumentBody = {
  data: { page: number; textContent: string }[]
  pdf_name: string
  user_sub: string
}

export default defineEventHandler(async (event) => {
  try {
    const { data, pdf_name, user_sub } = await readBody<CreateDocumentBody>(
      event
    )

    const docs = data
      .reduce((a, b) => {
        const subPageText = b.textContent.split('.').map(
          (t) =>
            new Document({
              pageContent: t,
              metadata: { page: b.page, user_sub, pdf_name }
            })
        )
        return [...a, ...subPageText]
      }, [] as { pageContent: string; metadata: Record<string, any> }[])
      .filter((item) => Boolean(item.pageContent))

    const ids = await usePinecone(event).addDocuments(docs)

    return ids
  } catch (error) {
    throw createError({
      statusCode: (error as any).status,
      statusMessage: (error as any).error.message
    })
  }
})
