# Talk to Qiao

A multi-model AI chat wrapper with a modern PWA interface. Chat with ChatGPT 5.2 and Gemini 3.1 through a unified, invite-only interface.

## Features

- **Multi-model chat**: Switch between AI models (ChatGPT, Gemini) per message
- **Prompt Builder**: Structured prompt construction with PERSONA, TASK, CONTEXT fields
- **Invite-only access**: Secure single-use invite codes
- **PWA support**: Install on iOS/Android via "Add to Home Screen"
- **Streaming responses**: Real-time message display
- **Ephemeral chats**: No server-side storage (privacy-focused)
- **Mobile-first**: Beautiful responsive design

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and add your API keys:

```bash
cp env.example .env
```

Edit `.env`:

```
PORT=3002
JWT_SECRET=your-super-secret-jwt-key-change-this
OPENAI_API_KEY=sk-your-openai-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key

# MongoDB Atlas Configuration
MONGODB_USER=your-mongodb-username
MONGODB_PASSWORD=your-mongodb-password
MONGODB_CLUSTER=your-cluster-address.mongodb.net
MONGODB_DB_NAME=talk_to_qiao
```

### 3. Initialize MongoDB Database

Initialize the database with required collections and admin user:

```bash
node scripts/init-mongodb.js
```

Or specify the cluster hostname:

```bash
node scripts/init-mongodb.js cluster0.xxxxx.mongodb.net
```

This script will:
- Create required collections (`users`, `invitecodes`) with indexes
- Create admin user: `mortalnow@gmail.com` / `111111`

### 4. Generate Invite Codes

```bash
npm run generate-invite
# or generate multiple codes:
npm run generate-invite 5
```

### 5. Start the Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

### 6. Access the App

Open http://localhost:3002 in your browser.

## Project Structure

```
talk_to_qiao/
├── api/                    # Vercel serverless function
│   └── index.js           # Express app wrapper for Vercel
├── server/                 # Backend
│   ├── index.js           # Express server entry (local dev)
│   ├── config.js          # Environment config
│   ├── routes/
│   │   ├── auth.js        # Authentication endpoints
│   │   └── chat.js        # Chat API endpoints
│   ├── middleware/
│   │   └── auth.js        # JWT middleware
│   ├── services/
│   │   ├── openai.js      # ChatGPT integration
│   │   └── gemini.js      # Gemini integration
│   ├── db/
│   │   ├── init.js        # MongoDB Atlas connection
│   │   └── models.js      # Mongoose schemas
│   └── utils/
│       └── inviteCode.js  # Code generation
├── public/                 # Frontend PWA
│   ├── index.html         # Chat interface (with Prompt Builder)
│   ├── login.html         # Login page
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   ├── css/
│   │   └── style.css      # Styles
│   └── js/
│       ├── api.js         # API client
│       ├── auth.js        # Auth handling
│       └── app.js         # Chat logic + Prompt Builder
├── prompt.md               # Prompt template reference
├── scripts/
│   ├── generate-invite.js  # CLI for invite codes
│   ├── init-mongodb.js     # MongoDB initialization script
│   ├── check-admin.js      # Admin account management
│   ├── check-user.js       # Check user credentials and diagnose login issues
│   ├── verify-mongodb-config.js # Verify MongoDB connection configuration
│   ├── set-password.js     # User password management
│   ├── test-mongodb-connection.js # DB connectivity test
│   ├── test-production-login.js  # Test production API login endpoint
│   └── README-admin.md     # Admin documentation guide
├── vercel.json             # Vercel deployment configuration
├── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/verify` | No | Verify invite code |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/chat` | Yes | Send message (SSE stream) |
| GET | `/api/chat/models` | Yes | List available models |

## Deployment

### Vercel Deployment

The app is configured for Vercel deployment with serverless functions:

1. **Environment Variables**: Set all required environment variables in Vercel dashboard:
   - `MONGODB_USER`, `MONGODB_PASSWORD`, `MONGODB_CLUSTER`, `MONGODB_DB_NAME`
   - `JWT_SECRET`, `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY`

2. **Deploy**: Push to GitHub and Vercel will auto-deploy, or use `vercel` CLI

3. **Files**:
   - `api/index.js` - Serverless function wrapper for Express app
   - `vercel.json` - Vercel routing configuration

See `VERCEL_DEPLOYMENT_FIX.md` for detailed deployment troubleshooting.

## Troubleshooting

### Login Issues

If you can't login to the production site, check:
1. Ensure the production database is initialized: `node scripts/init-mongodb.js`
2. Verify user exists: `node scripts/check-user.js <username> <password>`
3. Verify MongoDB config: `node scripts/verify-mongodb-config.js`
4. Test production API: `node scripts/test-production-login.js <username> <password>`
5. See `LOGIN_ISSUE_DIAGNOSIS.md` for detailed troubleshooting steps
6. See `VERCEL_DEPLOYMENT_FIX.md` for Vercel-specific issues (404 errors, routing)

## Security

- JWT tokens for authentication (7-day expiry)
- Single-use invite codes
- Rate limiting (60 req/min API, 20 req/min chat)
- Input sanitization
- API keys stored in environment variables only

## PWA Installation

### iOS
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

### Android
1. Open the app in Chrome
2. Tap the menu (⋮)
3. Select "Add to Home screen"

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas (Mongoose)
- **AI**: OpenAI SDK, Google Generative AI SDK
- **Auth**: JWT (jsonwebtoken)
- **Frontend**: Vanilla JS, CSS (no frameworks)

## Changelog

### 2026-01-07
- **Added**: Prompt Builder feature for structured prompt construction
  - Required fields: PERSONA, TASK, CONTEXT
  - Optional fields: FORMAT, REFERENCES
  - Collapsible form with generate/clear actions
- **Fixed**: Service Worker cache issue preventing Prompt Builder from working
  - Updated cache version (v1 → v2) to force refresh

## License

Private - Invite-only access
