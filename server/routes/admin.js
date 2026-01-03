import { Router } from 'express';
import { User, InviteCode } from '../db/models.js';
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
router.post('/invites', async (req, res) => {
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
        const existing = await InviteCode.findOne({ code });
        if (!existing) break;
        attempts++;
      }

      if (attempts >= 10) {
        return res.status(500).json({ error: 'Failed to generate unique code' });
      }

      await InviteCode.create({ code });
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
router.get('/invites', async (req, res) => {
  try {
    const codesRaw = await InviteCode.find()
      .populate('used_by', 'username _id')
      .sort({ created_at: -1 });

    const codes = codesRaw.map(ic => ({
      id: ic._id.toString(),
      code: ic.code,
      created_at: ic.created_at,
      used_at: ic.used_at,
      used_by_username: ic.used_by ? ic.used_by.username : null,
      used_by_id: ic.used_by ? ic.used_by._id.toString() : null
    }));

    const total = await InviteCode.countDocuments();
    const used = await InviteCode.countDocuments({ used_by: { $ne: null } });
    const unused = total - used;

    res.json({
      codes,
      stats: { total, used, unused }
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
router.delete('/invites/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const code = await InviteCode.findById(id);

    if (!code) {
      return res.status(404).json({ error: 'Invite code not found' });
    }

    if (code.used_by) {
      return res.status(400).json({ error: 'Cannot delete used invite code' });
    }

    await InviteCode.findByIdAndDelete(id);

    res.json({ success: true, message: 'Invite code deleted' });
  } catch (err) {
    console.error('Delete invite error:', err);
    res.status(500).json({ error: 'Failed to delete invite code' });
  }
});

export default router;

