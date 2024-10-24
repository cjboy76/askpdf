import { Document } from '@langchain/core/documents'
import { OpenAIEmbeddings } from '@langchain/openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { MemoryVectorStore } from "langchain/vectorstores/memory";

type OpenAIEmbeddingsConfig = {
  openAIApiKey: string,
  modelName: string
}


export function createMemoryVectorStore(config: OpenAIEmbeddingsConfig) {
  const { openAIApiKey = '', modelName = 'gpt-4o' } = config
  return new MemoryVectorStore(
    new OpenAIEmbeddings({
      openAIApiKey,
      modelName
    })
  )
}

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 300,
  chunkOverlap: 15
})

export async function createDocuments(data: PageContent[]) {
  const docPromise = data.map((d) => {
    return new Promise<Document<Record<string, any>>[]>(async (resolve) => {
      const fragments = await splitter.createDocuments([d.textContent])
      fragments.forEach((f) => {
        f.metadata.page = d.page
      })
      resolve(fragments)
    })
  })

  const documents = (await Promise.all(docPromise)).reduce(
    (prev, promiseDocument) => {
      return [...prev, ...promiseDocument]
    },
    []
  )
  return documents
}
