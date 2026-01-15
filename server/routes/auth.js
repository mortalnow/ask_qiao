import { Router } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../db/models.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/register
 * Open registration - create user account with username and password
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 2 || trimmedUsername.length > 30) {
      return res.status(400).json({ error: 'Username must be 2-30 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if username is taken
    const existingUser = await User.findOne({ username: trimmedUsername });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      username: trimmedUsername,
      password_hash: passwordHash
    });

    const token = generateToken({
      id: user._id.toString(),
      username: user.username,
      is_admin: user.is_admin || false
    });

    res.json({
      success: true,
      token,
      user: { id: user._id.toString(), username: user.username, isAdmin: user.is_admin || false },
      message: 'Account created successfully'
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
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
    const user = await User.findOne({ username: username.trim() });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if user has a password set
    if (!user.password_hash) {
      return res.status(401).json({
        error: 'Account not set up. Please register with a password first.'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate token
    const token = generateToken({ 
      id: user._id.toString(), 
      username: user.username, 
      is_admin: user.is_admin || false 
    });

    res.json({
      success: true,
      token,
      user: { id: user._id.toString(), username: user.username, isAdmin: user.is_admin || false }
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
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('_id username is_admin created_at');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      user: { 
        id: user._id.toString(), 
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

