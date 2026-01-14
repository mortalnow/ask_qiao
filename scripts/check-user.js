#!/usr/bin/env node

/**
 * Script to check if a user exists, verify login credentials, and show usage stats
 * Usage: node scripts/check-user.js [username] [password]
 */

import bcrypt from 'bcrypt';
import mongoose from '../server/db/init.js';
import { User, ExtensionRequest } from '../server/db/models.js';

async function main() {
  const args = process.argv.slice(2);
  const username = args[0] || 'mortalnow@gmail.com';
  const password = args[1] || '111111';

  console.log('\n🔍 Checking user login credentials and usage stats...\n');
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}\n`);

  try {
    // Wait for connection
    if (mongoose.connection.readyState !== 1) {
      console.log('⏳ Connecting to MongoDB Atlas...');
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout. Please check your MongoDB Atlas cluster address.'));
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

    // List all users with usage info
    const allUsers = await User.find({}).select('username is_admin usage_count usage_limit is_unlimited created_at password_hash');
    console.log(`📊 Total users in database: ${allUsers.length}\n`);

    if (allUsers.length > 0) {
      console.log('👥 All users in database:');
      allUsers.forEach((user, index) => {
        const hasPassword = user.password_hash ? '✅' : '❌';
        const adminStatus = user.is_admin ? '👑 ADMIN' : '👤 USER';
        const usageStatus = user.is_unlimited ? '♾️  Unlimited' : `${user.usage_count || 0}/${user.usage_limit || 5}`;
        
        console.log(`  ${index + 1}. Username: "${user.username}"`);
        console.log(`     Has Password: ${hasPassword}`);
        console.log(`     Status: ${adminStatus}`);
        console.log(`     Usage: ${usageStatus} prompts`);
        console.log(`     Created: ${user.created_at}`);
        console.log(`     ID: ${user._id}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No users found in database!\n');
    }

    // Try exact match first
    let user = await User.findOne({ username: username.trim() });
    
    if (!user) {
      // Try case-insensitive search
      const allUsersList = await User.find({});
      user = allUsersList.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    }

    if (!user) {
      console.log(`\n❌ User "${username}" not found!\n`);
      console.log('💡 Possible issues:');
      console.log('   1. The username might be different (check list above)');
      console.log('   2. The user might not exist in the database');
      console.log('   3. You might need to register with an invite code first\n');
      
      // Suggest similar usernames
      if (allUsers.length > 0) {
        const searchTerm = username.toLowerCase();
        const suggestions = allUsers.filter(u => 
          u.username.toLowerCase().includes(searchTerm) || 
          searchTerm.includes(u.username.toLowerCase())
        );
        if (suggestions.length > 0) {
          console.log('🔍 Similar usernames found:');
          suggestions.forEach(u => {
            console.log(`   - "${u.username}"`);
          });
          console.log('');
        }
      }
      
      process.exit(1);
    }

    console.log(`\n✅ User "${user.username}" found!\n`);
    console.log(`   ID: ${user._id}`);
    console.log(`   Admin: ${user.is_admin ? 'Yes 👑' : 'No'}`);
    console.log(`   Has Password: ${user.password_hash ? 'Yes ✅' : 'No ❌'}`);
    console.log('');
    console.log('   📊 Usage Stats:');
    console.log(`      Unlimited: ${user.is_unlimited ? 'Yes ♾️' : 'No'}`);
    console.log(`      Usage Count: ${user.usage_count || 0}`);
    console.log(`      Usage Limit: ${user.usage_limit || 5}`);
    console.log(`      Remaining: ${user.is_unlimited ? 'N/A' : Math.max(0, (user.usage_limit || 5) - (user.usage_count || 0))}`);

    // Check for pending extension requests
    const pendingRequest = await ExtensionRequest.findOne({
      user: user._id,
      status: 'pending'
    });

    if (pendingRequest) {
      console.log('');
      console.log('   ⏳ Pending Extension Request:');
      console.log(`      Requested: ${pendingRequest.requested_amount || 'Unlimited'} prompts`);
      console.log(`      Reason: "${pendingRequest.reason}"`);
      console.log(`      Created: ${pendingRequest.created_at}`);
    }

    // Check recent extension requests
    const recentRequests = await ExtensionRequest.find({ user: user._id })
      .sort({ created_at: -1 })
      .limit(3);

    if (recentRequests.length > 0) {
      console.log('');
      console.log('   📜 Recent Extension Requests:');
      recentRequests.forEach((req, index) => {
        const statusIcon = req.status === 'approved' ? '✅' : req.status === 'rejected' ? '❌' : '⏳';
        const amount = req.granted_unlimited ? 'Unlimited' : 
                       req.granted_amount ? `${req.granted_amount} prompts` :
                       req.requested_amount ? `${req.requested_amount} prompts` : 'Unlimited';
        console.log(`      ${index + 1}. ${statusIcon} ${req.status.toUpperCase()} - ${amount}`);
      });
    }

    if (!user.password_hash) {
      console.log(`\n❌ User account has no password set!`);
      console.log(`   This account needs to be set up with an invite code.`);
      console.log(`   Or you can set a password using: node scripts/set-password.js "${user.username}" "${password}"\n`);
      process.exit(1);
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    console.log(`\n   Password Match: ${passwordMatch ? 'Yes ✅' : 'No ❌'}`);

    if (!passwordMatch) {
      console.log(`\n❌ Password does not match!`);
      console.log(`   The password you entered is incorrect.`);
      console.log(`   If you forgot your password, you may need to reset it.\n`);
      process.exit(1);
    }

    console.log(`\n✅ Login credentials are valid!`);
    console.log(`   You should be able to login with:`);
    console.log(`   Username: "${user.username}"`);
    console.log(`   Password: "${password}"\n`);

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

main();
