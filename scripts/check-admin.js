#!/usr/bin/env node

/**
 * Script to check and create admin account in MongoDB Atlas
 * Usage: node scripts/check-admin.js [username] [password]
 */

import bcrypt from 'bcrypt';
import mongoose from '../server/db/init.js';
import { User } from '../server/db/models.js';

async function main() {
  const args = process.argv.slice(2);
  const username = args[0] || 'mortalnow';
  const password = args[1] || '111111';

  console.log('\n🔍 Checking MongoDB Atlas for admin account...\n');

  try {
    // Show connection info
    const username = process.env.MONGODB_USER || 'mortalnow_db_user';
    const cluster = process.env.MONGODB_CLUSTER || 'cluster0';
    const dbName = process.env.MONGODB_DB_NAME || 'ask_qiao';
    console.log(`📡 Connection info:`);
    console.log(`   User: ${username}`);
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
    const allUsers = await User.find({}).select('username is_admin created_at password_hash');
    console.log(`📊 Total users in database: ${allUsers.length}\n`);

    if (allUsers.length > 0) {
      console.log('👥 Existing users:');
      allUsers.forEach((user, index) => {
        const hasPassword = user.password_hash ? '✅' : '❌';
        const adminStatus = user.is_admin ? '👑 ADMIN' : '👤 USER';
        console.log(`  ${index + 1}. ${user.username} ${hasPassword} Password ${adminStatus}`);
        console.log(`     Created: ${user.created_at}`);
        console.log(`     ID: ${user._id}`);
        console.log('');
      });
    }

    // Check if the specified user exists
    const user = await User.findOne({ username: username.trim() });

    if (user) {
      console.log(`\n✅ User "${username}" found!\n`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Admin: ${user.is_admin ? 'Yes 👑' : 'No'}`);
      console.log(`   Has Password: ${user.password_hash ? 'Yes ✅' : 'No ❌'}`);

      // Check password if password_hash exists
      if (user.password_hash) {
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        console.log(`   Password Match: ${passwordMatch ? 'Yes ✅' : 'No ❌'}`);
      }

      // Update to admin if not already
      if (!user.is_admin) {
        console.log(`\n⚠️  User is not an admin. Updating to admin...`);
        await User.findByIdAndUpdate(user._id, { is_admin: true });
        console.log(`✅ User "${username}" is now an admin!`);
      }

      // Update password if needed
      if (!user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
        console.log(`\n🔐 Updating password...`);
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        await User.findByIdAndUpdate(user._id, { password_hash: passwordHash });
        console.log(`✅ Password updated for user "${username}"`);
      }
    } else {
      console.log(`\n❌ User "${username}" not found. Creating admin account...\n`);

      // Check if username is taken
      const existingUser = await User.findOne({ username: username.trim() });
      if (existingUser) {
        console.error(`❌ Username "${username}" is already taken`);
        process.exit(1);
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create admin user
      const newUser = await User.create({
        username: username.trim(),
        password_hash: passwordHash,
        is_admin: true
      });

      console.log(`✅ Admin account created successfully!`);
      console.log(`   Username: ${newUser.username}`);
      console.log(`   ID: ${newUser._id}`);
      console.log(`   Admin: Yes 👑`);
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

