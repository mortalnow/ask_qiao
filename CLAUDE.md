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
server/           # Express backend
  routes/         # API endpoints (auth, chat)
  middleware/     # JWT verification
  services/       # AI provider integrations
  db/             # MongoDB Atlas setup
public/           # Frontend PWA
  css/            # Styles
  js/             # Client-side logic
scripts/          # CLI utilities (invite code generation, DB initialization)
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
npm start            # Start production server
node scripts/generate-invite.js  # Generate new invite code
node scripts/init-mongodb.js      # Initialize MongoDB database
node scripts/check-admin.js       # Check/create admin account
node scripts/check-user.js       # Check user credentials and diagnose login issues
node scripts/test-mongodb-connection.js # Test MongoDB connection
node scripts/test-production-login.js   # Test production API login endpoint
node scripts/set-password.js      # Set password for existing user
```

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
- `scripts/test-production-login.js` - Test the production API login endpoint directly
- `LOGIN_ISSUE_DIAGNOSIS.md` - Comprehensive guide for resolving login problems, especially when production and local databases differ

## Security Considerations

- All API routes (except auth) require valid JWT
- Invite codes are single-use and securely generated
- API keys stored in environment variables only
- Rate limiting on chat endpoints
- Input sanitization before sending to AI providers
- Passwords hashed with bcrypt (10 rounds)

