<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import type { ChatModel, EmbeddingModel } from 'openai/resources/index.mjs';
import { STATE_KEY } from '~/share';

const chatModelOptions: ChatModel[] = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
const embeddingModelOptions: EmbeddingModel[] = ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002']

const { t } = useI18n()
const emit = defineEmits<{
    clearData: [value: void]
    onClose: [value: {
        embeddingModel: string
        chatModel: string
        storageOpenAIKey: string
    }]
}>()
const model = defineModel({ default: false })
const seletedEmbeddingModel = defineModel('seletedEmbeddingModel', { default: 'text-embedding-3-small'})
const selectedChatModel = defineModel('selectedChatModel', { default: 'gpt-4o-mini'})

const storageOpenAIKey = useStorage('openai_key', '')
const isClearDataConfirmModalOpen = useState(STATE_KEY.TOGGLE_CLEAR_DATA_MODAL, () => false)

function onClearData() {
    emit('clearData')
}

function onClose() {
    model.value = false
    emit('onClose', {
        embeddingModel: seletedEmbeddingModel.value,
        chatModel: selectedChatModel.value,
        storageOpenAIKey: storageOpenAIKey.value
    })
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
                <USelect v-model="seletedEmbeddingModel" :options="embeddingModelOptions" />

            </div>
            <div class="mb-4">
                <h5 class="text-black text-opacity-50 mb-1 dark:text-white dark:text-opacity-50">Chat models</h5>
                <USelect v-model="selectedChatModel" :options="chatModelOptions" />

            </div>
            <div class="mb-4">
                <h5 class="text-black text-opacity-50 mb-1 dark:text-white dark:text-opacity-50">OpenAI API Key

                </h5>
                <UInput placeholder="API Key" v-model="storageOpenAIKey" />
                <div class="flex justify-end">
                    <a class="text-sm text-white text-opacity-50 mt-2 hover:underline text-right" target="_blank"
                        href="https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key"> {{
                            t('open-ai-key-message') + '?' }}</a>
                </div>
            </div>
            <UDivider class="my-4"></UDivider>
            <UButton color="red" block @click="isClearDataConfirmModalOpen = true">
                {{ t('clear-data') }}
            </UButton>
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
    <ClearDataConfirmModal v-model="isClearDataConfirmModalOpen" @clearData="onClearData" />
</template>