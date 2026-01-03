#!/usr/bin/env node

/**
 * Test script to verify ChatGPT and Gemini integrations
 */

import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:3001/api';
// Get invite code from command line or use default
const TEST_INVITE_CODE = process.argv[2] || '7V4LV9-QGG6CZ';
const TEST_USERNAME = 'test_user_' + Date.now();

let authToken = null;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verifyInviteCode() {
  log('\n🔐 Step 1: Verifying invite code...', 'cyan');
  
  try {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: TEST_INVITE_CODE,
        username: TEST_USERNAME
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      log(`❌ Failed: ${data.error}`, 'red');
      return false;
    }

    authToken = data.token;
    log(`✅ Authenticated as: ${data.user.username}`, 'green');
    return true;
  } catch (err) {
    log(`❌ Error: ${err.message}`, 'red');
    return false;
  }
}

async function getModels() {
  log('\n📋 Step 2: Fetching available models...', 'cyan');
  
  try {
    const response = await fetch(`${API_BASE}/chat/models`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      log(`❌ Failed: ${data.error}`, 'red');
      return false;
    }

    log(`✅ Available models:`, 'green');
    data.models.forEach(model => {
      log(`   - ${model.name} (${model.id})`, 'blue');
    });
    return true;
  } catch (err) {
    log(`❌ Error: ${err.message}`, 'red');
    return false;
  }
}

async function testChatGPT() {
  log('\n🤖 Step 3: Testing ChatGPT...', 'cyan');
  
  const testMessage = 'Say "Hello from ChatGPT" in exactly 5 words.';
  log(`📤 Sending: "${testMessage}"`, 'yellow');

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: testMessage,
        model: 'chatgpt',
        history: []
      })
    });

    if (!response.ok) {
      const error = await response.json();
      log(`❌ Failed: ${error.error}`, 'red');
      return false;
    }

    // Read streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    log(`📥 Response: `, 'green');
    process.stdout.write(colors.green);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'chunk') {
              process.stdout.write(data.content);
              fullResponse += data.content;
            } else if (data.type === 'done') {
              break;
            } else if (data.type === 'error') {
              log(`\n❌ Error: ${data.message}`, 'red');
              return false;
            }
          } catch (e) {
            // Skip parse errors
          }
        }
      }
    }

    process.stdout.write(colors.reset + '\n');
    log(`✅ ChatGPT test completed!`, 'green');
    return true;
  } catch (err) {
    log(`❌ Error: ${err.message}`, 'red');
    return false;
  }
}

async function testGemini() {
  log('\n🤖 Step 4: Testing Gemini...', 'cyan');
  
  const testMessage = 'Say "Hello from Gemini" in exactly 5 words.';
  log(`📤 Sending: "${testMessage}"`, 'yellow');

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: testMessage,
        model: 'gemini',
        history: []
      })
    });

    if (!response.ok) {
      const error = await response.json();
      log(`❌ Failed: ${error.error}`, 'red');
      return false;
    }

    // Read streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    log(`📥 Response: `, 'green');
    process.stdout.write(colors.green);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'chunk') {
              process.stdout.write(data.content);
              fullResponse += data.content;
            } else if (data.type === 'done') {
              break;
            } else if (data.type === 'error') {
              log(`\n❌ Error: ${data.message}`, 'red');
              return false;
            }
          } catch (e) {
            // Skip parse errors
          }
        }
      }
    }

    process.stdout.write(colors.reset + '\n');
    log(`✅ Gemini test completed!`, 'green');
    return true;
  } catch (err) {
    log(`❌ Error: ${err.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🧪 Testing AI Chat Wrapper Integrations\n', 'cyan');
  
  // Check if server is running
  try {
    await fetch(`${API_BASE}/auth/verify`, { method: 'POST' });
  } catch (err) {
    log('❌ Server is not running! Start it with: npm start', 'red');
    process.exit(1);
  }

  // Run tests
  const steps = [
    verifyInviteCode,
    getModels,
    testChatGPT,
    testGemini
  ];

  for (const step of steps) {
    const success = await step();
    if (!success && step === verifyInviteCode) {
      log('\n❌ Authentication failed. Cannot continue.', 'red');
      process.exit(1);
    }
    // Continue even if one test fails
  }

  log('\n✨ All tests completed!\n', 'green');
}

main().catch(err => {
  log(`\n❌ Fatal error: ${err.message}`, 'red');
  process.exit(1);
});

