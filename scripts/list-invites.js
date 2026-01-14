#!/usr/bin/env node

/**
 * List all invite codes with usage details
 * Shows which users used which codes and their usage stats
 */

import mongoose from '../server/db/init.js';
import { User, InviteCode } from '../server/db/models.js';

async function run() {
  console.log('\n🎟️  Invite Code Usage Report\n');

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

    // Get all invite codes with user info
    const codes = await InviteCode.find()
      .populate('used_by', 'username is_admin is_unlimited usage_count usage_limit created_at')
      .sort({ created_at: -1 });

    if (codes.length === 0) {
      console.log('No invite codes found.');
      process.exit(0);
    }

    console.log('All Invite Codes:\n');

    codes.forEach((ic, index) => {
      const status = ic.used_by ? '✅ USED' : '⏳ UNUSED';
      const usedBy = ic.used_by ? `by ${ic.used_by.username}` : '';
      const usedAt = ic.used_at ? new Date(ic.used_at).toLocaleString() : '';
      
      console.log(`${index + 1}. ${ic.code} - ${status} ${usedBy}`);
      
      if (ic.used_by) {
        const user = ic.used_by;
        const adminBadge = user.is_admin ? ' 👑 ADMIN' : '';
        const usageStatus = user.is_unlimited 
          ? '♾️  Unlimited' 
          : `${user.usage_count || 0}/${user.usage_limit || 5} prompts`;
        
        console.log(`   User Info:${adminBadge}`);
        console.log(`   - Created: ${new Date(user.created_at).toLocaleString()}`);
        console.log(`   - Usage: ${usageStatus}`);
        console.log(`   Code used at: ${usedAt}`);
      }
      console.log(`   Code created: ${new Date(ic.created_at).toLocaleString()}`);
      console.log('');
    });

    // Summary
    const total = await InviteCode.countDocuments();
    const used = await InviteCode.countDocuments({ used_by: { $ne: null } });
    const unused = total - used;

    // Get user stats
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ is_admin: true });
    const unlimitedUsers = await User.countDocuments({ is_unlimited: true });
    const usersAtLimit = await User.countDocuments({
      is_unlimited: { $ne: true },
      $expr: { $gte: ['$usage_count', '$usage_limit'] }
    });

    console.log('═'.repeat(50));
    console.log('\n📊 Summary:\n');
    console.log(`   Invite Codes: ${total} total (${unused} unused, ${used} used)`);
    console.log(`   Users: ${totalUsers} total`);
    console.log(`     - Admins: ${adminUsers}`);
    console.log(`     - Unlimited: ${unlimitedUsers}`);
    console.log(`     - At usage limit: ${usersAtLimit}`);
    console.log('');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
