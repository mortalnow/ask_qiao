# Admin & Testing Scripts Guide

Last updated: 2026-02-08

## Overview

This directory contains operational scripts for Ask Qiao (user/admin checks, usage management, extension workflow testing, and AI smoke tests).

## Quick Reference

| Script | Purpose |
|--------|---------|
| `check-admin.js` | Check/create admin account with unlimited access |
| `check-user.js` | Check user credentials and usage stats |
| `set-password.js` | Reset user password |
| `list-extensions.js` | List extension requests |
| `grant-usage.js` | Grant usage or unlimited access |
| `test-ai.js` | End-to-end API test (ChatGPT-only) |
| `test-usage-limits.js` | Usage-limit behavior test |
| `test-extension-requests.js` | Extension request workflow test |
| `test-backend-direct.js` | Direct OpenAI service smoke test |
| `test-production-login.js` | Production login test |
| `verify-mongodb-config.js` | Validate MongoDB env/config |
| `test-mongodb-connection.js` | MongoDB connectivity check |

## Common Commands

### Check/create admin

```bash
node scripts/check-admin.js mortalnow 111111
```

### Check user credentials and usage

```bash
node scripts/check-user.js <username> <password>
```

### Set password

```bash
node scripts/set-password.js <username> <new-password>
```

### Grant usage

```bash
node scripts/grant-usage.js <username> 10
node scripts/grant-usage.js <username> unlimited
```

### List extension requests

```bash
node scripts/list-extensions.js
node scripts/list-extensions.js pending
node scripts/list-extensions.js approved
node scripts/list-extensions.js rejected
```

## Testing Scripts

### `test-ai.js`

ChatGPT-only integration test via HTTP API. Uses open registration to create a test user.

```bash
node scripts/test-ai.js
```

Checks:
- register path availability
- `/api/chat/models`
- `/api/extension/status`
- `/api/chat` streaming behavior

### `test-backend-direct.js`

Direct OpenAI service smoke test (no HTTP layer):

```bash
node scripts/test-backend-direct.js
```

### `test-usage-limits.js`

```bash
node scripts/test-usage-limits.js
```

Checks quota increment + limit enforcement behavior.

### `test-extension-requests.js`

```bash
node scripts/test-extension-requests.js <admin-username> <admin-password>
```

Checks request submission + admin approve/reject cycle.

## Environment

Required `.env` keys for script usage:

```bash
MONGODB_USER=...
MONGODB_PASSWORD=...
MONGODB_CLUSTER=...
MONGODB_DB_NAME=ask_qiao

OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5

JWT_SECRET=...
PORT=3002
```

## Troubleshooting

- MongoDB timeout: verify cluster status, credentials, and network/IP allowlist
- Auth failures: verify username/password and token freshness
- AI test failures: verify `OPENAI_API_KEY` and backend connectivity
