import { usePinecone } from '../utils'

export default defineEventHandler(async (event) => {
  const { input } = await readBody<{ input: string }>(event)
  try {
    const results = await usePinecone(event).similaritySearch(input, 5)
    return results
  } catch (error: unknown) {
    throw createError({
      statusCode: (error as any).status,
      statusMessage: (error as any).error.message
    })
  }
})
