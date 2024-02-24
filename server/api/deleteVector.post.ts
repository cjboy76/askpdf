import { usePinecone } from '../utils'

export default defineEventHandler(async (event) => {
  const { ids } = await readBody<{ ids: string[] }>(event)
  try {
    const result = await usePinecone(event).delete({ ids })
    return result
  } catch (error: unknown) {
    console.log(error)
  }
})
