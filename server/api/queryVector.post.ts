import { usePinecone } from '../utils'

export default defineEventHandler(async (event) => {
  const { input } = await readBody<{ input: string }>(event)
  const results = await usePinecone(event).similaritySearch(input, 5)

  return results
})
