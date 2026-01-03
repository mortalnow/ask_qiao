# AI Chat Wrapper - Project Context

## Project Overview

This is an AI skin/wrapper that provides users with a unified interface to communicate with multiple AI models (ChatGPT 5.2, Gemini 3.1). The service is invite-only, requiring a single-use invite code for access.

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite (file-based, simple)
- **Frontend**: Vanilla JS + HTML/CSS (PWA)
- **AI SDKs**: `openai`, `@google/generative-ai`
- **Auth**: JWT tokens

## Architecture

```
Client (Web/Mobile/PWA) → Express Server → AI Providers (OpenAI, Gemini)
                              ↓
                         SQLite DB (users, invite_codes)
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
  db/             # SQLite setup
public/           # Frontend PWA
  css/            # Styles
  js/             # Client-side logic
scripts/          # CLI utilities (invite code generation)
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
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret for JWT signing
- `OPENAI_API_KEY` - OpenAI API key
- `GOOGLE_AI_API_KEY` - Google Gemini API key

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server with hot reload
npm start            # Start production server
node scripts/generate-invite.js  # Generate new invite code
```

## Coding Conventions

- Use ES modules (`import`/`export`)
- Async/await for all async operations
- Error handling with try/catch and user-friendly messages
- Mobile-first responsive CSS
- No external CSS frameworks (keep it lightweight for PWA)

## Security Considerations

- All API routes (except auth) require valid JWT
- Invite codes are single-use and securely generated
- API keys stored in environment variables only
- Rate limiting on chat endpoints
- Input sanitization before sending to AI providers

