import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { useOpenAI } from '../utils'

export default defineEventHandler(async (event) => {
  const { messages, data } = await readBody<{
    messages: ChatCompletionMessageParam[],
    data: { model: string }
  }>(event)
  console.log({data})
  const openai = useOpenAI(event)
  const slicedMessages = messages.slice(-10)
  const response = await openai.chat.completions.create({
    model: data.model,
    messages: slicedMessages,
    stream: true
  })

  return new StreamingTextResponse(OpenAIStream(response))
})
