<script setup lang="ts">
const { t } = useI18n()
const model = defineModel({ default: false })
const emit = defineEmits(['clearData'])

function onClearDataClick() {
    model.value = false
    emit('clearData')
}
</script>

<template>
    <UModal v-model="model">
        <UCard>
            <template #header>
                <h3>{{ t('clear-data') }}</h3>
            </template>

            <div>
                {{ t('clear-data-message') }}
            </div>

            <template #footer>
                <div class="flex justify-end">
                    <UButton class="mr-4" @click="model = false">{{ t('cancel') }}</UButton>
                    <UButton @click="onClearDataClick">{{ t('confirm') }}</UButton>
                </div>
            </template>
        </UCard>
    </UModal>
</template>