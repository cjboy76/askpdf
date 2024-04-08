import { Document } from '@langchain/core/documents'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

type CreateDocumentBody = {
  data: { page: number; textContent: string }[]
  pdf_name: string
  user_sub: string
}
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 300,
  chunkOverlap: 15
})

export default defineEventHandler(async (event) => {
  try {
    const { data } = await readBody<CreateDocumentBody>(event)

    const docPromise = data.map((d) => {
      return new Promise<Document<Record<string, any>>[]>(async (resolve) => {
        const fragments = await splitter.createDocuments([d.textContent])
        fragments.forEach((f) => {
          f.metadata.page = d.page
        })
        resolve(fragments)
      })
    })

    const documents = (await Promise.all(docPromise)).reduce(
      (prev, promiseDocument) => {
        return [...prev, ...promiseDocument]
      },
      []
    )
    return documents
  } catch (error) {
    throw createError((error as any).message)
  }
})
