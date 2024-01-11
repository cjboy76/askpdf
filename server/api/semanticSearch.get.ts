import { TextEmbedding } from '../models/TextEmbedding'

export default defineEventHandler(async (event) => {
  const queryVector = await readBody<number[]>(event)

  const documents = await TextEmbedding.aggregate([
    {
      $vectorSearch: {
        queryVector,
        path: 'text_embedding',
        numCandidates: 25,
        limit: 5,
        index: 'moviesPlotIndex'
      }
    }
  ])

  return documents
})
