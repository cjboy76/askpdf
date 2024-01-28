import { usePinecone } from '../utils'

export default defineEventHandler(async (event) => {
  const { ids } = await readBody<{ ids: string[] }>(event)
  try {
    const result = await usePinecone(event).delete(ids)
    return result
  } catch (error: unknown) {
    throw createError({
      statusCode: (error as any).status,
      statusMessage: (error as any).error.message
    })
  }
})
