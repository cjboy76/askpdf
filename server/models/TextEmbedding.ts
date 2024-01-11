import { defineMongooseModel } from '#nuxt/mongoose'
import { Schema } from 'mongoose'

export const TextEmbedding = defineMongooseModel('TextEmbedding', {
  text: String,
  page: Number,
  text_embedding: [Number],
  document_id: { type: Schema.Types.ObjectId, ref: 'PDFDocument' }
})
