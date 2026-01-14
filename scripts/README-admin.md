# Admin & Testing Scripts Guide

## Overview

This directory contains scripts for managing the Ask Qiao application, including user management, testing, and usage/extension management.

## Quick Reference

| Script | Purpose |
|--------|---------|
| `check-admin.js` | Check/create admin account with unlimited access |
| `check-user.js` | Check user credentials and usage stats |
| `generate-invite.js` | Generate invite codes |
| `list-invites.js` | List all invite codes with user info |
| `list-extensions.js` | List extension requests |
| `grant-usage.js` | Grant usage to a user |
| `test-ai.js` | Test AI integrations with usage tracking |
| `test-usage-limits.js` | Test usage limit enforcement |
| `test-extension-requests.js` | Test extension request workflow |
| `test-backend-direct.js` | Direct backend AI service tests |
| `test-production-login.js` | Test production login |

---

## User Management Scripts

### check-admin.js
Check and create admin account. Admin accounts automatically get unlimited usage.

```bash
# Check/create admin with default credentials
node scripts/check-admin.js mortalnow 111111

# Or with custom credentials
node scripts/check-admin.js <username> <password>
```

### check-user.js
Check if a user exists and verify their login credentials. Shows usage statistics and extension request history.

```bash
node scripts/check-user.js <username> <password>
```

### set-password.js
Set or update a user's password.

```bash
node scripts/set-password.js <username> <new-password>
```

---

## Invite Code Management

### generate-invite.js
Generate new invite codes for user registration.

```bash
# Generate 1 invite code
node scripts/generate-invite.js

# Generate multiple invite codes
node scripts/generate-invite.js 5
```

### list-invites.js
List all invite codes with usage details, including which users used them and their current usage stats.

```bash
node scripts/list-invites.js
```

---

## Usage & Extension Management

### list-extensions.js
List extension requests from the database.

```bash
# List all requests
node scripts/list-extensions.js

# Filter by status
node scripts/list-extensions.js pending
node scripts/list-extensions.js approved
node scripts/list-extensions.js rejected
```

### grant-usage.js
Grant additional usage or unlimited access to a user directly.

```bash
# Grant 10 more prompts
node scripts/grant-usage.js <username> 10

# Grant unlimited access
node scripts/grant-usage.js <username> unlimited
```

---

## Testing Scripts

### test-ai.js
Test AI integrations (ChatGPT and Gemini) with usage tracking verification.

```bash
# Test with an invite code
node scripts/test-ai.js <INVITE_CODE>
```

**What it tests:**
- User registration with invite code
- Model listing endpoint
- Usage status endpoint
- ChatGPT streaming response
- Gemini streaming response
- Usage counting after each message

### test-usage-limits.js
Test that usage limit enforcement is working correctly.

```bash
node scripts/test-usage-limits.js <INVITE_CODE>
```

**What it tests:**
- Registers a new test user
- Sends messages until hitting the limit
- Verifies usage counting is accurate
- Tests that limit is enforced correctly
- Tests extension request submission when limit reached

### test-extension-requests.js
Test the full extension request workflow including admin approval/rejection.

```bash
node scripts/test-extension-requests.js <admin-username> <admin-password> [invite-code]
```

**What it tests:**
- Admin login
- Listing pending requests
- User extension request submission
- Admin approval flow (with usage limit increase)
- Admin rejection flow
- Status verification after actions

### test-backend-direct.js
Test AI services directly without the HTTP layer.

```bash
node scripts/test-backend-direct.js
```

### test-production-login.js
Test login against the production API.

```bash
node scripts/test-production-login.js <username> <password>
```

---

## Environment Setup

### Required Environment Variables

Create a `.env` file with:

```bash
# MongoDB Atlas
MONGODB_USER=your-mongodb-username
MONGODB_PASSWORD=your-mongodb-password
MONGODB_CLUSTER=cluster0.xxxxx.mongodb.net
MONGODB_DB_NAME=ask_qiao

# API Keys
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=AI...

# Server
JWT_SECRET=your-jwt-secret
PORT=3001
```

### Getting MongoDB Atlas Connection String

1. Go to MongoDB Atlas dashboard
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Extract the cluster address from the connection string

---

## Troubleshooting

### "Connection timeout" Error
- Check your MongoDB Atlas cluster is running
- Verify environment variables are correct
- Ensure your IP is whitelisted in Atlas

### "User not found" Error
- Use `list-invites.js` to see all users
- Username is case-sensitive
- User may need to register with an invite code first

### "Usage limit exceeded" Error
- This is expected behavior after 5 prompts
- Use `grant-usage.js` to add more prompts
- Or use admin panel to approve extension requests

### API Tests Failing
- Ensure server is running (`npm start`)
- Check that API keys are configured correctly
- Use `test-backend-direct.js` to test without HTTP layer
