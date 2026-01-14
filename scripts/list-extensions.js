#!/usr/bin/env node

/**
 * List all extension requests from the database
 * Usage: node scripts/list-extensions.js [status]
 *   status: pending, approved, rejected, or all (default: all)
 */

import mongoose from '../server/db/init.js';
import { ExtensionRequest, User } from '../server/db/models.js';

async function run() {
  const args = process.argv.slice(2);
  const filterStatus = args[0] || 'all';

  console.log('\n📋 Extension Requests Report\n');

  try {
    // Wait for connection
    if (mongoose.connection.readyState !== 1) {
      console.log('⏳ Connecting to MongoDB Atlas...');
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);
        mongoose.connection.once('open', () => {
          clearTimeout(timeout);
          resolve();
        });
        mongoose.connection.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }

    console.log('✅ Connected to MongoDB Atlas\n');

    // Build query
    const query = {};
    if (filterStatus !== 'all' && ['pending', 'approved', 'rejected'].includes(filterStatus)) {
      query.status = filterStatus;
    }

    // Get all extension requests with user info
    const requests = await ExtensionRequest.find(query)
      .populate('user', 'username is_admin is_unlimited usage_count usage_limit')
      .sort({ created_at: -1 });

    if (requests.length === 0) {
      console.log(`No ${filterStatus === 'all' ? '' : filterStatus + ' '}extension requests found.`);
      process.exit(0);
    }

    console.log(`${filterStatus === 'all' ? 'All' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Extension Requests:\n`);

    requests.forEach((req, index) => {
      const statusIcon = req.status === 'approved' ? '✅' : req.status === 'rejected' ? '❌' : '⏳';
      const statusText = req.status.toUpperCase();
      const user = req.user;
      
      const usageStatus = user.is_unlimited 
        ? '♾️ Unlimited' 
        : `${user.usage_count || 0}/${user.usage_limit || 5}`;
      
      const requestedText = req.requested_amount ? `${req.requested_amount} prompts` : 'Unlimited';
      const grantedText = req.granted_unlimited ? 'Unlimited' : 
                          req.granted_amount ? `${req.granted_amount} prompts` : '-';

      console.log(`${index + 1}. ${statusIcon} ${statusText} - ${user.username}`);
      console.log(`   ID: ${req._id}`);
      console.log(`   Current Usage: ${usageStatus}`);
      console.log(`   Requested: ${requestedText}`);
      
      if (req.status !== 'pending') {
        console.log(`   Granted: ${grantedText}`);
        if (req.admin_response) {
          console.log(`   Admin Response: "${req.admin_response}"`);
        }
        console.log(`   Resolved: ${new Date(req.resolved_at).toLocaleString()}`);
      }
      
      console.log(`   Reason: "${req.reason}"`);
      console.log(`   Created: ${new Date(req.created_at).toLocaleString()}`);
      console.log('');
    });

    // Summary
    const pending = await ExtensionRequest.countDocuments({ status: 'pending' });
    const approved = await ExtensionRequest.countDocuments({ status: 'approved' });
    const rejected = await ExtensionRequest.countDocuments({ status: 'rejected' });
    const total = pending + approved + rejected;

    console.log('═'.repeat(50));
    console.log('\n📊 Summary:\n');
    console.log(`   Total Requests: ${total}`);
    console.log(`     - ⏳ Pending: ${pending}`);
    console.log(`     - ✅ Approved: ${approved}`);
    console.log(`     - ❌ Rejected: ${rejected}`);
    console.log('');
    
    if (pending > 0) {
      console.log(`💡 ${pending} pending request(s) awaiting admin review.`);
      console.log('   Use the admin panel or test-extension-requests.js to approve/reject.\n');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
