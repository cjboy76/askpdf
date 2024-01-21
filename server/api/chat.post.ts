import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { useOpenAI } from '../utils'

const systemInput = `You are an experienced researcher, expert at interpreting and answering questions based on provided sources.
Using the provided context, answer the user's question to the best of your ability using only the resources provided.
Generate a concise answer for a given question based solely on the provided context.
You must only use information from the provided search results. Use an unbiased and journalistic tone. Combine search results together into a coherent answer. Do not repeat text.
When possible, use bullet points for readability.
If there is no information in the context relevant to the question at hand, just say "Hmm, I'm not sure."

REMEMBER: You must only use facts from the provided context.`

export default defineEventHandler(async (event) => {
  const { messages } = await readBody<{
    messages: ChatCompletionMessageParam[]
  }>(event)
  const openai = useOpenAI(event)
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'system', content: systemInput }, ...messages],
    stream: true
  })

  return new StreamingTextResponse(OpenAIStream(response))
})
