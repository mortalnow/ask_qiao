#!/usr/bin/env node

/**
 * Reset database and create admin user for MongoDB
 */

import bcrypt from 'bcrypt';
import mongoose from '../server/db/init.js';
import { User, InviteCode } from '../server/db/models.js';

async function resetDB() {
  console.log('\n🗑️  Resetting MongoDB database...\n');

  try {
    // Wait for connection
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => {
        mongoose.connection.once('open', resolve);
      });
    }

    // Clear all data
    await User.deleteMany({});
    await InviteCode.deleteMany({});

    console.log('✅ Cleared all users and invite codes');

    // Create admin user
    const adminUsername = 'mortalnow@gmail.com';
    const adminPassword = '111111';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    const admin = await User.create({
      username: adminUsername,
      password_hash: passwordHash,
      is_admin: true
    });

    console.log(`✅ Created admin user: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   User ID: ${admin._id}\n`);

    console.log('🎉 Database reset complete!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

resetDB();
