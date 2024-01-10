import { DocumentModel } from "../models/docModel"

export default defineEventHandler(async (event) => {
    const { data } = await readBody<{ data: { page: number, textContent: string }[], name: string, raw: string }>(event)
    await DocumentModel.insertMany(data)
    return {
        data: 'Create document success!'
    }
})