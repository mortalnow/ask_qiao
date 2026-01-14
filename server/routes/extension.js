import { Router } from 'express';
import { User, ExtensionRequest } from '../db/models.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All extension routes require authentication
router.use(authenticateToken);

/**
 * GET /api/extension/status
 * Get user's usage status and any pending extension requests
 */
router.get('/status', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get most recent extension request
    const pendingRequest = await ExtensionRequest.findOne({
      user: user._id,
      status: 'pending'
    }).sort({ created_at: -1 });
    
    const lastRequest = await ExtensionRequest.findOne({
      user: user._id
    }).sort({ created_at: -1 });
    
    res.json({
      usage: {
        count: user.usage_count,
        limit: user.usage_limit,
        remaining: user.is_unlimited ? null : Math.max(0, user.usage_limit - user.usage_count),
        is_unlimited: user.is_unlimited
      },
      extension: {
        has_pending: !!pendingRequest,
        pending_request: pendingRequest ? {
          id: pendingRequest._id,
          requested_amount: pendingRequest.requested_amount,
          reason: pendingRequest.reason,
          created_at: pendingRequest.created_at
        } : null,
        last_request: lastRequest ? {
          id: lastRequest._id,
          status: lastRequest.status,
          requested_amount: lastRequest.requested_amount,
          granted_amount: lastRequest.granted_amount,
          granted_unlimited: lastRequest.granted_unlimited,
          admin_response: lastRequest.admin_response,
          created_at: lastRequest.created_at,
          resolved_at: lastRequest.resolved_at
        } : null
      }
    });
  } catch (err) {
    console.error('Get extension status error:', err);
    res.status(500).json({ error: 'Failed to get extension status' });
  }
});

/**
 * POST /api/extension/request
 * Submit a request for more prompts
 */
router.post('/request', async (req, res) => {
  try {
    const { reason, requested_amount } = req.body;
    
    // Validate reason
    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Please provide a reason (at least 10 characters)' 
      });
    }
    
    if (reason.length > 500) {
      return res.status(400).json({ 
        error: 'Reason must be 500 characters or less' 
      });
    }
    
    // Validate requested_amount (null means unlimited, otherwise must be positive number)
    if (requested_amount !== null && requested_amount !== undefined) {
      const amount = parseInt(requested_amount);
      if (isNaN(amount) || amount < 1 || amount > 100) {
        return res.status(400).json({ 
          error: 'Requested amount must be between 1 and 100, or leave empty for unlimited' 
        });
      }
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user already has unlimited access
    if (user.is_unlimited) {
      return res.status(400).json({ 
        error: 'You already have unlimited access' 
      });
    }
    
    // Check for existing pending request
    const existingPending = await ExtensionRequest.findOne({
      user: user._id,
      status: 'pending'
    });
    
    if (existingPending) {
      return res.status(400).json({ 
        error: 'You already have a pending request. Please wait for admin review.',
        pending_request_id: existingPending._id
      });
    }
    
    // Create new extension request
    const extensionRequest = await ExtensionRequest.create({
      user: user._id,
      reason: reason.trim(),
      requested_amount: requested_amount ? parseInt(requested_amount) : null
    });
    
    res.status(201).json({
      success: true,
      message: 'Extension request submitted successfully',
      request: {
        id: extensionRequest._id,
        reason: extensionRequest.reason,
        requested_amount: extensionRequest.requested_amount,
        status: extensionRequest.status,
        created_at: extensionRequest.created_at
      }
    });
  } catch (err) {
    console.error('Create extension request error:', err);
    res.status(500).json({ error: 'Failed to submit extension request' });
  }
});

export default router;
