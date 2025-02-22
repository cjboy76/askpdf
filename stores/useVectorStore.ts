import { OpenAIEmbeddings } from '@langchain/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { defineStore } from 'pinia'
import type { Document } from '@langchain/core/documents'

type State = {
  vectorStore: MemoryVectorStore | null
  apiKey: string
  embeddingsModelName: string
}

export const useVectorStore = defineStore('VectorStore', {
  state: (): State => ({
    vectorStore: null,
    apiKey: '',
    embeddingsModelName: '',
  }),

  getters: {
    isInitialized(state) {
      return !!state.vectorStore
    },
  },

  actions: {
    // NOTE: MemoryVectorStore https://github.com/langchain-ai/langchainjs/blob/f75e99bee43c03996425ee1a72fde2472e1c2020/langchain/src/vectorstores/memory.ts#L142
    initialize(apiKey: string, model: string) {
      try {
        this.apiKey = apiKey
        this.embeddingsModelName = model
        this.vectorStore = new MemoryVectorStore(
          new OpenAIEmbeddings({
            openAIApiKey: this.apiKey,
            modelName: this.embeddingsModelName,
          }),
        )
        console.log('Vector Store 初始化成功')
      }
      catch (error) {
        console.error('初始化失敗:', error)
        throw error // 讓外部處理錯誤
      }
    },
    similaritySearch(query: string, k?: number) {
      if (!this.vectorStore) return []
      return this.vectorStore.similaritySearch(query, k)
    },
    addDocuments(documents: Document<Record<string, string>>[]) {
      return this.vectorStore?.addDocuments(documents)
    },
    clear() {
      this.vectorStore = null
      this.apiKey = ''
      this.embeddingsModelName = ''
    },

  },
})
