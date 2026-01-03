import jwt from 'jsonwebtoken';
import { config } from '../config.js';

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

