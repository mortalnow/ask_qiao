import { Router } from 'express';
import bcrypt from 'bcrypt';
import db from '../db/init.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { isValidCodeFormat } from '../utils/inviteCode.js';

const router = Router();

/**
 * POST /api/auth/verify
 * Verify invite code, create user account with password
 */
router.post('/verify', async (req, res) => {
  try {
    const { code, username, password } = req.body;

    // Validate input
    if (!code || !username || !password) {
      return res.status(400).json({ error: 'Invite code, username, and password are required' });
    }

    if (!isValidCodeFormat(code)) {
      return res.status(400).json({ error: 'Invalid invite code format' });
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 2 || trimmedUsername.length > 30) {
      return res.status(400).json({ error: 'Username must be 2-30 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if code exists and is unused
    const inviteCode = db.prepare('SELECT * FROM invite_codes WHERE code = ?').get(code);

    if (!inviteCode) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    if (inviteCode.used_by) {
      return res.status(400).json({ error: 'Invite code has already been used' });
    }

    // Check if username is taken
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(trimmedUsername);
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user and mark code as used (transaction)
    const createUser = db.transaction(() => {
      const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
        .run(trimmedUsername, passwordHash);
      const userId = result.lastInsertRowid;

      db.prepare('UPDATE invite_codes SET used_by = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(userId, inviteCode.id);

      return { id: userId, username: trimmedUsername };
    });

    const user = createUser();
    const userRecord = db.prepare('SELECT id, username, is_admin FROM users WHERE id = ?').get(user.id);
    const token = generateToken(userRecord);

    res.json({
      success: true,
      token,
      user: { id: userRecord.id, username: userRecord.username, isAdmin: userRecord.is_admin || false },
      message: 'Account created successfully'
    });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * POST /api/auth/login
 * Login with username and password
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if user has a password set
    if (!user.password_hash) {
      return res.status(401).json({
        error: 'Account not set up. Please use an invite code to create your account with a password.'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate token
    const token = generateToken({ id: user.id, username: user.username, is_admin: user.is_admin || false });

    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, isAdmin: user.is_admin || false }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, is_admin, created_at FROM users WHERE id = ?').get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        isAdmin: user.is_admin || false,
        created_at: user.created_at 
      } 
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;

