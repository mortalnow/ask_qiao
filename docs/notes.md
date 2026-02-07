# Architecture Notes (Current)

Last updated: 2026-02-07

## Core Architecture

- Frontend: Vanilla JS + HTML/CSS (PWA)
- Backend: Express
- DB: MongoDB (Mongoose)
- AI: OpenAI only (ChatGPT 5.2)

## Auth and Access

- JWT auth (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`)
- Admin-only endpoints under `/api/admin/*`
- Usage-limit middleware on `/api/chat`

## Chat Flow

- User must submit structured prompt via prompt builder
- Server streams assistant text via SSE
- File context supported:
  - Images: base64 in request payload
  - Documents: client extracts text and sends `extractedText`

## Skill Flow

- Generated from structured prompt + model answer
- Saved skills can be enabled/disabled for prompt prefixing
- Server-side CRUD + filter/search + export
- No user upload/import UI in current product

## UX Principles

1. Prompt quality first
2. Reuse successful patterns as skills
3. Keep mobile behavior stable and predictable
