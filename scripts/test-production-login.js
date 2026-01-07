#!/usr/bin/env node

/**
 * Script to test login against production API
 * Usage: node scripts/test-production-login.js [username] [password]
 */

const PRODUCTION_URL = 'https://ask-qiao.vercel.app';

async function testLogin(username, password) {
  console.log('\n🔍 Testing production login...\n');
  console.log(`URL: ${PRODUCTION_URL}`);
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}\n`);

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}\n`);

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.log('Response body (not JSON):');
      console.log(text);
      return;
    }

    if (response.ok) {
      console.log('✅ Login successful!');
      console.log(`Token: ${data.token ? data.token.substring(0, 20) + '...' : 'N/A'}`);
      console.log(`User:`, JSON.stringify(data.user, null, 2));
    } else {
      console.log('❌ Login failed!');
      console.log(`Error: ${data.error || 'Unknown error'}`);
      console.log(`Full response:`, JSON.stringify(data, null, 2));
    }

    console.log('');
  } catch (err) {
    console.error('❌ Request failed:', err.message);
    console.error(err);
  }
}

const args = process.argv.slice(2);
const username = args[0] || 'mortalnow@gmail.com';
const password = args[1] || '111111';

testLogin(username, password);

