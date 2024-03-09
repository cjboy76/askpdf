import { Pinecone } from '@pinecone-database/pinecone'
import { OpenAIEmbeddings } from '@langchain/openai'
import { PineconeStore } from '@langchain/community/vectorstores/pinecone'
import type { EventHandlerRequest, H3Event } from 'h3'
import OpenAI from 'openai'

export function usePinecone(event: H3Event<EventHandlerRequest>) {
  const apiKey =
    process.env.NUXT_OPENAI_API_KEY ||
    event.node.req.headers['x-openai-key']?.toString() ||
    ''
  try {
    const pineconeIndex = useRuntimeConfig().pineconeIndex
    const pc = new Pinecone()
    const pcIndex = pc.Index(pineconeIndex)

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey
    })

    return new PineconeStore(embeddings, { pineconeIndex: pcIndex })
  } catch {
    throw new Error('No database configured for production')
  }
}

export function useOpenAI(event: H3Event<EventHandlerRequest>) {
  let apiKey =
    process.env.NUXT_OPENAI_API_KEY ||
    event.node.req.headers['x-openai-key']?.toString()
  return new OpenAI({
    apiKey
  })
}
