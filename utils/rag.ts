import { CharacterTextSplitter } from 'langchain/text_splitter'
import type { Document } from '@langchain/core/documents'
import type { MemoryVectorStore } from 'langchain/vectorstores/memory'

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

export function processSimilarityDocs(docs: Awaited<ReturnType<MemoryVectorStore['similaritySearch']>>) {
  const sortedDocumentPages = docs
    .sort((a, b) => a.metadata.page - b.metadata.page)
    .map(p => p.metadata.page)
  const relatedPages = [...new Set(sortedDocumentPages)]
  const systemPrompt = docs.map(s => s.pageContent).join('')

  return {
    relatedPages,
    systemPrompt,
  }
}
