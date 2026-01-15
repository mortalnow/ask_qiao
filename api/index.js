/**
 * Vercel Serverless Function Entry Point
 * This wraps the Express app for Vercel deployment
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { connectDB } from '../server/db/init.js';
import authRoutes from '../server/routes/auth.js';
import chatRoutes from '../server/routes/chat.js';
import adminRoutes from '../server/routes/admin.js';
import extensionRoutes from '../server/routes/extension.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// Initialize database connection (will be reused across invocations)
let dbConnected = false;

async function ensureDBConnection() {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error) {
      console.error('Database connection error:', error);
      // Don't throw - let the request continue, connection will retry
    }
  }
}

// Ensure DB connection before handling requests
app.use(async (req, res, next) => {
  await ensureDBConnection();
  next();
});

// Apply rate limiting
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
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Export for Vercel serverless function
// Vercel automatically handles Express apps when exported directly
export default app;

