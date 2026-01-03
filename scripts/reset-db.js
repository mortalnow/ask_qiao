#!/usr/bin/env node

/**
 * Reset database and create admin user
 */

import bcrypt from 'bcrypt';
import db from '../server/db/init.js';

console.log('\n🗑️  Resetting database...\n');

try {
  // Clear all data
  db.exec(`
    DELETE FROM invite_codes;
    DELETE FROM users;
  `);

  console.log('✅ Cleared all users and invite codes');

  // Create admin user
  const adminUsername = 'mortalnow@gmail.com';
  const adminPassword = '111111';
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

  // Add is_admin column if it doesn't exist
  try {
    db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0;`);
  } catch (err) {
    // Column already exists, ignore
  }

  const result = db.prepare('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)')
    .run(adminUsername, passwordHash, 1);

  console.log(`✅ Created admin user: ${adminUsername}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   User ID: ${result.lastInsertRowid}\n`);

  console.log('🎉 Database reset complete!\n');
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}

