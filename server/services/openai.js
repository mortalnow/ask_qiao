import OpenAI from 'openai';
import { config } from '../config.js';

let openai = null;
let cachedModelName = null;
let modelCacheTime = 0;
const MODEL_CACHE_TTL = 60 * 60 * 1000; // 1 hour cache

function getClient() {
  if (!openai && config.openaiApiKey) {
    openai = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return openai;
}

/**
 * Get the latest GPT model name dynamically
 * Prefers gpt-5.x > gpt-4o > gpt-4-turbo > gpt-4
 */
async function getLatestModel() {
  // Return cached model if still valid
  if (cachedModelName && Date.now() - modelCacheTime < MODEL_CACHE_TTL) {
    return cachedModelName;
  }

  // If explicit model is configured (not 'latest'), use it
  if (config.openaiModel && config.openaiModel !== 'latest') {
    cachedModelName = config.openaiModel;
    modelCacheTime = Date.now();
    return cachedModelName;
  }

  const client = getClient();
  if (!client) return 'gpt-4o'; // fallback

  try {
    const models = await client.models.list();
    const modelList = [];
    
    for await (const model of models) {
      modelList.push(model.id);
    }

    // Priority order for latest models (higher priority first)
    const priorities = [
      /^gpt-5\.\d+-chat/,      // GPT-5.x chat models
      /^gpt-5\.\d+/,           // GPT-5.x models
      /^gpt-5/,                // GPT-5 models
      /^gpt-4o-/,              // GPT-4o dated versions
      /^gpt-4o$/,              // GPT-4o base
      /^gpt-4-turbo/,          // GPT-4 Turbo
      /^gpt-4-/,               // Other GPT-4 variants
    ];

    for (const pattern of priorities) {
      const matches = modelList.filter(m => pattern.test(m));
      if (matches.length > 0) {
        // Sort to get the latest version (higher numbers/dates first)
        matches.sort().reverse();
        cachedModelName = matches[0];
        modelCacheTime = Date.now();
        console.log(`[OpenAI] Auto-selected model: ${cachedModelName}`);
        return cachedModelName;
      }
    }

    // Fallback
    cachedModelName = 'gpt-4o';
    modelCacheTime = Date.now();
    return cachedModelName;
  } catch (err) {
    console.error('Failed to fetch OpenAI models:', err.message);
    return config.openaiModel !== 'latest' ? config.openaiModel : 'gpt-4o';
  }
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
    const modelName = await getLatestModel();
    
    const stream = await client.chat.completions.create({
      model: modelName,
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

/**
 * Get current model info (for API/UI)
 */
export async function getModelInfo() {
  const modelName = await getLatestModel();
  const displayName = modelName.replace('gpt-', 'GPT-').replace(/-chat.*$/, '').replace(/-\d{4}-\d{2}-\d{2}$/, '');
  
  return {
    id: 'chatgpt',
    model: modelName,
    name: displayName,
    provider: 'OpenAI',
    description: 'OpenAI最新旗舰模型，最强大的推理和编码能力'
  };
}

export const modelInfo = {
  id: 'chatgpt',
  name: 'GPT (Latest)',
  provider: 'OpenAI',
  description: 'OpenAI最新旗舰模型，最强大的推理和编码能力'
};

