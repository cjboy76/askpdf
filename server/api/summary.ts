import OpenAI from "openai";
import { ChatCompletionMessageParam } from 'openai/resources/chat';

export default defineLazyEventHandler(() => {
    const apiKey = useRuntimeConfig().openaiApiKey;
    if (!apiKey) throw new Error('Missing OpenAI API key');
    const openai = new OpenAI({
        apiKey: apiKey,
    });

    return defineEventHandler(async (event) => {
        const messages = await readBody<ChatCompletionMessageParam[]>(event)
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages,
        });

        return response.choices[0].message.content
    })
})
