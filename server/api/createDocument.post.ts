import { TextEmbedding } from '../models/TextEmbedding'
import { Schema } from 'mongoose'
import OpenAI from 'openai'

type CreateDocumentBody = {
  data: { page: number; textContent: string }[]
  document_id: Schema.Types.ObjectId
}

export default defineLazyEventHandler(() => {
  const apiKey = useRuntimeConfig().openaiApiKey
  if (!apiKey) throw new Error('Missing OpenAI API key')
  const openai = new OpenAI({
    apiKey: apiKey
  })

  return defineEventHandler(async (event) => {
    const { data, document_id } = await readBody<CreateDocumentBody>(event)

    const allTextContent = data.reduce((a, b) => {
      const subPageText = b.textContent
        .split('。')
        .map((t) => ({ text: t, page: b.page }))
      return [...a, ...subPageText]
    }, [] as { text: string; page: number }[])

    const textEmbeddingPromises = allTextContent.map(({ text, page }) => {
      return new Promise(async (resolve) => {
        openai.embeddings
          .create({
            input: text,
            model: 'text-embedding-ada-002'
          })
          .then((res) => {
            resolve({
              text,
              page,
              text_embedding: res.data[0].embedding,
              document_id
            })
          })
      })
    })
    const textEmbeddingData = await Promise.all(textEmbeddingPromises)
    const r = await TextEmbedding.insertMany(textEmbeddingData)

    return r
  })
})
