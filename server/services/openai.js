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
 * @param {Array} files - Optional array of files { name, mimeType, data, extractedText, isDocument }
 * @param {Function} onChunk - Callback for each streamed chunk
 * @param {Function} onDone - Callback when stream completes
 * @param {Function} onError - Callback for errors
 */
export async function streamChat(messages, files = [], onChunk, onDone, onError) {
  const client = getClient();

  if (!client) {
    onError(new Error('OpenAI API key not configured'));
    return;
  }

  try {
    const modelName = await getLatestModel();

    // Separate documents and images
    const safeFiles = files || [];
    const imageFiles = safeFiles.filter(f => !f.isDocument && f.data);
    const documentFiles = safeFiles.filter(f => f.isDocument && f.extractedText);

    // Build messages with potential multimodal content
    const formattedMessages = messages.map((m, index) => {
      // Only attach files to the last user message
      const isLastUserMessage = m.role === 'user' && index === messages.length - 1;

      if (isLastUserMessage && safeFiles.length > 0) {
        // Build content with document text injected
        let textContent = m.content;

        // Prepend document content as context
        if (documentFiles.length > 0) {
          let docContext = '\n\n[ATTACHED DOCUMENTS]\n';
          for (const doc of documentFiles) {
            docContext += `\n--- ${doc.name} ---\n${doc.extractedText}\n--- End of ${doc.name} ---\n`;
          }
          docContext += '\n[END OF ATTACHED DOCUMENTS]\n\n';
          textContent = docContext + textContent;
        }

        // Build multimodal content array
        const content = [
          { type: 'text', text: textContent }
        ];

        // Add images (OpenAI supports images in vision)
        for (const file of imageFiles) {
          if (file.mimeType.startsWith('image/')) {
            content.push({
              type: 'image_url',
              image_url: {
                url: `data:${file.mimeType};base64,${file.data}`
              }
            });
          }
        }

        return { role: m.role, content };
      }

      // Regular text message
      return { role: m.role, content: m.content };
    });

    const stream = await client.chat.completions.create({
      model: modelName,
      messages: formattedMessages,
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

