<script lang="ts" setup>
const model = defineModel<boolean>({ required: true })
const { t } = useI18n()

const emit = defineEmits<{
  onUpload: [value: File]
}>()

const uploadFile = ref<File | null>()

function onFileSelect(files: FileList) {
  if (files[0]) uploadFile.value = files[0]
}

function uploadHandler() {
  model.value = false
  if (!uploadFile.value) return
  const file = uploadFile.value
  uploadFile.value = null
  emit('onUpload', toRaw(file))
}
</script>

<template>
  <UModal
    v-model="model"
    :style="{ width: '25rem' }"
    prevent-close
  >
    <UCard>
      <template #header>
        <div class="font-bold">
          {{ t('upload-file') }}
        </div>
      </template>
      <UInput
        type="file"
        icon="i-heroicons-folder"
        class="flex justify-center"
        accept=".pdf"
        @change="onFileSelect"
      />
      <template #footer>
        <div class="flex justify-end">
          <UButton
            text
            class="mr-4"
            @click="model = false"
          >
            {{ t('cancel') }}
          </UButton>
          <UButton
            text
            :disabled="!uploadFile"
            @click="uploadHandler"
          >
            {{ t('confirm') }}
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
