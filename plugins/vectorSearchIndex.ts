export default defineNuxtPlugin(async () => {
  const { groupId, clusterName } = useRuntimeConfig()
  const url = `https://cloud.mongodb.com/api/atlas/v2/groups/${groupId}/clusters/${clusterName}/fts/indexes`

  const vectorSearchIndex = await $fetch(url, {
    method: 'POST',
    body: {
      collectionName: 'textembeddings',
      database: 'test',
      name: 'vectorSearchIndex',
      type: 'vectorSearch',
      fields: [
        {
          type: 'vector',
          path: 'text_embedding',
          numDimensions: 1536,
          similarity: 'cosine'
        }
      ]
    }
  })

  return {
    provide: {
      vectorSearchIndex: () => vectorSearchIndex
    }
  }
})
