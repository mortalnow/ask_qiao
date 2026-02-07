import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3002,
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  openaiApiKey: process.env.OPENAI_API_KEY,
  mongodbCluster: process.env.MONGODB_CLUSTER || 'cluster0',
  mongodbDbName: process.env.MONGODB_DB_NAME || 'ask_qiao',
  
  // Model configuration (ChatGPT-only)
  openaiModel: process.env.OPENAI_MODEL || 'gpt-5.2',
};
