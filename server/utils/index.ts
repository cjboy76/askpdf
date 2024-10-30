import type { EventHandlerRequest, H3Event } from 'h3'
import OpenAI from 'openai'

export function useOpenAI(event: H3Event<EventHandlerRequest>) {
  const apiKey = event.node.req.headers['x-openai-key']?.toString()
  if (!apiKey) throw new Error('Missing OpenAI API key')
  return new OpenAI({
    apiKey,
  })
}
