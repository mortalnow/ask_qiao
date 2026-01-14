import { Router } from 'express';
import { authenticateToken, checkUsageLimit, incrementUsage } from '../middleware/auth.js';
import * as openaiService from '../services/openai.js';
import * as geminiService from '../services/gemini.js';

const router = Router();

// Map of available models
const models = {
  chatgpt: openaiService,
  gemini: geminiService
};

/**
 * GET /api/models
 * List available AI models with their current active versions
 */
router.get('/models', authenticateToken, async (req, res) => {
  try {
    // Get dynamic model info (includes actual model names being used)
    const modelInfoPromises = Object.entries(models).map(async ([key, service]) => {
      if (service.getModelInfo) {
        return await service.getModelInfo();
      }
      return service.modelInfo;
    });
    
    const availableModels = await Promise.all(modelInfoPromises);
    res.json({ models: availableModels });
  } catch (err) {
    console.error('Error fetching model info:', err);
    // Fallback to static info
    const availableModels = Object.values(models).map(service => service.modelInfo);
    res.json({ models: availableModels });
  }
});

/**
 * POST /api/chat
 * Send message to selected AI model with streaming response
 * Checks usage limit and increments usage count on success
 */
router.post('/', authenticateToken, checkUsageLimit, async (req, res) => {
  const { message, model, history = [] } = req.body;

  // Validate input
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!model || !models[model]) {
    return res.status(400).json({ 
      error: 'Invalid model. Available: ' + Object.keys(models).join(', ') 
    });
  }

  // Sanitize message
  const sanitizedMessage = message.trim().slice(0, 32000); // Limit message length
  
  if (!sanitizedMessage) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  // Build conversation messages
  const messages = [
    ...history.map(h => ({
      role: h.role,
      content: h.content.slice(0, 32000)
    })),
    { role: 'user', content: sanitizedMessage }
  ];

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Stream response from AI model
  const service = models[model];
  
  try {
    await service.streamChat(
      messages,
      // onChunk
      (chunk) => {
        try {
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        } catch (writeErr) {
          // Client disconnected, ignore
          console.log('Client disconnected during stream');
        }
      },
      // onDone
      async () => {
        try {
          // Increment usage count for non-unlimited users
          if (req.dbUser && !req.dbUser.is_unlimited) {
            await incrementUsage(req.user.id);
          }
          
          // Get updated usage info
          const newUsageCount = req.dbUser?.is_unlimited ? null : (req.dbUser?.usage_count || 0) + 1;
          const usageLimit = req.dbUser?.is_unlimited ? null : req.dbUser?.usage_limit;
          
          res.write(`data: ${JSON.stringify({ 
            type: 'done',
            usage: {
              count: newUsageCount,
              limit: usageLimit,
              is_unlimited: req.dbUser?.is_unlimited || false
            }
          })}\n\n`);
          res.end();
        } catch (writeErr) {
          // Client disconnected, ignore
        }
      },
      // onError
      (error) => {
        try {
          res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
          res.end();
        } catch (writeErr) {
          // Client disconnected, ignore
        }
      }
    );
  } catch (err) {
    // Fallback error handling if streamChat itself throws
    console.error('Chat endpoint error:', err);
    try {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message || 'An unexpected error occurred' })}\n\n`);
      res.end();
    } catch (writeErr) {
      // Client disconnected, ignore
    }
  }
});

export default router;

