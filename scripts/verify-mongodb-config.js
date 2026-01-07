#!/usr/bin/env node

/**
 * Script to verify MongoDB Atlas connection configuration
 * Shows what connection string will be used based on environment variables
 */

import { config } from '../server/config.js';

function getMongoUri() {
  const username = encodeURIComponent(process.env.MONGODB_USER || 'mortalnow_db_user');
  const password = encodeURIComponent(process.env.MONGODB_PASSWORD || 'KOB7ukeIHwhgGhfF');
  const cluster = process.env.MONGODB_CLUSTER || 'cluster0';
  const dbName = process.env.MONGODB_DB_NAME || 'ask_qiao';
  
  // Handle both formats: "cluster0" or "cluster0.xxxxx.mongodb.net"
  const clusterHost = cluster.includes('.mongodb.net') 
    ? cluster 
    : `${cluster}.mongodb.net`;
  
  return {
    uri: `mongodb+srv://${username}:***@${clusterHost}/${dbName}?retryWrites=true&w=majority`,
    username,
    password: '***',
    cluster: clusterHost,
    dbName
  };
}

console.log('\n🔍 MongoDB Atlas Connection Configuration\n');
console.log('Environment Variables:');
console.log(`  MONGODB_USER: ${process.env.MONGODB_USER || 'mortalnow_db_user (default)'}`);
console.log(`  MONGODB_PASSWORD: ${process.env.MONGODB_PASSWORD ? '*** (set)' : 'KOB7ukeIHwhgGhfF (default)'}`);
console.log(`  MONGODB_CLUSTER: ${process.env.MONGODB_CLUSTER || 'cluster0 (default)'}`);
console.log(`  MONGODB_DB_NAME: ${process.env.MONGODB_DB_NAME || 'ask_qiao (default)'}`);

const connInfo = getMongoUri();
console.log('\n📡 Connection Details:');
console.log(`  Cluster: ${connInfo.cluster}`);
console.log(`  Database: ${connInfo.dbName}`);
console.log(`  Username: ${connInfo.username}`);
console.log(`  Connection String: ${connInfo.uri}\n`);

console.log('💡 Note:');
console.log('  - If your cluster is "ask-qiao", set MONGODB_CLUSTER=ask-qiao.mongodb.net');
console.log('  - Or if it\'s just "ask-qiao", the code will append ".mongodb.net"');
console.log('  - Make sure these environment variables are set in Vercel dashboard\n');

