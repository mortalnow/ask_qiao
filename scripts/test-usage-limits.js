#!/usr/bin/env node

/**
 * Test script to verify usage limit enforcement
 * Creates a test user and verifies usage counting works correctly
 *
 * Usage: node scripts/test-usage-limits.js
 */

import dotenv from 'dotenv';
dotenv.config();

const API_BASE = process.env.API_BASE || 'http://localhost:3002/api';
const TEST_USERNAME = 'usage_test_' + Date.now();
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
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function registerUser() {
  log('\n📝 Registering test user...', 'cyan');

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: TEST_USERNAME,
        password: TEST_PASSWORD
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      log(`❌ Registration failed: ${data.error}`, 'red');
      return false;
    }

    authToken = data.token;
    log(`✅ Registered as: ${data.user.username}`, 'green');
    return true;
  } catch (err) {
    log(`❌ Error: ${err.message}`, 'red');
    return false;
  }
}

async function getUsageStatus() {
  try {
    const response = await fetch(`${API_BASE}/extension/status`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!response.ok) {
      const error = await response.json();
      log(`❌ Failed to get usage: ${error.error}`, 'red');
      return null;
    }

    const data = await response.json();
    return data.usage;
  } catch (err) {
    log(`❌ Error: ${err.message}`, 'red');
    return null;
  }
}

async function sendTestMessage(messageNum) {
  const testMessage = `[PERSONA]\nYou are a test bot.\n\n[TASK]\nSay "Test ${messageNum}" in one word.\n\n[CONTEXT]\nThis is test message ${messageNum}.`;

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

    // Check for usage limit exceeded
    if (response.status === 403) {
      const error = await response.json();
      if (error.error === 'usage_limit_exceeded') {
        return { success: false, limitExceeded: true, usage: error };
      }
      return { success: false, limitExceeded: false, error: error.error };
    }

    if (!response.ok) {
      const error = await response.json();
      return { success: false, limitExceeded: false, error: error.error };
    }

    // Read streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let usageInfo = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'done') {
              usageInfo = data.usage;
              break;
            }
          } catch (e) {
            // Skip parse errors
          }
        }
      }
    }

    return { success: true, limitExceeded: false, usage: usageInfo };
  } catch (err) {
    return { success: false, limitExceeded: false, error: err.message };
  }
}

async function testExtensionRequest() {
  log('\n📝 Testing extension request submission...', 'cyan');

  try {
    const response = await fetch(`${API_BASE}/extension/request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: 'This is an automated test request for more prompts.',
        requested_amount: 10
      })
    });

    const data = await response.json();

    if (!response.ok) {
      log(`❌ Extension request failed: ${data.error}`, 'red');
      return false;
    }

    log(`✅ Extension request submitted successfully!`, 'green');
    log(`   Request ID: ${data.request.id}`, 'blue');
    log(`   Requested: ${data.request.requested_amount || 'Unlimited'} prompts`, 'blue');
    return true;
  } catch (err) {
    log(`❌ Error: ${err.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🧪 Testing Usage Limit Enforcement\n', 'cyan');
  log('This test will:', 'blue');
  log('  1. Register a new test user (open registration)', 'blue');
  log('  2. Send messages until hitting the limit', 'blue');
  log('  3. Verify usage counting is accurate', 'blue');
  log('  4. Test extension request submission', 'blue');
  log('');

  // Check if server is running
  try {
    await fetch(`${API_BASE}/auth/register`, { method: 'POST' });
  } catch (err) {
    log('❌ Server is not running! Start it with: npm start', 'red');
    process.exit(1);
  }

  // Step 1: Register
  const registered = await registerUser();
  if (!registered) {
    process.exit(1);
  }

  // Step 2: Check initial usage
  log('\n📊 Checking initial usage status...', 'cyan');
  const initialUsage = await getUsageStatus();
  if (!initialUsage) {
    log('❌ Could not get initial usage status', 'red');
    process.exit(1);
  }

  log(`   Initial usage: ${initialUsage.count}/${initialUsage.limit}`, 'blue');
  log(`   Unlimited: ${initialUsage.is_unlimited ? 'Yes' : 'No'}`, 'blue');

  if (initialUsage.is_unlimited) {
    log('\n⚠️  Test user has unlimited access, cannot test limits', 'yellow');
    process.exit(0);
  }

  const usageLimit = initialUsage.limit;
  let currentUsage = initialUsage.count;
  let testResults = [];

  // Step 3: Send messages until limit is reached
  log(`\n📤 Sending messages until limit (${usageLimit}) is reached...`, 'cyan');

  for (let i = 1; i <= usageLimit + 2; i++) {
    log(`\n   Message ${i}:`, 'magenta');

    const result = await sendTestMessage(i);
    testResults.push(result);

    if (result.limitExceeded) {
      log(`      ⛔ LIMIT EXCEEDED at message ${i}`, 'yellow');
      log(`      Usage: ${result.usage.usage_count}/${result.usage.usage_limit}`, 'blue');
      break;
    } else if (result.success) {
      currentUsage = result.usage?.count || currentUsage + 1;
      log(`      ✅ Success - Usage: ${currentUsage}/${usageLimit}`, 'green');
    } else {
      log(`      ❌ Failed: ${result.error}`, 'red');
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Step 4: Verify final usage
  log('\n📊 Verifying final usage...', 'cyan');
  const finalUsage = await getUsageStatus();

  if (finalUsage) {
    log(`   Final usage: ${finalUsage.count}/${finalUsage.limit}`, 'blue');
    log(`   Remaining: ${finalUsage.remaining}`, 'blue');
  }

  // Step 5: Test extension request
  if (finalUsage && finalUsage.remaining === 0) {
    await testExtensionRequest();
  }

  // Summary
  log('\n📊 Test Summary:', 'cyan');
  const successfulMessages = testResults.filter(r => r.success).length;
  const limitExceededAt = testResults.findIndex(r => r.limitExceeded) + 1;

  log(`   Messages sent successfully: ${successfulMessages}`, 'blue');
  log(`   Expected limit: ${usageLimit}`, 'blue');
  log(`   Limit exceeded at message: ${limitExceededAt || 'N/A'}`, 'blue');

  // Verification
  const limitWorksCorrectly = successfulMessages === usageLimit && limitExceededAt === usageLimit + 1;

  if (limitWorksCorrectly) {
    log(`\n✅ Usage limit enforcement is working correctly!`, 'green');
  } else {
    log(`\n⚠️  Usage limit may not be enforced correctly`, 'yellow');
    log(`   Expected ${usageLimit} successful messages, got ${successfulMessages}`, 'yellow');
  }

  log('\n✨ Usage limit test completed!\n', 'green');
  process.exit(limitWorksCorrectly ? 0 : 1);
}

main().catch(err => {
  log(`\n❌ Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
