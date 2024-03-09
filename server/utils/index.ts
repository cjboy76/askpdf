import { Pinecone } from '@pinecone-database/pinecone'
import { OpenAIEmbeddings } from '@langchain/openai'
import { PineconeStore } from '@langchain/community/vectorstores/pinecone'
import type { EventHandlerRequest, H3Event } from 'h3'
import OpenAI from 'openai'

export function usePinecone(event: H3Event<EventHandlerRequest>) {
  let _pineconeStore: PineconeStore | null = null
  const apiKey =
    process.env.NUXT_OPENAI_API_KEY ||
    event.node.req.headers['x-openai-key']?.toString() ||
    ''
  if (!_pineconeStore) {
    try {
      const pineconeIndex = useRuntimeConfig().pineconeIndex
      const pc = new Pinecone()
      const pcIndex = pc.Index(pineconeIndex)

      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: apiKey
      })

      _pineconeStore = new PineconeStore(embeddings, { pineconeIndex: pcIndex })
    } catch {
      throw new Error('No database configured for production')
    }
  }

  return _pineconeStore
}

export function useOpenAI(event: H3Event<EventHandlerRequest>) {
  let apiKey =
    process.env.NUXT_OPENAI_API_KEY ||
    event.node.req.headers['x-openai-key']?.toString()
  return new OpenAI({
    apiKey
  })
}
