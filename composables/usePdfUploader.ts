import { STATE_KEY } from '~/share'

export const usePdfUploader = () => {
  const isPending = useState(STATE_KEY.IS_FILE_UPLOADING, () => false)

  async function upload(file: File) {
    isPending.value = true
    try {
      const pdfInfo = await usePDFLoader(file)
      const documents = await createDocuments(pdfInfo.data)
      const pdfToBase64File = await pdfToBase64(file as File)
      return {
        documents, pdfToBase64File,
      }
    }
    catch {
      return null
    }
    finally {
      isPending.value = false
    }
  }

  return {
    isPending, upload,
  }
}
