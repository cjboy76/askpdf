import { usePinecone } from '../utils'

export default defineEventHandler(async (event) => {
  const { input } = await readBody<{ input: string }>(event)
  try {
    const results = await usePinecone(event).similaritySearch(input, 5)
    return results
  } catch (error) {
    throw createError({
      statusCode: error.status,
      statusMessage: error.error.message
    })
  }
})
