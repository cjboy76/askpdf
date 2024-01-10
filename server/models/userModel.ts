import { defineMongooseModel } from '#nuxt/mongoose'

export const User = defineMongooseModel('User', {
  name: String,
  email: String,
  sub: String,
  picture: String,
  locale: String
})
