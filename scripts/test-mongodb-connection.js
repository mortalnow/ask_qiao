#!/usr/bin/env node

/**
 * Test MongoDB Atlas connection
 * Usage: node scripts/test-mongodb-connection.js
 */

import mongoose from '../server/db/init.js';
import { User, InviteCode } from '../server/db/models.js';

async function testConnection() {
  console.log('\n🔍 Testing MongoDB Atlas Connection...\n');

  // Show connection details (without password)
  const username = process.env.MONGODB_USER || 'mortalnow_db_user';
  const cluster = process.env.MONGODB_CLUSTER || 'cluster0';
  const dbName = process.env.MONGODB_DB_NAME || 'talk_to_qiao';
  
  console.log('📡 Connection Configuration:');
  console.log(`   Username: ${username}`);
  console.log(`   Cluster: ${cluster}`);
  console.log(`   Database: ${dbName}`);
  
  const clusterHost = cluster.includes('.mongodb.net') 
    ? cluster 
    : `${cluster}.mongodb.net`;
  console.log(`   Full Host: ${clusterHost}`);
  console.log(`   Connection String: mongodb+srv://${username}:***@${clusterHost}/${dbName}\n`);

  try {
    console.log('⏳ Attempting to connect...\n');
    
    // Wait for connection with timeout
    await Promise.race([
      new Promise((resolve) => {
        if (mongoose.connection.readyState === 1) {
          resolve();
        } else {
          mongoose.connection.once('open', resolve);
        }
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 15 seconds')), 15000);
      })
    ]);

    console.log('✅ Successfully connected to MongoDB Atlas!\n');

    // Test queries
    console.log('📊 Testing database queries...\n');
    
    const userCount = await User.countDocuments();
    const inviteCount = await InviteCode.countDocuments();
    
    console.log(`   Users in database: ${userCount}`);
    console.log(`   Invite codes in database: ${inviteCount}\n`);

    if (userCount > 0) {
      console.log('👥 Users:');
      const users = await User.find({}).select('username is_admin created_at').limit(10);
      users.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.username} ${user.is_admin ? '👑 ADMIN' : '👤 USER'}`);
      });
      console.log('');
    }

    console.log('✅ All tests passed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed!\n');
    console.error('Error details:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}\n`);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      console.error('💡 Troubleshooting:');
      console.error('   1. Check your MONGODB_CLUSTER environment variable');
      console.error('   2. It should be the full cluster address like: cluster0.xxxxx.mongodb.net');
      console.error('   3. Or just the cluster name if it\'s "cluster0"');
      console.error('   4. Get the correct address from MongoDB Atlas dashboard > Connect > Connect your application\n');
    } else if (error.message.includes('authentication')) {
      console.error('💡 Troubleshooting:');
      console.error('   1. Check your MONGODB_USER and MONGODB_PASSWORD');
      console.error('   2. Verify the user has access to the database\n');
    }
    
    process.exit(1);
  }
}

testConnection();

