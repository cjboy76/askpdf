import OpenAI from 'openai'

export default defineLazyEventHandler(() => {
  const apiKey = useRuntimeConfig().openaiApiKey
  if (!apiKey) throw new Error('Missing OpenAI API key')
  const openai = new OpenAI({
    apiKey: apiKey
  })

  return defineEventHandler(async (event) => {
    const text = await readBody<string>(event)
    const response = await openai.embeddings.create({
      input: text,
      model: 'text-embedding-ada-002'
    })

    return response
  })
})
