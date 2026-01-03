import mongoose from 'mongoose';
import { config } from '../config.js';

// MongoDB connection string
const getMongoUri = () => {
  const username = encodeURIComponent(process.env.MONGODB_USER || 'mortalnow_db_user');
  const password = encodeURIComponent(process.env.MONGODB_PASSWORD || 'KOB7ukeIHwhgGhfF');
  const cluster = process.env.MONGODB_CLUSTER || 'cluster0';
  const dbName = process.env.MONGODB_DB_NAME || 'talk_to_qiao';
  
  // Handle both formats: "cluster0" or "cluster0.xxxxx.mongodb.net"
  const clusterHost = cluster.includes('.mongodb.net') 
    ? cluster 
    : `${cluster}.mongodb.net`;
  
  return `mongodb+srv://${username}:${password}@${clusterHost}/${dbName}?retryWrites=true&w=majority`;
};

let isConnected = false;

// Connect to MongoDB
export const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    const uri = getMongoUri();
    await mongoose.connect(uri);
    isConnected = true;
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Disconnect from MongoDB
export const disconnectDB = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error);
    throw error;
  }
};

// Initialize connection on import
connectDB().catch(console.error);

// Export mongoose connection for scripts that need it
export default mongoose;
