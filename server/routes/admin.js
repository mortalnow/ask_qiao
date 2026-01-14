import { Router } from 'express';
import { User, InviteCode, ExtensionRequest } from '../db/models.js';
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

// ============================================
// Extension Request Management
// ============================================

/**
 * GET /api/admin/extensions
 * List all extension requests with user info
 */
router.get('/extensions', async (req, res) => {
  try {
    const { status } = req.query; // Optional filter: pending, approved, rejected
    
    const query = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }
    
    const requests = await ExtensionRequest.find(query)
      .populate('user', 'username usage_count usage_limit is_unlimited created_at')
      .sort({ created_at: -1 });
    
    const formattedRequests = requests.map(req => ({
      id: req._id.toString(),
      user: {
        id: req.user._id.toString(),
        username: req.user.username,
        usage_count: req.user.usage_count,
        usage_limit: req.user.usage_limit,
        is_unlimited: req.user.is_unlimited,
        created_at: req.user.created_at
      },
      reason: req.reason,
      requested_amount: req.requested_amount,
      status: req.status,
      admin_response: req.admin_response,
      granted_amount: req.granted_amount,
      granted_unlimited: req.granted_unlimited,
      created_at: req.created_at,
      resolved_at: req.resolved_at
    }));
    
    // Get stats
    const pending = await ExtensionRequest.countDocuments({ status: 'pending' });
    const approved = await ExtensionRequest.countDocuments({ status: 'approved' });
    const rejected = await ExtensionRequest.countDocuments({ status: 'rejected' });
    
    res.json({
      requests: formattedRequests,
      stats: { pending, approved, rejected, total: pending + approved + rejected }
    });
  } catch (err) {
    console.error('List extension requests error:', err);
    res.status(500).json({ error: 'Failed to list extension requests' });
  }
});

/**
 * POST /api/admin/extensions/:id/approve
 * Approve an extension request
 */
router.post('/extensions/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { granted_amount, grant_unlimited, admin_response } = req.body;
    
    const extensionRequest = await ExtensionRequest.findById(id);
    
    if (!extensionRequest) {
      return res.status(404).json({ error: 'Extension request not found' });
    }
    
    if (extensionRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }
    
    // Validate input
    if (!grant_unlimited && (!granted_amount || granted_amount < 1)) {
      return res.status(400).json({ 
        error: 'Must specify granted_amount or grant_unlimited' 
      });
    }
    
    // Update the user's usage limit
    const user = await User.findById(extensionRequest.user);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (grant_unlimited) {
      user.is_unlimited = true;
    } else {
      user.usage_limit += parseInt(granted_amount);
    }
    
    await user.save();
    
    // Update the extension request
    extensionRequest.status = 'approved';
    extensionRequest.granted_amount = grant_unlimited ? null : parseInt(granted_amount);
    extensionRequest.granted_unlimited = !!grant_unlimited;
    extensionRequest.admin_response = admin_response || null;
    extensionRequest.resolved_at = new Date();
    
    await extensionRequest.save();
    
    res.json({
      success: true,
      message: grant_unlimited 
        ? `Granted unlimited access to ${user.username}` 
        : `Granted ${granted_amount} more prompts to ${user.username}`,
      request: {
        id: extensionRequest._id,
        status: extensionRequest.status,
        granted_amount: extensionRequest.granted_amount,
        granted_unlimited: extensionRequest.granted_unlimited
      },
      user: {
        id: user._id,
        username: user.username,
        usage_limit: user.usage_limit,
        is_unlimited: user.is_unlimited
      }
    });
  } catch (err) {
    console.error('Approve extension error:', err);
    res.status(500).json({ error: 'Failed to approve extension request' });
  }
});

/**
 * POST /api/admin/extensions/:id/reject
 * Reject an extension request
 */
router.post('/extensions/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_response } = req.body;
    
    const extensionRequest = await ExtensionRequest.findById(id);
    
    if (!extensionRequest) {
      return res.status(404).json({ error: 'Extension request not found' });
    }
    
    if (extensionRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }
    
    // Update the extension request
    extensionRequest.status = 'rejected';
    extensionRequest.admin_response = admin_response || null;
    extensionRequest.resolved_at = new Date();
    
    await extensionRequest.save();
    
    res.json({
      success: true,
      message: 'Extension request rejected',
      request: {
        id: extensionRequest._id,
        status: extensionRequest.status,
        admin_response: extensionRequest.admin_response
      }
    });
  } catch (err) {
    console.error('Reject extension error:', err);
    res.status(500).json({ error: 'Failed to reject extension request' });
  }
});

/**
 * GET /api/admin/users
 * List all users with their usage stats
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('username is_admin usage_count usage_limit is_unlimited created_at')
      .sort({ created_at: -1 });
    
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      is_admin: user.is_admin,
      usage_count: user.usage_count,
      usage_limit: user.usage_limit,
      is_unlimited: user.is_unlimited,
      created_at: user.created_at
    }));
    
    res.json({ users: formattedUsers });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

export default router;

