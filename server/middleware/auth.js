import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../db/models.js';

/**
 * JWT authentication middleware
 * Verifies the token and attaches user info to request
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, isAdmin: user.is_admin || false },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

/**
 * Admin-only middleware
 * Must be used after authenticateToken
 */
export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Check usage limit middleware
 * Must be used after authenticateToken
 * Attaches dbUser to request for later use
 */
export async function checkUsageLimit(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Admin users with is_unlimited bypass the check
    if (user.is_unlimited) {
      req.dbUser = user;
      return next();
    }
    
    // Check if user has exceeded their limit
    if (user.usage_count >= user.usage_limit) {
      return res.status(403).json({
        error: 'usage_limit_exceeded',
        message: 'You have used all your free prompts. Please request an extension.',
        usage_count: user.usage_count,
        usage_limit: user.usage_limit
      });
    }
    
    // Attach user to request for incrementing usage later
    req.dbUser = user;
    next();
  } catch (err) {
    console.error('Check usage limit error:', err);
    return res.status(500).json({ error: 'Failed to check usage limit' });
  }
}

/**
 * Increment user's usage count
 * Call this after successful chat response
 */
export async function incrementUsage(userId) {
  try {
    await User.findByIdAndUpdate(userId, { $inc: { usage_count: 1 } });
  } catch (err) {
    console.error('Increment usage error:', err);
  }
}

