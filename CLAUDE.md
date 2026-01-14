# Ask Qiao - Project Context

## Project Overview

This is a prompt-based AI instruction service designed to teach users how to communicate with AI effectively. Users must use structured prompts (via the mandatory Prompt Builder) to interact with AI models (ChatGPT 5.2, Gemini 3.1). The service is invite-only with usage limits to encourage thoughtful prompt construction.

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas (cloud-hosted)
- **Frontend**: Vanilla JS + HTML/CSS (PWA)
- **AI SDKs**: `openai`, `@google/generative-ai`
- **Auth**: JWT tokens

## Architecture

```
Client (Web/Mobile/PWA) → Express Server → AI Providers (OpenAI, Gemini)
                              ↓
                      MongoDB Atlas (users, invite_codes)
```

## Key Features

1. **Mandatory Prompt Builder**: All queries must use structured prompts (PERSONA, TASK, CONTEXT, FORMAT, REFERENCES)
2. **Usage Limits**: 5 free prompts per user; must request extension for more
3. **Extension Request System**: Users can request more prompts; admins approve/reject via UI
4. **Multi-model chat**: Users can switch between AI models per message
5. **Invite-only access**: Single-use invite codes for authentication
6. **PWA support**: Installable on iOS via "Add to Home Screen"
7. **Streaming responses**: Real-time message display via SSE
8. **Ephemeral chats**: No server-side chat persistence (privacy-focused)

## Project Structure

```
api/              # Vercel serverless function wrapper
  index.js        # Express app wrapper for Vercel deployment
docs/             # Documentation
  task_plan.md    # Current task planning
  feature_list.json # QA test cases (62 features)
  prompt_structure.md # Prompt Builder template
server/           # Express backend
  routes/         # API endpoints (auth, chat, admin, extension)
  middleware/     # JWT verification + usage limit checking
  services/       # AI provider integrations
  db/             # MongoDB Atlas setup (User, InviteCode, ExtensionRequest models)
public/           # Frontend PWA
  css/            # Styles
  js/             # Client-side logic (app, auth, admin, i18n, api)
scripts/          # CLI utilities (testing, user management, extensions)
vercel.json       # Vercel deployment configuration
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/verify` | Verify invite code, return JWT |
| POST | `/api/auth/login` | Login with username/password |
| GET | `/api/auth/me` | Get current user info |
| POST | `/api/chat` | Send message to AI model (with usage tracking) |
| GET | `/api/chat/models` | List available models |
| GET | `/api/extension/status` | Get usage status and extension request info |
| POST | `/api/extension/request` | Submit extension request for more prompts |
| GET | `/api/admin/extensions` | List extension requests (admin only) |
| POST | `/api/admin/extensions/:id/approve` | Approve request (admin only) |
| POST | `/api/admin/extensions/:id/reject` | Reject request (admin only) |

## Environment Variables

Required in `.env`:
- `PORT` - Server port (default: 3002)
- `JWT_SECRET` - Secret for JWT signing
- `OPENAI_API_KEY` - OpenAI API key
- `GOOGLE_AI_API_KEY` - Google Gemini API key
- `MONGODB_USER` - MongoDB Atlas username
- `MONGODB_PASSWORD` - MongoDB Atlas password
- `MONGODB_CLUSTER` - MongoDB Atlas cluster address (default: cluster0)
- `MONGODB_DB_NAME` - Database name (default: ask_qiao)

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server with hot reload
npm start            # Start production server (local)

# User & Invite Management
node scripts/generate-invite.js   # Generate new invite code
node scripts/list-invites.js      # List all invite codes with user info
node scripts/check-admin.js       # Check/create admin account (gets unlimited)
node scripts/check-user.js        # Check user credentials + usage stats
node scripts/set-password.js      # Set password for existing user
node scripts/grant-usage.js <user> <amount|unlimited>  # Grant usage to user

# Extension Requests
node scripts/list-extensions.js [pending|approved|rejected]  # List extension requests

# Testing
node scripts/test-ai.js <invite-code>           # Test AI integrations with usage tracking
node scripts/test-usage-limits.js <invite-code> # Test usage limit enforcement
node scripts/test-extension-requests.js <admin> <pass> [invite-code]  # Test extension workflow

