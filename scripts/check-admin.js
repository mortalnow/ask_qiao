#!/usr/bin/env node

/**
 * Script to check and create admin account in MongoDB Atlas
 * Admin accounts automatically get unlimited usage
 * Usage: node scripts/check-admin.js [username] [password]
 */

import bcrypt from 'bcrypt';
import mongoose from '../server/db/init.js';
import { User } from '../server/db/models.js';

async function main() {
  const args = process.argv.slice(2);
  const targetUsername = args[0] || 'mortalnow';
  const password = args[1] || '111111';

  console.log('\n🔍 Checking MongoDB Atlas for admin account...\n');

  try {
    // Show connection info
    const mongoUser = process.env.MONGODB_USER || 'mortalnow_db_user';
    const cluster = process.env.MONGODB_CLUSTER || 'cluster0';
    const dbName = process.env.MONGODB_DB_NAME || 'ask_qiao';
    console.log(`📡 Connection info:`);
    console.log(`   User: ${mongoUser}`);
    console.log(`   Cluster: ${cluster}`);
    console.log(`   Database: ${dbName}`);
    console.log(`   Full cluster address: ${cluster.includes('.mongodb.net') ? cluster : cluster + '.mongodb.net'}\n`);

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

    // List all users
    const allUsers = await User.find({}).select('username is_admin is_unlimited usage_count usage_limit created_at password_hash');
    console.log(`📊 Total users in database: ${allUsers.length}\n`);

    if (allUsers.length > 0) {
      console.log('👥 Existing users:');
      allUsers.forEach((user, index) => {
        const hasPassword = user.password_hash ? '✅' : '❌';
        const adminStatus = user.is_admin ? '👑 ADMIN' : '👤 USER';
        const unlimitedStatus = user.is_unlimited ? '♾️' : `${user.usage_count || 0}/${user.usage_limit || 5}`;
        console.log(`  ${index + 1}. ${user.username} ${hasPassword} Password ${adminStatus} ${unlimitedStatus}`);
        console.log(`     Created: ${user.created_at}`);
        console.log(`     ID: ${user._id}`);
        console.log('');
      });
    }

    // Check if the specified user exists
    const user = await User.findOne({ username: targetUsername.trim() });

    if (user) {
      console.log(`\n✅ User "${targetUsername}" found!\n`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Admin: ${user.is_admin ? 'Yes 👑' : 'No'}`);
      console.log(`   Unlimited: ${user.is_unlimited ? 'Yes ♾️' : 'No'}`);
      console.log(`   Usage: ${user.usage_count || 0}/${user.usage_limit || 5}`);
      console.log(`   Has Password: ${user.password_hash ? 'Yes ✅' : 'No ❌'}`);

      // Check password if password_hash exists
      if (user.password_hash) {
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        console.log(`   Password Match: ${passwordMatch ? 'Yes ✅' : 'No ❌'}`);
      }

      // Update to admin and unlimited if not already
      const updates = {};
      
      if (!user.is_admin) {
        updates.is_admin = true;
        console.log(`\n⚠️  User is not an admin. Will update to admin...`);
      }
      
      if (!user.is_unlimited) {
        updates.is_unlimited = true;
        console.log(`⚠️  User does not have unlimited usage. Will grant unlimited...`);
      }

      // Update password if needed
      let needsPasswordUpdate = false;
      if (!user.password_hash) {
        needsPasswordUpdate = true;
      } else if (!(await bcrypt.compare(password, user.password_hash))) {
        needsPasswordUpdate = true;
      }

      if (needsPasswordUpdate) {
        console.log(`🔐 Will update password...`);
        const saltRounds = 10;
        updates.password_hash = await bcrypt.hash(password, saltRounds);
      }

      if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(user._id, updates);
        console.log(`\n✅ Updates applied:`);
        if (updates.is_admin) console.log(`   - Made admin`);
        if (updates.is_unlimited) console.log(`   - Granted unlimited usage`);
        if (updates.password_hash) console.log(`   - Password updated`);
      } else {
        console.log(`\n✅ User is already correctly configured as admin with unlimited access.`);
      }
    } else {
      console.log(`\n❌ User "${targetUsername}" not found. Creating admin account...\n`);

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create admin user with unlimited access
      const newUser = await User.create({
        username: targetUsername.trim(),
        password_hash: passwordHash,
        is_admin: true,
        is_unlimited: true,  // Admin users get unlimited access
        usage_count: 0,
        usage_limit: 5  // Default limit (not used since is_unlimited is true)
      });

      console.log(`✅ Admin account created successfully!`);
      console.log(`   Username: ${newUser.username}`);
      console.log(`   ID: ${newUser._id}`);
      console.log(`   Admin: Yes 👑`);
      console.log(`   Unlimited: Yes ♾️`);
    }

    console.log('\n✅ Done!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

main();
