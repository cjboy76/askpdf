import { usePinecone } from '../utils/pinecone'

export default defineEventHandler(async (event) => {
  const input = await readBody<string>(event)
  const results = await usePinecone().similaritySearch(input, 5)

  return results
})
