# AI Chat Wrapper - Project Context

## Project Overview

This is an AI skin/wrapper that provides users with a unified interface to communicate with multiple AI models (ChatGPT 5.2, Gemini 3.1). The service is invite-only, requiring a single-use invite code for access.

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

1. **Multi-model chat**: Users can switch between AI models per message
2. **Invite-only access**: Single-use invite codes for authentication
3. **PWA support**: Installable on iOS via "Add to Home Screen"
4. **Streaming responses**: Real-time message display via SSE
5. **Ephemeral chats**: No server-side chat persistence (privacy-focused)

## Project Structure

```
api/              # Vercel serverless function wrapper
  index.js        # Express app wrapper for Vercel deployment
server/           # Express backend
  routes/         # API endpoints (auth, chat)
  middleware/     # JWT verification
  services/       # AI provider integrations
  db/             # MongoDB Atlas setup
public/           # Frontend PWA
  css/            # Styles
  js/             # Client-side logic
scripts/          # CLI utilities (invite code generation, DB initialization)
vercel.json       # Vercel deployment configuration
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/verify` | Verify invite code, return JWT |
| GET | `/api/auth/me` | Get current user info |
| POST | `/api/chat` | Send message to AI model |
| GET | `/api/models` | List available models |

## Environment Variables

Required in `.env`:
- `PORT` - Server port (default: 3002)
- `JWT_SECRET` - Secret for JWT signing
- `OPENAI_API_KEY` - OpenAI API key
- `GOOGLE_AI_API_KEY` - Google Gemini API key
- `MONGODB_USER` - MongoDB Atlas username
- `MONGODB_PASSWORD` - MongoDB Atlas password
- `MONGODB_CLUSTER` - MongoDB Atlas cluster address (default: cluster0)
- `MONGODB_DB_NAME` - Database name (default: talk_to_qiao)

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server with hot reload
npm start            # Start production server (local)
node scripts/generate-invite.js  # Generate new invite code
node scripts/init-mongodb.js      # Initialize MongoDB database
node scripts/check-admin.js       # Check/create admin account
node scripts/check-user.js       # Check user credentials and diagnose login issues
node scripts/verify-mongodb-config.js # Verify MongoDB connection configuration
node scripts/test-mongodb-connection.js # Test MongoDB connection
node scripts/test-production-login.js   # Test production API login endpoint
node scripts/set-password.js      # Set password for existing user
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
- `LOGIN_ISSUE_DIAGNOSIS.md` - Comprehensive guide for resolving login problems, especially when production and local databases differ
- `VERCEL_DEPLOYMENT_FIX.md` - Guide for fixing Vercel deployment issues (404 errors, routing problems)

## Security Considerations

- All API routes (except auth) require valid JWT
- Invite codes are single-use and securely generated
- API keys stored in environment variables only
- Rate limiting on chat endpoints
- Input sanitization before sending to AI providers
- Passwords hashed with bcrypt (10 rounds)

---

## Development Log

### 2026-01-07: Prompt Builder Feature

**Goal**: Add a structured prompt builder based on `prompt.md` template to help users construct better prompts.

**Template Structure** (`prompt.md`):
- `[PERSONA]` - Define AI role/expertise
- `[TASK]` - Specific action and requirements
- `[CONTEXT]` - Background and audience
- `[FORMAT]` - Output format, length, tone (optional)
- `[REFERENCES]` - Examples or desired style (optional)

**Implementation**:

1. **HTML** (`public/index.html`):
   - Added toggle button "提示词构建器" above input area
   - Created collapsible form with 5 textarea fields
   - Required fields marked with `*`, optional fields marked as "（可选）"
   - Actions: "清空" (clear) and "生成提示词" (generate)

2. **CSS** (`public/css/style.css`):
   - New styles for `.prompt-builder`, `.prompt-field`, `.btn-prompt-builder`
   - Slide-down animation on open
   - Accent colors for labels (mono font for field names)
   - Responsive styles for mobile (stacked action buttons)

3. **JavaScript** (`public/js/app.js`):
   - `togglePromptBuilder()` - Show/hide form
   - `generatePrompt()` - Validate required fields, build formatted prompt
   - `clearPromptForm()` - Reset all fields with confirmation
   - Generated prompt populates main input and closes builder

**Files Modified**:
- `public/index.html` - Added prompt builder form (lines 76-167)
- `public/css/style.css` - Added prompt builder styles (lines 516-717, 1034-1055)
- `public/js/app.js` - Added prompt builder logic

**Design Decisions**:
- Fields are references/guides, not strict requirements
- Required fields ensure minimum structure for effective prompts
- Optional fields allow advanced customization
- Form values are not persisted (privacy-focused, matches chat behavior)

