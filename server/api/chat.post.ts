import { convertToCoreMessages, streamText } from 'ai'
import type { Message } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

export default defineEventHandler(async (event) => {
  try {
    const apiKey = event.node.req.headers['x-openai-key']?.toString()
    if (!apiKey) throw new Error('Missing OpenAI API key')

    const { messages, data: { model } } = await readBody<{
      messages: Message[]
      data: { model: string }
    }>(event)
    const openai = createOpenAI({
      apiKey: apiKey,
    })

    const result = await streamText({
      model: openai(model),
      messages: convertToCoreMessages(messages),
      system: 'You are a teacher. ' + 'Return value in markdown format',
    })

    return result.toDataStreamResponse()
  }
  catch (error) {
    console.log({ error })
    return ''
  }
})
