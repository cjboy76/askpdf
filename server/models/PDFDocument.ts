import { defineMongooseModel } from '#nuxt/mongoose'

export const PDFDocument = defineMongooseModel('PDFDocument', {
  name: String,
  user: String
})
