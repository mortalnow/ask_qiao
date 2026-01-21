# Ask Qiao

A prompt-based AI instruction service designed to teach users how to communicate with AI effectively. Users must use structured prompts to interact with ChatGPT 5.2 and Gemini 3.1 through a unified interface.

## Features

- **Mandatory Prompt Builder**: All queries must use structured prompts (PERSONA, TASK, CONTEXT, FORMAT, REFERENCES)
- **Skills Integration**: Upload Claude skill files (.md) and apply them to any LLM (GPT, Gemini)
- **Usage Limits**: 5 free prompts per user, with extension request system
- **Extension Requests**: Users can request more prompts; admins approve/reject via UI
- **Apply for Unlimited**: Quick access button next to usage counter for limited users
- **Multi-model chat**: Switch between AI models (ChatGPT, Gemini) per message
- **Open Registration**: Users can create accounts with username/password
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
MONGODB_DB_NAME=ask_qiao
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

### 4. Start the Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

### 5. Access the App

Open http://localhost:3002 in your browser.

## Project Structure

```
ask_qiao/
├── api/                    # Vercel serverless function
│   └── index.js           # Express app wrapper for Vercel
├── docs/                   # Documentation
│   ├── PLAN_v1_original.md # Original project planning (historical)
│   ├── task_plan.md       # Current task planning
│   ├── feature_list.json  # QA test cases (62 features)
│   └── prompt_structure.md # Prompt Builder template reference
├── server/                 # Backend
│   ├── index.js           # Express server entry (local dev)
│   ├── config.js          # Environment config
│   ├── routes/
│   │   ├── auth.js        # Authentication endpoints
│   │   ├── admin.js       # Admin panel endpoints
│   │   ├── chat.js        # Chat API endpoints
│   │   └── extension.js   # Usage extension requests
│   ├── middleware/
│   │   └── auth.js        # JWT + usage limit middleware
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
│   ├── admin.html         # Admin panel
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   ├── css/
│   │   └── style.css      # Styles
│   └── js/
│       ├── api.js         # API client
│       ├── auth.js        # Auth handling
│       ├── admin.js       # Admin panel logic
│       ├── i18n.js        # Internationalization (zh-CN/en-US)
│       └── app.js         # Chat logic + Prompt Builder
├── scripts/
│   ├── generate-invite.js  # CLI for invite codes
│   ├── init-mongodb.js     # MongoDB initialization script
│   ├── check-admin.js      # Admin account management
│   ├── check-user.js       # Check user credentials + usage stats
│   ├── list-invites.js     # List invite codes with user info
│   ├── list-extensions.js  # List extension requests
│   ├── grant-usage.js      # Grant usage to users
│   ├── test-ai.js          # Test AI integrations
│   ├── test-usage-limits.js # Test usage limit enforcement
│   ├── test-extension-requests.js # Test extension workflow
│   ├── verify-mongodb-config.js # Verify MongoDB config
│   ├── set-password.js     # User password management
│   ├── test-mongodb-connection.js # DB connectivity test
│   ├── test-production-login.js  # Test production login
│   └── README-admin.md     # Admin & testing scripts guide
├── CLAUDE.md               # Project context for Claude Code
├── vercel.json             # Vercel deployment configuration
├── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login with username/password |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/chat` | Yes | Send message (SSE stream) |
| GET | `/api/chat/models` | Yes | List available models |
| GET | `/api/extension/status` | Yes | Get usage status and extension info |
| POST | `/api/extension/request` | Yes | Submit extension request |
| GET | `/api/admin/extensions` | Admin | List extension requests |
| POST | `/api/admin/extensions/:id/approve` | Admin | Approve extension request |
| POST | `/api/admin/extensions/:id/reject` | Admin | Reject extension request |

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

## Troubleshooting

### Login Issues

If you can't login to the production site, check:
1. Ensure the production database is initialized: `node scripts/init-mongodb.js`
2. Verify user exists: `node scripts/check-user.js <username> <password>`
3. Verify MongoDB config: `node scripts/verify-mongodb-config.js`
4. Test production API: `node scripts/test-production-login.js <username> <password>`

## Security

- JWT tokens for authentication (7-day expiry)
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

### 2026-01-21
- **Fixed**: PWA cache staleness
  - Service worker now uses network-first for HTML/CSS/JS and refreshes cache on fetch
  - Auto-activates new service workers and reloads once on controller change
  - Added no-cache headers for `/sw.js`, `/`, and `*.html` on Vercel

### 2026-01-14
- **Major**: Transformed service to prompt-based instruction platform
  - All users must now use the structured Prompt Builder (no free-form input)
  - Added usage limit system (5 free prompts per user)
  - Added extension request workflow for users to request more prompts
  - Admin panel now includes extension request management
  - Admin users automatically get unlimited access
- **Backend**:
  - Added ExtensionRequest model and usage fields to User schema
  - New `/api/extension` routes for status and request submission
  - Usage limit middleware with automatic increment tracking
  - Extended admin routes for extension approval/rejection
- **Frontend**:
  - Removed chat input form, made Prompt Builder mandatory
  - Added usage counter in header
  - Added extension request modal when limit exceeded
  - Enhanced admin panel with extension request management
- **Scripts**: Added test-usage-limits.js, test-extension-requests.js, list-extensions.js, grant-usage.js

### 2026-01-11
- **Added**: Comprehensive feature list with 62 test cases (`docs/feature_list.json`)
- **Improved**: Project documentation organization
  - Created `docs/` folder for documentation
  - Moved planning and reference docs to `docs/`
- **Cleanup**: Removed redundant files and old SQLite artifacts

### 2026-01-07
- **Added**: Prompt Builder feature for structured prompt construction
  - Required fields: PERSONA, TASK, CONTEXT
  - Optional fields: FORMAT, REFERENCES
  - Collapsible form with generate/clear actions
- **Added**: Internationalization (i18n) support for Chinese and English
- **Added**: Conversation history sidebar with session management
- **Added**: Admin panel for invite code management
- **Fixed**: Service Worker cache issue preventing Prompt Builder from working

## Changelog

### 2026-01-18
- **Added**: Skills Integration feature
  - Upload Claude skill files (.md) from ~/.claude/skills folder
  - Parse skill metadata (name, description) from YAML frontmatter or headings
  - Toggle skills on/off; enabled skills are prepended to prompts
  - Works with any LLM (GPT, Gemini) by converting skills to system instructions
  - Skills persisted in localStorage for reuse
  - Token warning when combined skill content is lengthy

### 2026-01-15
- **Changed**: Removed invite-code requirement; open registration now available
- **Added**: "Apply for unlimited" button next to usage counter for limited users
- **Added**: Welcome modal for new users showing remaining prompts
- **Simplified**: Admin panel now focuses on extension requests (removed invite code management)

## License

Private
