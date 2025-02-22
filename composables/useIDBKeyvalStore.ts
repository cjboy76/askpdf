import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval'
import type { Message } from 'ai'
import type { Document } from '@langchain/core/documents'

const IDB_KEY = {
  FILE: 'askpdf-file',
  DOCUMENTS: 'askpdf-docs',
  MESSAGES: 'askpdf-msg',
  RELATED_PAGES: 'askpdf-related-pages',
  SUMMARY_TITLE: 'askpdf-summary-title',
}

export const useIDBKeyvalStore = () => {
  const { data: file } = useIDBKeyval(IDB_KEY.FILE, '')
  const { data: documents } = useIDBKeyval<Document<Record<string, string>>[]>(
    IDB_KEY.DOCUMENTS,
    [],
  )
  const { data: messages } = useIDBKeyval<Message[]>(IDB_KEY.MESSAGES, [])
  const { data: relatedPages } = useIDBKeyval<number[]>(
    IDB_KEY.RELATED_PAGES,
    [],
  )
  return {
    file,
    documents,
    messages,
    relatedPages,
  }
}
