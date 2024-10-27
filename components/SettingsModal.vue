<script setup lang="ts">
import type { ChatModel, EmbeddingModel } from 'openai/resources/index.mjs';

type State = {
    embeddingModel: EmbeddingModel,
    chatModel: ChatModel,
    apiKey: string
}

const { t } = useI18n()
const props = defineProps<State>()
const emit = defineEmits<{
    clearData: [],
    deleteConversation: []
    close: [value: State]
}>()
const model = defineModel<boolean>({ default: false })
const state = reactive({ ...structuredClone(toRaw(props)) })

function onClose() {
    model.value = false
    emit('close', toRaw(state))
}
</script>
<template>
    <UModal v-model="model" prevent-close>
        <UCard>
            <template #header>
                <h3>{{ t('settings') }}</h3>
            </template>
            <div class="mb-4">
                <h5 class="text-black text-opacity-50 mb-1 dark:text-white dark:text-opacity-50">Embedding models</h5>
                <USelect
v-model="state.embeddingModel"
                    :options="['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002']" />

            </div>
            <div class="mb-4">
                <h5 class="text-black text-opacity-50 mb-1 dark:text-white dark:text-opacity-50">Chat models</h5>
                <USelect
v-model="state.chatModel"
                    :options="['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']" />

            </div>
            <div class="mb-4">
                <h5 class="text-black text-opacity-50 mb-1 dark:text-white dark:text-opacity-50">OpenAI API Key

                </h5>
                <UInput v-model="state.apiKey" placeholder="API Key" />
                <div class="flex justify-end">
                    <a
class="text-sm text-white text-opacity-50 mt-2 hover:underline text-right" target="_blank"
                        href="https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key"> {{
                            t('open-ai-key-message') + '?' }}</a>
                </div>
            </div>
            <UDivider class="my-4"/>
            <div class="flex justify-between items-center">
                <div><h5><strong>{{t('delete-conversation')}}</strong></h5>
                </div>
                <UButton color="red" @click="emit('deleteConversation')">
                    {{ t('delete') }}
                </UButton>
            </div>
            <UDivider class="my-4"/>
            <div class="flex justify-between items-center">
                <div><h5><strong>{{t('clear-data')}}</strong></h5>
                <p class="text-xs">
                    {{ t('clear-data-message') }}
                </p>
                </div>
                <UButton color="red" @click="emit('clearData')">
                    {{ t('clear-data') }}
                </UButton>
            </div>
            <template #footer>
                <div class="flex justify-end">
                    <UButton @click="onClose">
                        {{
                            t('close')
                        }}</UButton>
                </div>
            </template>
        </UCard>
    </UModal>
</template>