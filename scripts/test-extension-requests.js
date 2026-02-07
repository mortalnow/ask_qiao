#!/usr/bin/env node

/**
 * Test script for extension request workflow
 * Tests both user submission and admin approval/rejection
 *
 * Usage: node scripts/test-extension-requests.js <admin-username> <admin-password>
 */

import dotenv from 'dotenv';
dotenv.config();

const API_BASE = process.env.API_BASE || 'http://localhost:3002/api';

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

async function loginAdmin(username, password) {
  log('\n🔐 Logging in as admin...', 'cyan');

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      log(`❌ Admin login failed: ${data.error}`, 'red');
      return null;
    }

    if (!data.user.isAdmin) {
      log(`❌ User is not an admin!`, 'red');
      return null;
    }

    log(`✅ Logged in as admin: ${data.user.username}`, 'green');
    return data.token;
  } catch (err) {
    log(`❌ Error: ${err.message}`, 'red');
    return null;
  }
}

async function registerTestUser() {
  const username = 'ext_test_' + Date.now();
  const password = 'test_password_123';

  log(`\n📝 Registering test user: ${username}...`, 'cyan');

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      log(`❌ Registration failed: ${data.error}`, 'red');
      return null;
    }

    log(`✅ Registered test user: ${username}`, 'green');
    return { token: data.token, username, password };
  } catch (err) {
    log(`❌ Error: ${err.message}`, 'red');
    return null;
  }
}

async function getUserUsageStatus(token) {
  try {
    const response = await fetch(`${API_BASE}/extension/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (err) {
    return null;
  }
}

async function submitExtensionRequest(token, reason, amount) {
  log(`\n📤 Submitting extension request...`, 'cyan');
  log(`   Reason: "${reason}"`, 'blue');
  log(`   Amount: ${amount || 'Unlimited'}`, 'blue');

  try {
    const response = await fetch(`${API_BASE}/extension/request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason,
        requested_amount: amount
      })
    });

    const data = await response.json();

    if (!response.ok) {
      log(`❌ Request failed: ${data.error}`, 'red');
      return null;
    }

    log(`✅ Request submitted!`, 'green');
    log(`   Request ID: ${data.request.id}`, 'blue');
    return data.request;
  } catch (err) {
    log(`❌ Error: ${err.message}`, 'red');
    return null;
  }
}

