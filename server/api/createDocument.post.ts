import { TextEmbedding } from '../models/TextEmbedding'
import { Schema } from 'mongoose'

const url = 'https://api.openai.com/v1/embeddings'

type EmbeddingObject = {
  object: string
  embedding: number[]
  index: number
}

type EmbeddingsResponse = {
  object: string
  data: EmbeddingObject[]
  model: 'text-embedding-ada-002-v2'
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

export default defineEventHandler(async (event) => {
  const openai_key = useRuntimeConfig().openaiApiKey
  const { data, document_id } = await readBody<{
    data: { page: number; textContent: string }[]
    document_id: Schema.Types.ObjectId
  }>(event)
  const allTextContent = data.reduce((a, b) => {
    const subPageText = b.textContent
      .split('。')
      .map((t) => ({ text: t, page: b.page }))
    return [...a, ...subPageText]
  }, [] as { text: string; page: number }[])

  const textEmbeddingPromises = allTextContent.map(({ text, page }) => {
    return new Promise((resolve, reject) => {
      $fetch<EmbeddingsResponse>(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openai_key}`,
          'Content-Type': 'application/json'
        },
        body: {
          input: text,
          model: 'text-embedding-ada-002'
        }
      })
        .then((responseData) => {
          resolve({
            text,
            page,
            text_embedding: responseData.data[0].embedding,
            document_id
          })
        })
        .catch(reject)
    })
  })
  const textEmbeddingData = await Promise.all(textEmbeddingPromises)
  const r = await TextEmbedding.insertMany(textEmbeddingData)

  return r
})
