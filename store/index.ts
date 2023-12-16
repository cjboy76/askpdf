import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDoc = defineStore('document', () => {
    const document = ref<PageContent[]>([])
    const rawTextContent = ref('')
    const summarize = ref('')
    const _compiled = ref(false)

    const setDocument = ({ data, raw }: { data: PageContent[], raw: string }) => {
        document.value = data
        rawTextContent.value = raw
        _compiled.value = false
    }

    const setSummarize = (value: string) => {
        summarize.value = value
    }

    const compiled = computed(() => _compiled.value)

    return { document, setDocument, summarize, setSummarize, compiled, rawTextContent }
})