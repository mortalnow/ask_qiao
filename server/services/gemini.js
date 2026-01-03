import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

let genAI = null;
let model = null;

function getModel() {
  if (!genAI && config.googleAiApiKey) {
    genAI = new GoogleGenerativeAI(config.googleAiApiKey);
    // Use gemini-1.5-flash (stable and fast)
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  return model;
}

/**
 * Stream chat completion from Gemini
 * @param {Array} messages - Conversation history
 * @param {Function} onChunk - Callback for each streamed chunk
 * @param {Function} onDone - Callback when stream completes
 * @param {Function} onError - Callback for errors
 */
export async function streamChat(messages, onChunk, onDone, onError) {
  const geminiModel = getModel();
  
  if (!geminiModel) {
    onError(new Error('Google AI API key not configured'));
    return;
  }

  try {
    // Convert messages to Gemini format
    // Gemini uses 'user' and 'model' roles
    const history = [];
    let currentMessage = '';
    
    for (const msg of messages.slice(0, -1)) {
      history.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    // Get the last message as the current prompt
    const lastMessage = messages[messages.length - 1];
    currentMessage = lastMessage.content;

    // Start chat with history
    const chat = geminiModel.startChat({ history });
    
    // Stream the response
    const result = await chat.sendMessageStream(currentMessage);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        onChunk(text);
      }
    }
    
    onDone();
  } catch (err) {
    console.error('Gemini streaming error:', err);
    // Provide more detailed error message
    const errorMessage = err.message || err.toString() || 'Connection error';
    onError(new Error(errorMessage));
  }
}

export const modelInfo = {
  id: 'gemini',
  name: 'Gemini 1.5 Flash',
  provider: 'Google',
  description: 'Fast and efficient multimodal model from Google'
};

