import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { config } from './config.js';
import { connectDB } from './db/init.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import extensionRoutes from './routes/extension.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors());
// Increase body size limit for file uploads (base64 encoded)
// 50MB should handle 5 files of ~7MB each after base64 encoding
app.use(express.json({ limit: '50mb' }));

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: { error: 'Too many requests, please try again later' }
});

// Stricter rate limit for chat endpoint
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 chat requests per minute
  message: { error: 'Too many chat requests, please slow down' }
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDB();

    // Apply rate limiting
    // Note: More specific routes should come first
    app.use('/api/chat', chatLimiter);
    app.use('/api', apiLimiter);

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/extension', extensionRoutes);

    // Serve static files from public directory
    const publicPath = join(__dirname, '..', 'public');
    app.use(express.static(publicPath));

    // SPA fallback - serve index.html for non-API routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(join(publicPath, 'index.html'));
      }
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    app.listen(config.port, () => {
      console.log(`🚀 Server running at http://localhost:${config.port}`);
      console.log(`📱 Open in browser to access the chat interface`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();


