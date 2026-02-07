# Skills Notes (Current)

Last updated: 2026-02-07

## Current Skill System

- Storage: MongoDB (`Skill`, `Category` models)
- Creation paths:
  - AI-generated preview from structured prompt + model answer (`/api/skills/generate`)
  - Manual create/edit in skills UI (`/api/skills`)
- Runtime behavior:
  - Enabled skills are prepended as `[SKILLS]` context before user prompt
  - Token-length warning appears when enabled skill content is large

## UX Workflow

1. User sends structured prompt.
2. Assistant response completes.
3. User clicks "Build Skill from this Prompt".
4. AI generates skill draft (name/description/content).
5. User edits and saves.
6. User enables skill for future prompts.

## Management Features

- List/search/filter by category/tag
- Enable/disable toggle
- Edit and delete
- Export all or enabled skills as Markdown bundle

## Explicit Non-Goals (Current)

- User skill upload/import UI
- Multi-model skill variants

## API Surface

- `POST /api/skills/generate`
- `GET /api/skills`
- `POST /api/skills`
- `GET /api/skills/:id`
- `PUT /api/skills/:id`
- `DELETE /api/skills/:id`
- `PATCH /api/skills/:id/toggle`
- `GET /api/skills/enabled/list`
- `GET /api/skills/export`
- `GET /api/skills/categories/list`
- `POST /api/skills/categories`
- `DELETE /api/skills/categories/:id`
- `GET /api/skills/tags/list`
