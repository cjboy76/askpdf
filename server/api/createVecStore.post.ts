import { Schema } from 'mongoose'
import { Document } from 'langchain/document'
import { usePinecone } from '../utils/pinecone'

type CreateDocumentBody = {
  data: { page: number; textContent: string }[]
  document_id: Schema.Types.ObjectId
  userSub: string
}

export default defineEventHandler(async (event) => {
  const { data, document_id, userSub } = await readBody<CreateDocumentBody>(
    event
  )

  const docs = data
    .reduce((a, b) => {
      const subPageText = b.textContent.split('。').map(
        (t) =>
          new Document({
            pageContent: t,
            metadata: { page: b.page, docId: document_id, userSub }
          })
      )
      return [...a, ...subPageText]
    }, [] as { pageContent: string; metadata: Record<string, any> }[])
    .filter((item) => Boolean(item.pageContent))

  const ids = await usePinecone().addDocuments(docs)

  return ids
})
