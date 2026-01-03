# Talk to Qiao

A multi-model AI chat wrapper with a modern PWA interface. Chat with ChatGPT 5.2 and Gemini 3.1 through a unified, invite-only interface.

## Features

- **Multi-model chat**: Switch between AI models (ChatGPT, Gemini) per message
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
```

### 3. Generate Invite Codes

```bash
npm run generate-invite
# or generate multiple codes:
npm run generate-invite 5
```

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
talk_to_qiao/
├── server/                 # Backend
│   ├── index.js           # Express server entry
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
│   │   └── init.js        # SQLite setup
│   └── utils/
│       └── inviteCode.js  # Code generation
├── public/                 # Frontend PWA
│   ├── index.html         # Chat interface
│   ├── login.html         # Login page
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   ├── css/
│   │   └── style.css      # Styles
│   └── js/
│       ├── api.js         # API client
│       ├── auth.js        # Auth handling
│       └── app.js         # Chat logic
├── scripts/
│   └── generate-invite.js # CLI for invite codes
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
- **Database**: SQLite (better-sqlite3)
- **AI**: OpenAI SDK, Google Generative AI SDK
- **Auth**: JWT (jsonwebtoken)
- **Frontend**: Vanilla JS, CSS (no frameworks)

## License

Private - Invite-only access

# talk_to_qiao
# talk_to_qiao
# talk_to_qiao
