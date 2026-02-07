#!/usr/bin/env node

/**
 * Test script to verify ChatGPT integration
 * Now includes usage tracking verification
 */

import dotenv from 'dotenv';
dotenv.config();

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';
// Get invite code from command line or use default
const TEST_INVITE_CODE = process.argv[2] || '7V4LV9-QGG6CZ';
const TEST_USERNAME = 'test_user_' + Date.now();
const TEST_PASSWORD = 'test_password_123';

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
        username: TEST_USERNAME,
        password: TEST_PASSWORD
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

async function checkUsageStatus() {
  log('\n📊 Step 3: Checking usage status...', 'cyan');
  
  try {
    const response = await fetch(`${API_BASE}/extension/status`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      log(`❌ Failed: ${data.error}`, 'red');
      return null;
    }

    const { usage } = data;
    log(`✅ Usage Status:`, 'green');
    log(`   - Used: ${usage.count}/${usage.limit} prompts`, 'blue');
    log(`   - Remaining: ${usage.remaining}`, 'blue');
    log(`   - Unlimited: ${usage.is_unlimited ? 'Yes' : 'No'}`, 'blue');
    
    return usage;
  } catch (err) {
    log(`❌ Error: ${err.message}`, 'red');
    return null;
  }
}

async function testChatWithUsage(model, modelName) {
  log(`\n🤖 Testing ${modelName}...`, 'cyan');
  
  const testMessage = `[PERSONA]\nYou are a helpful assistant.\n\n[TASK]\nSay "Hello from ${modelName}" in exactly 5 words.\n\n[CONTEXT]\nThis is a test message.`;
  log(`📤 Sending structured prompt to ${modelName}...`, 'yellow');

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: testMessage,
        model: model,
        history: []
      })
    });

    // Check for usage limit exceeded
    if (response.status === 403) {
      const error = await response.json();
      if (error.error === 'usage_limit_exceeded') {
        log(`⚠️  Usage limit exceeded! Used: ${error.usage_count}/${error.usage_limit}`, 'yellow');
        return { success: false, limitExceeded: true };
      }
      log(`❌ Failed: ${error.error}`, 'red');
      return { success: false, limitExceeded: false };
    }

    if (!response.ok) {
      const error = await response.json();
      log(`❌ Failed: ${error.error}`, 'red');
      return { success: false, limitExceeded: false };
    }

    // Read streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let usageInfo = null;

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
              usageInfo = data.usage;
              break;
            } else if (data.type === 'error') {
              log(`\n❌ Error: ${data.message}`, 'red');
              return { success: false, limitExceeded: false };
            }
          } catch (e) {
            // Skip parse errors
          }
        }
      }
    }

    process.stdout.write(colors.reset + '\n');
    
    if (usageInfo) {
      log(`📊 Usage after request: ${usageInfo.count}/${usageInfo.limit}`, 'blue');
    }
    
    log(`✅ ${modelName} test completed!`, 'green');
    return { success: true, limitExceeded: false, usage: usageInfo };
  } catch (err) {
    log(`❌ Error: ${err.message}`, 'red');
    return { success: false, limitExceeded: false };
  }
}

async function main() {
  log('\n🧪 Testing AI Chat Wrapper Integrations\n', 'cyan');
  log('This test now includes usage tracking verification.\n', 'blue');
  
  // Check if server is running
  try {
    await fetch(`${API_BASE}/auth/verify`, { method: 'POST' });
  } catch (err) {
    log('❌ Server is not running! Start it with: npm start', 'red');
    process.exit(1);
  }

  // Step 1: Authenticate
  const authSuccess = await verifyInviteCode();
  if (!authSuccess) {
    log('\n❌ Authentication failed. Cannot continue.', 'red');
    log('💡 Make sure you have a valid unused invite code.', 'yellow');
    log(`   Usage: node scripts/test-ai.js <INVITE_CODE>`, 'yellow');
    process.exit(1);
  }

  // Step 2: Get models
  await getModels();

  // Step 3: Check initial usage
  const initialUsage = await checkUsageStatus();
  if (!initialUsage) {
    log('⚠️  Could not get usage status, continuing anyway...', 'yellow');
  }

  // Step 4: Test ChatGPT
  const chatGptResult = await testChatWithUsage('chatgpt', 'ChatGPT');

  // Step 5: Check final usage
  const finalUsage = await checkUsageStatus();

  // Summary
  log('\n📊 Test Summary:', 'cyan');
  log(`   ChatGPT: ${chatGptResult.success ? '✅ PASSED' : (chatGptResult.limitExceeded ? '⚠️  LIMIT EXCEEDED' : '❌ FAILED')}`, chatGptResult.success ? 'green' : 'yellow');
  
  if (finalUsage) {
    log(`\n📊 Usage Summary:`, 'cyan');
    log(`   Started at: ${initialUsage?.count || 0}/${initialUsage?.limit || 5}`, 'blue');
    log(`   Ended at:   ${finalUsage.count}/${finalUsage.limit}`, 'blue');
    log(`   Remaining:  ${finalUsage.remaining}`, 'blue');
  }

  log('\n✨ All tests completed!\n', 'green');
}

main().catch(err => {
  log(`\n❌ Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
