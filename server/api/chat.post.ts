import type { Message } from 'ai';
import { streamText, convertToCoreMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default defineEventHandler(async (event) => {
  try {
    const apiKey = event.node.req.headers['x-openai-key']?.toString()
    if (!apiKey) throw new Error('Missing OpenAI API key');
  
    const { messages, data: { model } } = await readBody<{
      messages: Message[],
      data: { model: string }
    }>(event);
    const openai = createOpenAI({
      apiKey: apiKey,
    });
  
    const result = await streamText({
      model: openai(model),
      messages: convertToCoreMessages(messages),
    });
  
    return result.toDataStreamResponse();
  } catch (error) {
    console.log({error})
    return ''
  }
});
