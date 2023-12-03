import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDoc = defineStore('document', () => {
    const document = ref<PageContent[]>([])
    const summarize = ref('')
    const _compiled = ref(false)

    const setDocument = (value: PageContent[]) => {
        document.value = value
        _compiled.value = false
    }

    const setSummarize = (value: string) => {
        summarize.value = value
    }

    const compiled = computed(() => _compiled.value)

    return { document, setDocument, summarize, setSummarize, compiled }
})