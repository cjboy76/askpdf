import { Schema } from 'mongoose'
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";

type CreateDocumentBody = {
  data: { page: number; textContent: string }[]
  document_id: Schema.Types.ObjectId
  userSub: string
}

export default defineLazyEventHandler(async () => {
  const apiKey = useRuntimeConfig().openaiApiKey
  if (!apiKey) throw new Error('Missing OpenAI API key')

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: apiKey
  });
  const vectorStore = new Chroma(embeddings, {
    collectionName: "textEmbStore",
  });

  return defineEventHandler(async (event) => {
    const { data, document_id, userSub } = await readBody<CreateDocumentBody>(event)

    await vectorStore.delete({ filter: { userSub } })

    const documents = data.reduce((a, b) => {
      const subPageText = b.textContent
        .split('。')
        .map((t) => ({ pageContent: t, metadata: { page: b.page, docId: document_id, userSub } }))
      return [...a, ...subPageText]
    }, [] as { pageContent: string; metadata: Record<string, any> }[]).filter(item => Boolean(item.pageContent))

    const ids = await vectorStore.addDocuments(documents);
    const response = await vectorStore.similaritySearch("正面", 5);

    console.log(response);

    return { ids, vectorStore }
  })
})
