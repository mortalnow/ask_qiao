import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

let genAI = null;
let cachedModelName = null;
let modelCacheTime = 0;
const MODEL_CACHE_TTL = 60 * 60 * 1000; // 1 hour cache

function getClient() {
  if (!genAI && config.googleAiApiKey) {
    genAI = new GoogleGenerativeAI(config.googleAiApiKey);
  }
  return genAI;
}

/**
 * Get the latest Gemini model name dynamically
 * Prefers gemini-3-flash > gemini-2.0-flash > gemini-1.5-flash
 */
async function getLatestModel() {
  // Return cached model if still valid
  if (cachedModelName && Date.now() - modelCacheTime < MODEL_CACHE_TTL) {
    return cachedModelName;
  }

  // If explicit model is configured (not 'latest'), use it
  if (config.geminiModel && config.geminiModel !== 'latest') {
    cachedModelName = config.geminiModel;
    modelCacheTime = Date.now();
    return cachedModelName;
  }

  const client = getClient();
  if (!client) return 'gemini-1.5-flash'; // fallback

  try {
    // Fetch available models from Google AI
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${config.googleAiApiKey}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }
    
    const data = await response.json();
    const models = data.models || [];
    
    // Extract model names and filter for generative models
    const modelNames = models
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace('models/', ''));

    // Priority order for latest models (higher priority first)
    const priorities = [
      /^gemini-3.*flash/,       // Gemini 3 Flash variants
      /^gemini-3/,              // Other Gemini 3 models
      /^gemini-2\.0.*flash/,    // Gemini 2.0 Flash
      /^gemini-2/,              // Other Gemini 2 models
      /^gemini-1\.5-flash/,     // Gemini 1.5 Flash
      /^gemini-1\.5-pro/,       // Gemini 1.5 Pro
      /^gemini-pro/,            // Gemini Pro
    ];

    for (const pattern of priorities) {
      const matches = modelNames.filter(m => pattern.test(m));
      if (matches.length > 0) {
        // Sort to get the latest version
        matches.sort().reverse();
        cachedModelName = matches[0];
        modelCacheTime = Date.now();
        console.log(`[Gemini] Auto-selected model: ${cachedModelName}`);
        return cachedModelName;
      }
    }

    // Fallback
    cachedModelName = 'gemini-1.5-flash';
    modelCacheTime = Date.now();
    return cachedModelName;
  } catch (err) {
    console.error('Failed to fetch Gemini models:', err.message);
    return config.geminiModel !== 'latest' ? config.geminiModel : 'gemini-1.5-flash';
  }
}

/**
 * Get a configured model instance
 */
async function getModel() {
  const client = getClient();
  if (!client) return null;
  
  const modelName = await getLatestModel();
  return client.getGenerativeModel({ model: modelName });
}

/**
 * Stream chat completion from Gemini
 * @param {Array} messages - Conversation history
 * @param {Function} onChunk - Callback for each streamed chunk
 * @param {Function} onDone - Callback when stream completes
 * @param {Function} onError - Callback for errors
 */
export async function streamChat(messages, onChunk, onDone, onError) {
  const geminiModel = await getModel();
  
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

/**
 * Get current model info (for API/UI)
 */
export async function getModelInfo() {
  const modelName = await getLatestModel();
  const displayName = modelName
    .replace('gemini-', 'Gemini ')
    .replace(/-/g, ' ')
    .replace(/(\d)\.(\d)/g, '$1.$2')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  
  return {
    id: 'gemini',
    model: modelName,
    name: displayName,
    provider: 'Google',
    description: 'Google最新模型，快速高效的多模态响应'
  };
}

export const modelInfo = {
  id: 'gemini',
  name: 'Gemini (Latest)',
  provider: 'Google',
  description: 'Google最新模型，快速高效的多模态响应'
};

