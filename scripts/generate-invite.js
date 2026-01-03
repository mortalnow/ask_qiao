#!/usr/bin/env node

import mongoose from '../server/db/init.js';
import { InviteCode } from '../server/db/models.js';
import { generateInviteCode } from '../server/utils/inviteCode.js';

const args = process.argv.slice(2);
const count = parseInt(args[0]) || 1;

async function run() {
  console.log(`\n🎟️  Generating ${count} invite code(s)...\n`);

  try {
    // Wait for connection
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => {
        mongoose.connection.once('open', resolve);
      });
    }

    const codes = [];

    for (let i = 0; i < count; i++) {
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
        console.error('Failed to generate unique code after 10 attempts');
        process.exit(1);
      }
      
      await InviteCode.create({ code });
      codes.push(code);
      console.log(`  ✅ ${code}`);
    }

    console.log(`\n📋 Generated ${codes.length} invite code(s)`);
    console.log('Share these codes with users to grant access.\n');

    // Show stats
    const total = await InviteCode.countDocuments();
    const used = await InviteCode.countDocuments({ used_by: { $ne: null } });
    const unused = total - used;

    console.log(`📊 Total codes: ${total} (${unused} unused, ${used} used)\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
