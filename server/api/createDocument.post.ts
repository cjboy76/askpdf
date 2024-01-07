import { useDocModel } from "../models/docModel"

export default defineEventHandler(async (event) => {
    const { name, data } = await readBody<{ data: { page: number, textContent: string }[], name: string, raw: string }>(event)
    const docModel = useDocModel(name)
    await docModel.insertMany(data)
    return {
        data: 'Create document success!'
    }
})