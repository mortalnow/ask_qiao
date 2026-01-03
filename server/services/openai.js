import OpenAI from 'openai';
import { config } from '../config.js';

let openai = null;

function getClient() {
  if (!openai && config.openaiApiKey) {
    openai = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return openai;
}

/**
 * Stream chat completion from OpenAI
 * @param {Array} messages - Conversation history
 * @param {Function} onChunk - Callback for each streamed chunk
 * @param {Function} onDone - Callback when stream completes
 * @param {Function} onError - Callback for errors
 */
export async function streamChat(messages, onChunk, onDone, onError) {
  const client = getClient();
  
  if (!client) {
    onError(new Error('OpenAI API key not configured'));
    return;
  }

  try {
    const stream = await client.chat.completions.create({
      model: 'gpt-4o', // Using gpt-4o (latest stable)
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        onChunk(content);
      }
    }
    
    onDone();
  } catch (err) {
    console.error('OpenAI streaming error:', err);
    // Provide more detailed error message
    const errorMessage = err.message || err.toString() || 'Connection error';
    onError(new Error(errorMessage));
  }
}

export const modelInfo = {
  id: 'chatgpt',
  name: 'GPT-4o',
  provider: 'OpenAI',
  description: 'OpenAI\'s latest flagship model with vision and reasoning'
};

