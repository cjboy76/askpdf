import { CharacterTextSplitter } from 'langchain/text_splitter'
import type { Document } from '@langchain/core/documents'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { OpenAIEmbeddings } from '@langchain/openai'

type OpenAIEmbeddingsConfig = {
  openAIApiKey: string
  modelName: string
}

export function createMemoryVectorStore(config: OpenAIEmbeddingsConfig) {
  const { openAIApiKey = '', modelName = 'gpt-4o' } = config
  return new MemoryVectorStore(
    new OpenAIEmbeddings({
      openAIApiKey,
      modelName,
    }),
  )
}

const splitter = new CharacterTextSplitter({
  chunkSize: 600,
  chunkOverlap: 15,
})

export async function createDocuments(data: PageContent[]) {
  const docPromise = data.map((d) => {
    return new Promise<Document<Record<string, string>>[]>((resolve) => {
      const fragments = splitter.createDocuments([d.textContent]).then((fragments) => {
        fragments.forEach((f) => {
          f.metadata.page = d.page
        })
        return fragments
      })
      resolve(fragments)
    })
  })

  const documents = (await Promise.all(docPromise)).reduce(
    (prev, promiseDocument) => {
      return [...prev, ...promiseDocument]
    },
    [],
  )
  return documents
}