# Database & Config
node scripts/init-mongodb.js      # Initialize MongoDB database
node scripts/verify-mongodb-config.js # Verify MongoDB connection
node scripts/test-mongodb-connection.js # Test MongoDB connection
node scripts/test-production-login.js   # Test production API login
```

## Deployment

### Vercel Deployment

The app uses Vercel serverless functions for deployment:
- `api/index.js` - Wraps Express app as serverless function
- `vercel.json` - Configures routing and builds
- All API routes (`/api/*`) are handled by the serverless function
- Static files are served with proper caching headers

**Important**: Ensure all environment variables are set in Vercel dashboard before deploying.

## Coding Conventions

- Use ES modules (`import`/`export`)
- Async/await for all async operations
- Error handling with try/catch and user-friendly messages
- Mobile-first responsive CSS
- No external CSS frameworks (keep it lightweight for PWA)

## MongoDB Setup

The project uses MongoDB Atlas for user and invite code storage. To initialize:

1. Ensure MongoDB Atlas cluster is accessible
2. Set environment variables: `MONGODB_USER`, `MONGODB_PASSWORD`, `MONGODB_CLUSTER`, `MONGODB_DB_NAME`
3. Run initialization script: `node scripts/init-mongodb.js <cluster-hostname>`
4. Script creates collections with indexes and admin user (`mortalnow@gmail.com` / `111111`)
5. For more admin tasks, see `scripts/README-admin.md`

## Troubleshooting Tools

- `scripts/check-user.js` - Diagnose login issues by checking if user exists and verifying credentials
- `scripts/verify-mongodb-config.js` - Verify MongoDB connection configuration and environment variables
- `scripts/test-production-login.js` - Test the production API login endpoint directly

## Security Considerations

- All API routes (except auth) require valid JWT
- Invite codes are single-use and securely generated
- API keys stored in environment variables only
- Rate limiting on chat endpoints
- Input sanitization before sending to AI providers
- Passwords hashed with bcrypt (10 rounds)

---

## Development Log

### 2026-01-14: Prompt-Based Instruction Service Transformation

**Goal**: Transform from free-form chat to structured prompt instruction service with usage limits.

**Major Changes**:
1. **Mandatory Prompt Builder**: Removed free-form text input; all users must use structured prompts
2. **Usage Limits**: 5 free prompts per user, tracked in database
3. **Extension Request System**: Users can request more prompts when limit reached
4. **Admin Management**: Admins can approve/reject requests, grant fixed or unlimited access

**Database Changes** (`server/db/models.js`):
- User schema: Added `usage_count`, `usage_limit`, `is_unlimited` fields
- New ExtensionRequest model: tracks requests, status, granted amounts

**Backend Changes**:
- `server/routes/extension.js`: New routes for status and request submission
- `server/routes/admin.js`: Extension management endpoints
- `server/routes/chat.js`: Usage limit checking and increment on success
- `server/middleware/auth.js`: `checkUsageLimit` middleware, `incrementUsage` helper

**Frontend Changes**:
- `public/index.html`: Removed chat form, made Prompt Builder prominent, added extension modal
- `public/js/app.js`: Usage tracking, extension request modal logic
- `public/js/api.js`: New extension API functions
- `public/js/admin.js`: Extension request management UI
- `public/css/style.css`: Usage counter, modal styles
- `public/js/i18n.js`: All new translation strings

**New Scripts**:
- `test-usage-limits.js`: Tests limit enforcement
- `test-extension-requests.js`: Tests full workflow
- `list-extensions.js`: Lists extension requests
- `grant-usage.js`: Direct usage grant utility

### 2026-01-11: Documentation & QA

- Created comprehensive `feature_list.json` with 62 test cases across 10 categories
- Organized documentation into `docs/` folder
- Cleaned up redundant files (old SQLite database, .DS_Store files)

### 2026-01-07: Prompt Builder Feature

**Goal**: Add a structured prompt builder based on `docs/prompt_structure.md` template.

**Template Structure**:
- `[PERSONA]` - Define AI role/expertise
- `[TASK]` - Specific action and requirements
- `[CONTEXT]` - Background and audience
- `[FORMAT]` - Output format, length, tone (optional)
- `[REFERENCES]` - Examples or desired style (optional)

**Implementation**:
- HTML: Toggle button, collapsible form with 5 textarea fields
- CSS: Slide-down animation, responsive styles
- JS: `togglePromptBuilder()`, `generatePrompt()`, `clearPromptForm()`

**Bug Fix**: Service Worker caching old `app.js` - updated cache version to force refresh
