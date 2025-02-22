import { useStorage } from '@vueuse/core'
import type { ChatModel, EmbeddingModel } from 'openai/resources/index'

export const useLLMConfig = () => {
  const openAIKeyFromStorage = useStorage('askpdf_openai_key', '')
  const chatModelName = useStorage('askpdf_chat_model', 'gpt-4o-mini')
  const embeddingsModelName = useStorage('askpdf_embeddings_model', 'text-embedding-3-small')

  return {
    apiKey: computed({
      get: () => openAIKeyFromStorage.value,
      set: newValue => openAIKeyFromStorage.value = newValue,
    }),
    chatModel: computed({
      get: () => chatModelName.value as ChatModel,
      set: (newValue: ChatModel) => chatModelName.value = newValue,
    }),
    embeddingsModel: computed({
      get: () => embeddingsModelName.value as EmbeddingModel,
      set: (newValue: EmbeddingModel) => embeddingsModelName.value = newValue,
    }),
  }
}
