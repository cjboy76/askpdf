import { Pinecone } from '@pinecone-database/pinecone'
import { OpenAIEmbeddings } from '@langchain/openai'
import { PineconeStore } from 'langchain/vectorstores/pinecone'

let _pineconeStore: PineconeStore | null = null

export function usePinecone() {
  if (!_pineconeStore) {
    try {
      const openaiApiKey = useRuntimeConfig().openaiApiKey
      const pineconeIndex = useRuntimeConfig().pineconeIndex
      const pc = new Pinecone()
      const pcIndex = pc.Index(pineconeIndex)

      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: openaiApiKey
      })

      _pineconeStore = new PineconeStore(embeddings, { pineconeIndex: pcIndex })
    } catch {
      throw new Error('No database configured for production')
    }
  }

  return _pineconeStore
}
