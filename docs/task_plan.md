# Task Plan (Current): Prompt Coaching + Skill Reuse

Last updated: 2026-02-07
Status: Implemented

## Goal

Keep Ask Qiao focused on two outcomes:

1. Help users write better prompts.
2. Help users convert successful prompt + answer pairs into reusable skills.

## Product Decisions

- Model strategy: ChatGPT-only (`chatgpt`, default `gpt-5.2`)
- Prompting UX: mandatory structured prompt builder
- Skill workflow: generate from prompt + assistant answer, then edit/save
- Skill ingestion: no user upload/import flow in current UI
- Skill management: server-side CRUD + filters + export
- Mobile quality: responsive layouts and no major UX regressions on small screens

## Backend Scope

- Keep `/api/chat` SSE streaming with usage-limit middleware
- Keep `/api/chat/models` as single-model metadata endpoint
- Keep `/api/skills/generate` (prompt + answer required)
- Keep `/api/skills` CRUD + toggle + category/tag + export endpoints
- Keep `/api/extension/*` request workflow and admin review endpoints

## Frontend Scope

- Main screen explains mission (prompt learning + skill reuse)
- Prompt builder remains primary interaction
- No model picker in active workflow
- No skill upload/import tab in active workflow
- Skill generation starts from completed assistant responses
- Skills modal focuses on manage/filter/edit/export

## Validation Checklist

- Auth flows: register/login/logout/auth guard
- Chat flows: structured prompt validation + SSE rendering
- Skill flows: generate -> edit -> save -> enable/disable -> export
- Usage flows: counters + extension request modals + admin review
- Mobile flows: prompt form, modals, history sidebar, skills modal

## Notes

Historical planning docs remain in `docs/` for context only. Use `docs/feature_list.json` as the current QA source of truth.
