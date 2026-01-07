#!/usr/bin/env node

/**
 * Script to initialize MongoDB Atlas database
 * - Creates required collections with indexes
 * - Creates admin user (mortalnow@gmail.com / 111111)
 * 
 * Usage: 
 *   node scripts/init-mongodb.js
 *   node scripts/init-mongodb.js <cluster-hostname>
 *   MONGODB_CLUSTER=cluster0.xxxxx.mongodb.net node scripts/init-mongodb.js
 * 
 * To find your cluster hostname:
 *   1. Go to MongoDB Atlas dashboard
 *   2. Click "Connect" on your cluster
 *   3. Choose "Connect your application"
 *   4. Copy the connection string - the hostname is between @ and /
 *      Example: mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/dbname
 *      The hostname is: cluster0.xxxxx.mongodb.net
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User, InviteCode } from '../server/db/models.js';

// MongoDB connection details
// You can override these with environment variables or command line argument
const MONGODB_USER = process.env.MONGODB_USER || 'mortalnow';
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD || 'Fuck@atlas';
// Get cluster hostname from command line arg, env var, or use default
const clusterArg = process.argv[2];
const MONGODB_CLUSTER = clusterArg || process.env.MONGODB_CLUSTER || 'ask-qiao.1lvanu7.mongodb.net';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'ask_qiao';

// Build MongoDB URI
const getMongoUri = () => {
  const username = encodeURIComponent(MONGODB_USER);
  const password = encodeURIComponent(MONGODB_PASSWORD);
  let cluster = MONGODB_CLUSTER;
  
  // Handle both formats: "cluster0" or "cluster0.xxxxx.mongodb.net"
  // If it doesn't include .mongodb.net, try appending it
  if (!cluster.includes('.mongodb.net')) {
    cluster = `${cluster}.mongodb.net`;
  }
  
  return `mongodb+srv://${username}:${password}@${cluster}/${MONGODB_DB_NAME}?retryWrites=true&w=majority`;
};

async function main() {
  console.log('\n🚀 Initializing MongoDB Atlas Database...\n');
  
  // Show usage if cluster hostname looks incomplete
  if (!MONGODB_CLUSTER.includes('.mongodb.net') && !clusterArg && !process.env.MONGODB_CLUSTER) {
    console.log('⚠️  Warning: Cluster hostname may be incomplete.');
    console.log('   Expected format: cluster0.xxxxx.mongodb.net');
    console.log('   Current value:', MONGODB_CLUSTER);
    console.log('\n   To provide the full hostname:');
    console.log('   node scripts/init-mongodb.js cluster0.xxxxx.mongodb.net');
    console.log('   or set MONGODB_CLUSTER environment variable\n');
  }
  
  try {
    // Connect to MongoDB
    const uri = getMongoUri();
    console.log(`📡 Connecting to MongoDB Atlas...`);
    console.log(`   User: ${MONGODB_USER}`);
    console.log(`   Cluster: ${MONGODB_CLUSTER}`);
    console.log(`   Database: ${MONGODB_DB_NAME}\n`);
    
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Create indexes for User collection
    console.log('📋 Creating indexes for User collection...');
    await User.collection.createIndex({ username: 1 }, { unique: true });
    console.log('   ✅ Username index created (unique)');

    // Create indexes for InviteCode collection
    console.log('📋 Creating indexes for InviteCode collection...');
    await InviteCode.collection.createIndex({ code: 1 }, { unique: true });
    console.log('   ✅ Code index created (unique)');
    await InviteCode.collection.createIndex({ used_by: 1 });
    console.log('   ✅ Used_by index created\n');

    // Check if admin user already exists
    const adminUsername = 'mortalnow@gmail.com';
    const existingAdmin = await User.findOne({ username: adminUsername });
    
    if (existingAdmin) {
      console.log(`⚠️  Admin user "${adminUsername}" already exists`);
      console.log('   Updating password and admin status...');
      
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash('111111', saltRounds);
      
      // Update admin user
      await User.findByIdAndUpdate(existingAdmin._id, {
        password_hash: passwordHash,
        is_admin: true
      });
      
      console.log(`✅ Admin user updated successfully\n`);
    } else {
      console.log(`👤 Creating admin user...`);
      console.log(`   Username: ${adminUsername}`);
      console.log(`   Password: 111111`);
      
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash('111111', saltRounds);
      
      // Create admin user
      const adminUser = await User.create({
        username: adminUsername,
        password_hash: passwordHash,
        is_admin: true,
        created_at: new Date()
      });
      
      console.log(`✅ Admin user created successfully`);
      console.log(`   User ID: ${adminUser._id}\n`);
    }

    // Display summary
    const userCount = await User.countDocuments();
    const inviteCount = await InviteCode.countDocuments();
    
    console.log('📊 Database Summary:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Invite Codes: ${inviteCount}\n`);

    console.log('✅ MongoDB initialization completed successfully!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during initialization:', error.message);
    
    if (error.code === 'ENOTFOUND' || error.message.includes('getaddrinfo')) {
      console.error('\n💡 How to find your MongoDB Atlas cluster hostname:');
      console.error('   1. Go to https://cloud.mongodb.com/');
      console.error('   2. Select your cluster "ask-qiao"');
      console.error('   3. Click "Connect" button');
      console.error('   4. Choose "Connect your application"');
      console.error('   5. Copy the connection string');
      console.error('   6. Extract the hostname (between @ and /)');
      console.error('      Example: mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/dbname');
      console.error('      Hostname: cluster0.xxxxx.mongodb.net');
      console.error('\n   Then run:');
      console.error('   node scripts/init-mongodb.js cluster0.xxxxx.mongodb.net');
      console.error('   (replace with your actual hostname)\n');
    } else if (error.code === 11000) {
      console.error('\n💡 Tip: A unique index violation occurred. This might mean');
      console.error('   the admin user or indexes already exist.\n');
    }
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

main();

