const isPending = useState('is-file-upload-pending', () => false)

export const usePdfUploader = () => {
    async function upload(file: File) {
        isPending.value = true
        try {
          const pdfInfo = await usePDFLoader(file)
          const documents = await createDocuments(pdfInfo.data)
          const pdfToBase64File = await pdfToBase64(file as File)
          const pdfBlob = new Blob([file], { type: 'application/pdf' })
          const pdfSourceUrl = URL.createObjectURL(pdfBlob)
          return {
            documents, pdfToBase64File, pdfSourceUrl
          }
        } catch (error) {
          return null
        } finally {
            isPending.value = false
        }
      }

    return {
        isPending, upload
    }
  }