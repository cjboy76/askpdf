export function base64ToPdf(base64String: string): Blob {
  const byteCharacters = atob(base64String)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: 'application/pdf' })
}

export async function pdfToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = function (event: ProgressEvent<FileReader>) {
      if (event.target && typeof event.target.result === 'string') {
        const base64String = event.target.result.split('base64,')[1]
        resolve(base64String)
      } else {
        reject(new Error('Failed to read PDF file'))
      }
    }
    reader.onerror = function (error) {
      reject(error)
    }
    reader.readAsDataURL(file)
  })
}
