import { OpenAIEmbeddings } from '@langchain/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { defineStore } from 'pinia'
import type { Document } from '@langchain/core/documents'

type State = {
  store: MemoryVectorStore | null
  apiKey: string
  embeddingsModelName: string
}

export const useVectorManager = defineStore('VectorStore', {
  state: (): State => ({
    store: null,
    apiKey: '',
    embeddingsModelName: '',
  }),

  getters: {
    isInitialized(state) {
      return !!state.store
    },
  },

  actions: {
    // NOTE: MemoryVectorStore https://github.com/langchain-ai/langchainjs/blob/f75e99bee43c03996425ee1a72fde2472e1c2020/langchain/src/vectorstores/memory.ts#L142
    initialize(apiKey: string, model: string) {
      try {
        this.apiKey = apiKey
        this.embeddingsModelName = model
        this.store = new MemoryVectorStore(
          new OpenAIEmbeddings({
            openAIApiKey: this.apiKey,
            modelName: this.embeddingsModelName,
          }),
        )
        console.log('Vector Store initialized!')
      }
      catch (error) {
        console.error('Failed to initialize:', error)
        throw error
      }
    },
    similaritySearch(query: string, k?: number) {
      if (!this.store) return []
      return this.store.similaritySearch(query, k)
    },
    addDocuments(documents: Document<Record<string, string>>[]) {
      return this.store?.addDocuments(documents)
    },
    clear() {
      this.store = null
      this.apiKey = ''
      this.embeddingsModelName = ''
    },

  },
})
