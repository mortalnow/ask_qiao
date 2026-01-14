#!/usr/bin/env node

/**
 * Grant additional usage or unlimited access to a user
 * Usage: 
 *   node scripts/grant-usage.js <username> <amount>
 *   node scripts/grant-usage.js <username> unlimited
 * 
 * Examples:
 *   node scripts/grant-usage.js john 10        # Grant 10 more prompts
 *   node scripts/grant-usage.js john unlimited # Grant unlimited access
 */

import mongoose from '../server/db/init.js';
import { User } from '../server/db/models.js';

async function run() {
  const args = process.argv.slice(2);
  const username = args[0];
  const amountArg = args[1];

  if (!username || !amountArg) {
    console.log('\n📋 Grant Usage Script\n');
    console.log('Usage:');
    console.log('  node scripts/grant-usage.js <username> <amount>');
    console.log('  node scripts/grant-usage.js <username> unlimited');
    console.log('\nExamples:');
    console.log('  node scripts/grant-usage.js john 10        # Grant 10 more prompts');
    console.log('  node scripts/grant-usage.js john unlimited # Grant unlimited access');
    console.log('');
    process.exit(1);
  }

  const isUnlimited = amountArg.toLowerCase() === 'unlimited';
  const amount = isUnlimited ? null : parseInt(amountArg);

  if (!isUnlimited && (isNaN(amount) || amount < 1)) {
    console.log('\n❌ Invalid amount. Must be a positive number or "unlimited".');
    process.exit(1);
  }

  console.log('\n🎁 Granting usage to user...\n');

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

    // Find user
    const user = await User.findOne({ username: username.trim() });

    if (!user) {
      console.log(`❌ User "${username}" not found!`);
      
      // List all users
      const allUsers = await User.find({}).select('username');
      if (allUsers.length > 0) {
        console.log('\n📋 Available users:');
        allUsers.forEach((u, i) => {
          console.log(`  ${i + 1}. ${u.username}`);
        });
      }
      console.log('');
      process.exit(1);
    }

    // Show current status
    console.log(`📊 Current status for "${user.username}":`);
    console.log(`   Usage: ${user.usage_count || 0}/${user.usage_limit || 5} prompts`);
    console.log(`   Unlimited: ${user.is_unlimited ? 'Yes ♾️' : 'No'}`);

    if (user.is_unlimited && isUnlimited) {
      console.log('\n⚠️  User already has unlimited access!');
      process.exit(0);
    }

    // Apply update
    const updates = {};
    let message = '';

    if (isUnlimited) {
      updates.is_unlimited = true;
      message = `Granted unlimited access to "${user.username}"`;
    } else {
      updates.usage_limit = (user.usage_limit || 5) + amount;
      message = `Granted ${amount} more prompts to "${user.username}" (new limit: ${updates.usage_limit})`;
    }

    await User.findByIdAndUpdate(user._id, updates);

    // Show updated status
    const updatedUser = await User.findById(user._id);
    
    console.log(`\n✅ ${message}`);
    console.log(`\n📊 Updated status:`);
    console.log(`   Usage: ${updatedUser.usage_count || 0}/${updatedUser.usage_limit || 5} prompts`);
    console.log(`   Unlimited: ${updatedUser.is_unlimited ? 'Yes ♾️' : 'No'}`);
    console.log(`   Remaining: ${updatedUser.is_unlimited ? 'N/A' : Math.max(0, updatedUser.usage_limit - updatedUser.usage_count)}`);
    console.log('');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
