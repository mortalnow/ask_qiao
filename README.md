# Ask Qiao

Ask Qiao is a prompt-coaching workspace focused on helping users write better prompts and get better answers from ChatGPT. Users send structured prompts, then turn successful prompt + answer pairs into reusable Markdown skills.

## Product Philosophy

1. Prompt better first.
2. Reuse what works by building skills from real prompt/answer outcomes.

## Current Scope (2026-02-07)

- ChatGPT-only runtime (`chatgpt` / `gpt-5`)
- Mandatory structured prompt builder
- AI-assisted skill generation from prompt + answer
- Server-side skill storage, edit, toggle, filter, export
- No user skill upload/import flow in UI
- Mobile-first responsive behavior with PWA support

## Features

- Mandatory prompt structure: `[PERSONA]`, `[TASK]`, `[CONTEXT]` (+ optional `[FORMAT]`, `[REFERENCES]`)
- Streaming chat responses (SSE)
- File context support: images + PDF/TXT/MD/DOCX text extraction
- Session history (browser-local)
- Usage limits + extension request workflow
- Admin review tools for extension requests
- Bilingual UI (zh-CN / en-US)

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp env.example .env
```

Required variables:

```bash
PORT=3002
JWT_SECRET=your-super-secret-jwt-key-change-this
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-5

MONGODB_USER=your-mongodb-username
MONGODB_PASSWORD=your-mongodb-password
MONGODB_CLUSTER=cluster0
MONGODB_DB_NAME=ask_qiao
```

### 3. Initialize MongoDB

```bash
node scripts/init-mongodb.js
```

### 4. Run

```bash
npm run dev
# or
npm start
```

Open http://localhost:3002

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register account |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/chat` | Yes | Chat stream (SSE) |
| GET | `/api/chat/models` | Yes | Active model metadata |
| GET | `/api/extension/status` | Yes | Usage + extension state |
| POST | `/api/extension/request` | Yes | Submit extension request |
| GET | `/api/skills` | Yes | List skills |
| POST | `/api/skills` | Yes | Create skill |
| POST | `/api/skills/generate` | Yes | AI-generate skill preview |
| GET | `/api/skills/export` | Yes | Export skills as Markdown |
| GET | `/api/admin/extensions` | Admin | List extension requests |
| POST | `/api/admin/extensions/:id/approve` | Admin | Approve request |
| POST | `/api/admin/extensions/:id/reject` | Admin | Reject request |

## Project Structure

```text
ask_qiao/
├── api/                    # Vercel serverless entry
├── docs/                   # Product docs, notes, QA feature list
├── public/                 # Frontend (PWA)
├── server/                 # Backend (Express + MongoDB)
├── scripts/                # Admin/testing/dev scripts
├── env.example
├── package.json
└── README.md
```

## Documentation Map

- `docs/feature_list.json`: current QA feature inventory and test steps
- `docs/task_plan.md`: current implementation plan snapshot
- `docs/prompt_structure.md`: prompt template reference
- `docs/PLAN_v1_original.md`: archived original v1 plan (historical)

## Deployment

Vercel is supported via `api/index.js` + `vercel.json`.

Set these env vars in Vercel:

- `MONGODB_USER`, `MONGODB_PASSWORD`, `MONGODB_CLUSTER`, `MONGODB_DB_NAME`
- `JWT_SECRET`, `OPENAI_API_KEY`, `OPENAI_MODEL`

## Tech Stack

- Backend: Node.js, Express.js
- Database: MongoDB Atlas (Mongoose)
- AI: OpenAI SDK (ChatGPT)
- Auth: JWT + bcrypt
- Frontend: Vanilla JS, HTML, CSS

## License

Private
