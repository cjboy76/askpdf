import { defineMongooseModel } from '#nuxt/mongoose'

export const pdfModel = defineMongooseModel('pdfModel', {
  pdfName: String,
  userId: String
})
