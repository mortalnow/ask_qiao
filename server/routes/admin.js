import { Router } from 'express';
import { User, ExtensionRequest } from '../db/models.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

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

