import { defineMongooseModel } from '#nuxt/mongoose'

export const DocumentModel = defineMongooseModel('DocumentModel', {
  textContent: {
    type: String,
    required: true
  },
  page: {
    type: String,
    required: true
  }
})
