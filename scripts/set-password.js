#!/usr/bin/env node

/**
 * Script to set password for existing users (MongoDB version)
 * Usage: node scripts/set-password.js <username> <password>
 */

import bcrypt from 'bcrypt';
import mongoose from '../server/db/init.js';
import { User } from '../server/db/models.js';
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
    // Wait for connection
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => {
        mongoose.connection.once('open', resolve);
      });
    }

    // Find user
    const user = await User.findOne({ username: username.trim() });
    
    if (!user) {
      console.error(`❌ User "${username}" not found`);
      process.exit(1);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update user
    await User.findByIdAndUpdate(user._id, { password_hash: passwordHash });

    console.log(`\n✅ Password set successfully for user: ${username}\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
