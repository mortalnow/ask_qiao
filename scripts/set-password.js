#!/usr/bin/env node

/**
 * Script to set password for existing users
 * Usage: node scripts/set-password.js <username> <password>
 */

import bcrypt from 'bcrypt';
import db from '../server/db/init.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  const args = process.argv.slice(2);
  
  let username, password;

  if (args.length >= 2) {
    username = args[0];
    password = args[1];
  } else {
    console.log('\n🔐 Set Password for User\n');
    username = await question('Username: ');
    password = await question('Password: ');
  }

  if (!username || !password) {
    console.error('❌ Username and password are required');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('❌ Password must be at least 6 characters');
    process.exit(1);
  }

  try {
    // Find user
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
    
    if (!user) {
      console.error(`❌ User "${username}" not found`);
      process.exit(1);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update user
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, user.id);

    console.log(`\n✅ Password set successfully for user: ${username}\n`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();

