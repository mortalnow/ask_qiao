#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

console.log('\n🔑 Checking API Keys Configuration\n');

const openaiKey = process.env.OPENAI_API_KEY;
const googleKey = process.env.GOOGLE_AI_API_KEY;

if (openaiKey) {
	console.log('✅ OPENAI_API_KEY: Found');
	console.log(`   Preview: ${openaiKey.substring(0, 10)}...${openaiKey.substring(openaiKey.length - 4)}`);
} else {
	console.log('❌ OPENAI_API_KEY: Not found in .env');
}

if (googleKey) {
	console.log('✅ GOOGLE_AI_API_KEY: Found');
	console.log(`   Preview: ${googleKey.substring(0, 10)}...${googleKey.substring(googleKey.length - 4)}`);
} else {
	console.log('❌ GOOGLE_AI_API_KEY: Not found in .env');
}

console.log('\n');

