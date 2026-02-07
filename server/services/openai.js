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
 * Get the configured ChatGPT model.
 * This service is intentionally single-model.
 */
async function getLatestModel() {
  // Return cached model if still valid
  if (cachedModelName && Date.now() - modelCacheTime < MODEL_CACHE_TTL) {
    return cachedModelName;
  }

  const configuredModel = config.openaiModel && config.openaiModel !== 'latest'
    ? config.openaiModel
    : 'gpt-5';

  cachedModelName = configuredModel;
  modelCacheTime = Date.now();
  return cachedModelName;
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
  
  return {
    id: 'chatgpt',
    model: modelName,
    name: 'ChatGPT',
    provider: 'OpenAI',
    description: 'Single-model ChatGPT prompting workspace'
  };
}

export const modelInfo = {
  id: 'chatgpt',
  name: 'ChatGPT',
  provider: 'OpenAI',
  description: 'ChatGPT single-model prompt coaching'
};
