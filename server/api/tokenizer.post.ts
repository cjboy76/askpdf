import { encode } from 'gpt-3-encoder'

export default defineEventHandler(async (event) => {
    const { data } = await readBody<{ data: string }>(event)
    const encoded = encode(data)
    return encoded.length
})