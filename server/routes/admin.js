import { Router } from 'express';
import db from '../db/init.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { generateInviteCode } from '../utils/inviteCode.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * POST /api/admin/invites
 * Generate new invite codes
 */
router.post('/invites', (req, res) => {
  try {
    const { count = 1 } = req.body;
    const numCodes = Math.min(Math.max(parseInt(count) || 1, 1), 50); // Limit 1-50

    const codes = [];

    for (let i = 0; i < numCodes; i++) {
      let code;
      let attempts = 0;

      // Ensure unique code
      while (attempts < 10) {
        code = generateInviteCode();
        const existing = db.prepare('SELECT id FROM invite_codes WHERE code = ?').get(code);
        if (!existing) break;
        attempts++;
      }

      if (attempts >= 10) {
        return res.status(500).json({ error: 'Failed to generate unique code' });
      }

      db.prepare('INSERT INTO invite_codes (code) VALUES (?)').run(code);
      codes.push(code);
    }

    res.json({
      success: true,
      codes,
      count: codes.length
    });
  } catch (err) {
    console.error('Generate invite error:', err);
    res.status(500).json({ error: 'Failed to generate invite codes' });
  }
});

/**
 * GET /api/admin/invites
 * List all invite codes with usage stats
 */
router.get('/invites', (req, res) => {
  try {
    const codes = db.prepare(`
      SELECT 
        ic.id,
        ic.code,
        ic.created_at,
        ic.used_at,
        u.username as used_by_username,
        u.id as used_by_id
      FROM invite_codes ic
      LEFT JOIN users u ON ic.used_by = u.id
      ORDER BY ic.created_at DESC
    `).all();

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN used_by IS NULL THEN 1 ELSE 0 END) as unused,
        SUM(CASE WHEN used_by IS NOT NULL THEN 1 ELSE 0 END) as used
      FROM invite_codes
    `).get();

    res.json({
      codes,
      stats
    });
  } catch (err) {
    console.error('List invites error:', err);
    res.status(500).json({ error: 'Failed to list invite codes' });
  }
});

/**
 * DELETE /api/admin/invites/:id
 * Delete an invite code (only if unused)
 */
router.delete('/invites/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const code = db.prepare('SELECT * FROM invite_codes WHERE id = ?').get(id);

    if (!code) {
      return res.status(404).json({ error: 'Invite code not found' });
    }

    if (code.used_by) {
      return res.status(400).json({ error: 'Cannot delete used invite code' });
    }

    db.prepare('DELETE FROM invite_codes WHERE id = ?').run(id);

    res.json({ success: true, message: 'Invite code deleted' });
  } catch (err) {
    console.error('Delete invite error:', err);
    res.status(500).json({ error: 'Failed to delete invite code' });
  }
});

export default router;

