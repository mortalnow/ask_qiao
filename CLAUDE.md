# Ask Qiao - Project Context

## Project Overview

This is a prompt-based AI instruction service designed to teach users how to communicate with AI effectively. Users must use structured prompts (via the mandatory Prompt Builder) to interact with AI models (ChatGPT 5.2, Gemini 3.1). The service has usage limits to encourage thoughtful prompt construction.

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
2. **Skills Integration**: Upload Claude skill files (.md) and apply them to any LLM
3. **Usage Limits**: 5 free prompts per user; must request extension for more
4. **Extension Request System**: Users can request more prompts; admins approve/reject via UI
5. **Apply for Unlimited**: Quick access button next to usage counter for limited users
6. **Multi-model chat**: Users can switch between AI models per message
7. **Open Registration**: Users register with username/password (no invite codes)
8. **PWA support**: Installable on iOS via "Add to Home Screen"
9. **Streaming responses**: Real-time message display via SSE
10. **Ephemeral chats**: No server-side chat persistence (privacy-focused)

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
| POST | `/api/auth/register` | Register new user, return JWT |
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
- API keys stored in environment variables only
- Rate limiting on chat endpoints
- Input sanitization before sending to AI providers
- Passwords hashed with bcrypt (10 rounds)

---

## Development Log

### 2026-01-21: PWA Cache Freshness

**Goal**: Prevent stale UI after deployments without manual cache clearing.

**Changes**:
1. **Service Worker Strategy**: Network-first for HTML/CSS/JS, cache-first for other assets
2. **Instant Updates**: Added skip-waiting messaging and controller-change reload
3. **Cache Control**: Added no-cache headers for `/sw.js`, `/`, and `*.html` in `vercel.json`

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

### 2026-01-18: Skills Integration Feature

**Goal**: Allow users to upload Claude skill files and apply them to any LLM (GPT, Gemini).

**Features**:
1. **Skills Button**: Added in prompt builder header next to "Back to models"
2. **Skills Modal**: Upload zone for .md files, list of skills with toggles
3. **Skill Parser**: Extracts name/description from YAML frontmatter or first heading
4. **localStorage Persistence**: Skills saved locally for reuse
5. **Skill Injection**: Enabled skills prepended as `[SKILLS]` section before `[PERSONA]`
6. **Token Warning**: Alerts when combined skill content exceeds 2000 characters

**Files Changed**:
- `public/index.html`: Skills button, skills modal HTML
- `public/js/app.js`: Skills management functions (upload, parse, toggle, inject)
- `public/css/style.css`: Skills button, modal, list, toggle styles
- `public/js/i18n.js`: Chinese and English translations for skills UI

**How It Works**:
- Users upload `.md` files from `~/.claude/skills` folder
- Parser extracts metadata from YAML frontmatter or headings
- Skills can be toggled on/off; enabled skills are prepended to prompts
- Works with any LLM by converting Claude skills to system instructions

### 2026-01-15: Open Registration & UI Improvements

**Goal**: Simplify onboarding and improve extension request UX.

**Changes**:
1. **Open Registration**: Removed invite-code requirement; users register with username/password only
2. **Apply for Unlimited Button**: Added quick-access button next to usage counter for limited users
3. **Welcome Modal**: New users see a welcome modal with remaining prompts and option to apply for unlimited
4. **Admin Panel Simplification**: Removed invite code management section; focused on extension requests

**Backend Changes**:
- `server/routes/auth.js`: Changed `/api/auth/verify` to `/api/auth/register` (no invite code required)

**Frontend Changes**:
- `public/index.html`: Added "Apply for unlimited" button, welcome modal
- `public/js/app.js`: Wired button and welcome modal logic
- `public/js/auth.js`: Updated registration to not require invite code
- `public/login.html`: Removed invite code field from registration form
- `public/admin.html`: Removed invite code management section
- `public/js/admin.js`: Removed invite code functions
- `public/css/style.css`: Added button and welcome modal styles
- `public/js/i18n.js`: Added new translation strings
