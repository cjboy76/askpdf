import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export default defineEventHandler(async (event) => {
  try {
    const apiKey = event.node.req.headers['x-openai-key']?.toString()
    if (!apiKey) throw new Error('Missing OpenAI API key');
  
    const { docs, model } = await readBody<{
        docs: string,
        model: string
    }>(event);

    const openai = createOpenAI({
      apiKey: apiKey,
    });
  
    const result = await generateText({
      model: openai(model),
      system: 'You are a professional writer. ' + 'Return value in plain text format' +
      'You write simple, clear, and concise title.',
      prompt: docs,
    });
  
    return result.text
  } catch (error) {
    console.log({error})
    return ''
  }
});