async function listExtensionRequests(adminToken, filter = 'pending') {
  log(`\n📋 Listing ${filter} extension requests...`, 'cyan');

  try {
    const response = await fetch(`${API_BASE}/admin/extensions?status=${filter}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      log(`❌ Failed: ${data.error}`, 'red');
      return null;
    }

    log(`✅ Found ${data.requests.length} ${filter} requests`, 'green');
    data.requests.forEach((req, index) => {
      log(`   ${index + 1}. ${req.user.username} - ${req.requested_amount || 'Unlimited'} prompts`, 'blue');
    });

    return data;
  } catch (err) {
    log(`❌ Error: ${err.message}`, 'red');
    return null;
  }
}

async function approveRequest(adminToken, requestId, amount, isUnlimited) {
  log(`\n✅ Approving request ${requestId}...`, 'cyan');
  log(`   Granting: ${isUnlimited ? 'Unlimited' : amount + ' prompts'}`, 'blue');

  try {
    const response = await fetch(`${API_BASE}/admin/extensions/${requestId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        granted_amount: amount,
        grant_unlimited: isUnlimited,
        admin_response: 'Approved via test script'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      log(`❌ Approval failed: ${data.error}`, 'red');
      return false;
    }

    log(`✅ Request approved!`, 'green');
    log(`   User: ${data.user.username}`, 'blue');
    log(`   New limit: ${data.user.is_unlimited ? 'Unlimited' : data.user.usage_limit}`, 'blue');
    return true;
  } catch (err) {
    log(`❌ Error: ${err.message}`, 'red');
    return false;
  }
}

async function rejectRequest(adminToken, requestId, reason) {
  log(`\n❌ Rejecting request ${requestId}...`, 'cyan');

  try {
    const response = await fetch(`${API_BASE}/admin/extensions/${requestId}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        admin_response: reason || 'Rejected via test script'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      log(`❌ Rejection failed: ${data.error}`, 'red');
      return false;
    }

    log(`✅ Request rejected!`, 'green');
    return true;
  } catch (err) {
    log(`❌ Error: ${err.message}`, 'red');
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const adminUsername = args[0];
  const adminPassword = args[1];

  log('\n🧪 Testing Extension Request Workflow\n', 'cyan');

  if (!adminUsername || !adminPassword) {
    log('❌ Please provide admin credentials', 'red');
    log('   Usage: node scripts/test-extension-requests.js <admin-username> <admin-password>', 'yellow');
    process.exit(1);
  }

  // Check if server is running
  try {
    await fetch(`${API_BASE}/auth/register`, { method: 'POST' });
  } catch (err) {
    log('❌ Server is not running! Start it with: npm start', 'red');
    process.exit(1);
  }

  // Step 1: Login as admin
  const adminToken = await loginAdmin(adminUsername, adminPassword);
  if (!adminToken) {
    process.exit(1);
  }

  // Step 2: List current pending requests
  const initialRequests = await listExtensionRequests(adminToken, 'pending');

  // Step 3: Register a test user (open registration)
  const testUser = await registerTestUser();

  if (testUser) {
    // Step 4: Submit an extension request
    const request = await submitExtensionRequest(
      testUser.token,
      'Test request - I need more prompts for testing the extension workflow.',
      10
    );

    if (request) {
      // Step 5: Check user status (should show pending)
      const statusBefore = await getUserUsageStatus(testUser.token);
      log(`\n📊 User status before approval:`, 'cyan');
      log(`   Usage: ${statusBefore.usage.count}/${statusBefore.usage.limit}`, 'blue');
      log(`   Has pending: ${statusBefore.extension.has_pending}`, 'blue');

      // Step 6: List pending requests (should include new one)
      await listExtensionRequests(adminToken, 'pending');

      // Step 7: Approve the request
      const approved = await approveRequest(adminToken, request.id, 10, false);

      if (approved) {
        // Step 8: Check user status after approval
        const statusAfter = await getUserUsageStatus(testUser.token);
        log(`\n📊 User status after approval:`, 'cyan');
        log(`   Usage: ${statusAfter.usage.count}/${statusAfter.usage.limit}`, 'blue');
        log(`   Has pending: ${statusAfter.extension.has_pending}`, 'blue');

        // Verify the limit was increased
        if (statusAfter.usage.limit > statusBefore.usage.limit) {
          log(`\n✅ Usage limit successfully increased from ${statusBefore.usage.limit} to ${statusAfter.usage.limit}!`, 'green');
        } else {
          log(`\n⚠️  Usage limit was not increased as expected`, 'yellow');
        }
      }
    }

    // Step 9: Test rejection flow with another request
    const request2 = await submitExtensionRequest(
      testUser.token,
      'Another test request that will be rejected.',
      5
    );

    if (request2) {
      await rejectRequest(adminToken, request2.id, 'Test rejection - request denied');

      // Check status after rejection
      const statusAfterReject = await getUserUsageStatus(testUser.token);
      log(`\n📊 Last request status: ${statusAfterReject.extension.last_request?.status}`, 'blue');
    }
  }

  // Final summary
  log('\n📊 Test Summary:', 'cyan');
  const finalRequests = await listExtensionRequests(adminToken, 'all');
  if (finalRequests) {
    log(`   Total requests: ${finalRequests.stats.total}`, 'blue');
    log(`   Pending: ${finalRequests.stats.pending}`, 'blue');
    log(`   Approved: ${finalRequests.stats.approved}`, 'blue');
    log(`   Rejected: ${finalRequests.stats.rejected}`, 'blue');
  }

  log('\n✨ Extension request workflow test completed!\n', 'green');
}

main().catch(err => {
  log(`\n❌ Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
