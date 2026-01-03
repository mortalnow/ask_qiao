#!/usr/bin/env node

import mongoose from '../server/db/init.js';
import { User, InviteCode } from '../server/db/models.js';

async function run() {
  console.log('\n🎟️  Invite Code Usage Report\n');

  try {
    // Wait for connection
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => {
        mongoose.connection.once('open', resolve);
      });
    }

    // Get all invite codes with user info
    const codes = await InviteCode.find()
      .populate('used_by', 'username created_at')
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
        console.log(`   User created: ${new Date(ic.used_by.created_at).toLocaleString()}`);
        console.log(`   Code used at: ${usedAt}`);
      }
      console.log(`   Code created: ${new Date(ic.created_at).toLocaleString()}`);
      console.log('');
    });

    // Summary
    const total = await InviteCode.countDocuments();
    const used = await InviteCode.countDocuments({ used_by: { $ne: null } });
    const unused = total - used;

    console.log(`📊 Summary: ${total} total codes (${unused} unused, ${used} used)\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
