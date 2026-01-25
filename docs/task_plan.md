# Task Plan: Skills Manager Enhancement

## Goal
Transform the Skills Manager from a simple upload/toggle system to a full-featured skill management system with server-side storage, AI-powered skill generation from prompts, and organization via categories/tags.

## Phases
- [x] Phase 1: Database Design & Backend API
- [x] Phase 2: Auto-generate Skills from Prompts (AI Integration)
- [x] Phase 3: Skills CRUD UI (View, Edit, Delete)
- [x] Phase 4: Categories/Tags System
- [x] Phase 5: Export/Import Features
- [x] Phase 6: Migration & Testing

## Key Questions
1. ~~Storage: localStorage vs MongoDB vs hybrid?~~ → **MongoDB** (user choice)
2. ~~Creation method: Save prompt or dedicated editor?~~ → **AI auto-generation** (user choice)
3. ~~Management features?~~ → **Full CRUD + categories/tags + export/import** (user choice)

## Architecture Decisions

### Database Schema (MongoDB)
```javascript
// Skill Schema
{
  _id: ObjectId,
  user: ObjectId (ref: User),      // Owner
  name: String,                     // Skill name
  description: String,              // Short description
  content: String,                  // Full skill content (markdown)
  category: String,                 // Category name (optional)
  tags: [String],                   // Array of tags
  is_public: Boolean,               // Future: share skills
  source_prompt_id: String,         // If generated from prompt
  enabled: Boolean,                 // Currently active
  created_at: Date,
  updated_at: Date
}

// Category Schema (optional - could just be string in skill)
{
  _id: ObjectId,
  user: ObjectId,
  name: String,
  color: String,                    // For UI display
  icon: String,                     // Optional icon
  created_at: Date
}
```

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/skills` | List user's skills (with filters) |
| POST | `/api/skills` | Create new skill |
| GET | `/api/skills/:id` | Get single skill |
| PUT | `/api/skills/:id` | Update skill |
| DELETE | `/api/skills/:id` | Delete skill |
| POST | `/api/skills/generate` | AI-generate skill from prompt |
| POST | `/api/skills/import` | Import skills from .md files |
| GET | `/api/skills/export` | Export skills as .md files |
| GET | `/api/skills/categories` | List user's categories |
| POST | `/api/skills/categories` | Create category |

### AI Skill Generation Flow
1. User sends prompt via Prompt Builder
2. After successful response, offer "Save as Skill" button
3. Backend sends prompt + response to AI (GPT/Gemini)
4. AI extracts & generalizes into reusable skill format:
   - Identifies the core capability/role
   - Removes specific context, keeps general pattern
   - Generates name + description
5. User can edit before saving

### Frontend UI Changes
1. **Skills Modal Redesign**:
   - Replace upload-only view with tabbed interface:
     - "My Skills" tab: List/grid of skills with search/filter
     - "Create" tab: Manual skill editor OR generate from prompt
     - "Import" tab: Upload .md files (keep existing)
   - Each skill card shows: name, description, category badge, tags, toggle

2. **Skill Detail/Edit View**:
   - Full content editor (markdown)
   - Category selector (dropdown + "new category")
   - Tags input (pill-style, autocomplete existing)
   - Enable/disable toggle
   - Delete button

3. **Post-Prompt "Save as Skill" CTA**:
   - After successful AI response, show small button/link
   - Opens skill generation modal with preview
   - User can edit before confirming save

## Files to Create/Modify

### New Files
- `server/db/models.js` - Add Skill and Category schemas
- `server/routes/skills.js` - Skills API endpoints
- `server/services/skillGenerator.js` - AI skill generation logic
- `public/js/skills.js` - Skills management frontend (refactored from app.js)
- `public/css/skills.css` - Skills-specific styles

### Modified Files
- `server/index.js` - Register skills routes
- `public/index.html` - Update skills modal HTML
- `public/js/app.js` - Integrate new skills system
- `public/js/api.js` - Add skills API functions
- `public/js/i18n.js` - Add new translation strings

## Errors Encountered
(None yet)

## Implementation Progress

### Phase 1 Complete - Files Changed:
- `server/db/models.js` - Added Skill and Category schemas with indexes
- `server/routes/skills.js` - Full CRUD + toggle + categories + tags endpoints
- `server/index.js` - Registered skills routes
- `public/js/api.js` - Added all skills API functions

### Phase 2 Complete - Files Changed:
- `server/services/skillGenerator.js` - AI skill generation using OpenAI
- `server/routes/skills.js` - Added `/generate` endpoint
- `public/index.html` - Added generate skill modal HTML
- `public/css/style.css` - Added generate skill modal styles + save as skill button
- `public/js/app.js` - Added generate skill functions and UI handlers
- `public/js/i18n.js` - Added translations for skill generation

### Phase 3 Complete - Files Changed:
- `public/index.html` - Redesigned skills modal with tabs (My Skills, Import), added edit skill modal
- `public/css/style.css` - Added skills tabs, search bar, server skills list, edit modal styles
- `public/js/app.js` - Added tab switching, server skills loading/rendering, edit modal functionality, integrated server skills with prompt building
- `public/js/i18n.js` - Added translations for tabs, search, edit modal, error messages

### Phase 3 Fixes:
- `public/js/app.js` - Server skills now included in prompt prefix, badge counts, token warning
- `server/services/skillGenerator.js` - Model selection now uses config
- `server/routes/skills.js` - Added per-user rate limit for skill generation
- `public/js/i18n.js` - Added missing load error string

### Phase 4 Complete:
- `public/index.html` - Added category/tag filters and tags datalist
- `public/js/app.js` - Wired category/tag filters and tags suggestions (API-backed)
- `public/css/style.css` - Added styles for filters
- `public/js/i18n.js` - Added filter labels

### Phase 5 Kickoff: Export/Import Features
- Server: implement `/api/skills/export` (bulk export .md or zip) and `/api/skills/import` (parse uploaded .md, create skills)
- Client: add export button(s) and import-to-server flow in Skills modal
- Shared: reuse YAML frontmatter parsing + validation rules
- i18n: add strings for export/import UI and errors
- QA: add basic manual checklist for export/import

### Phase 6 Kickoff: Migration & Testing
- Migration: sync localStorage skills to server on login (idempotent)
- Fallback: keep localStorage as offline cache; mark migrated flag
- Testing: add manual test cases for CRUD, generation, filters, import/export, migration
- Error handling: confirm 401/403/404/429 behaviors in UI

### Phase 5 Complete - Files Changed:
- `server/routes/skills.js` - Added import/export endpoints and markdown parsing/serialization helpers
- `public/js/api.js` - Added `exportSkills` and `importSkills` API helpers
- `public/index.html` - Added export buttons and import-to-server button/input
- `public/js/app.js` - Wired export/import flows and download helper
- `public/css/style.css` - Added styles for export/import actions
- `public/js/i18n.js` - Added export/import strings
- `server/routes/skills.js` - Import now supports bundled exports split by separator
- `public/index.html` - Moved skills status banner to be visible across tabs

### Phase 6 Complete - Files Changed:
- `public/js/app.js` - Added localStorage-to-server migration on init (idempotent)
- `public/index.html` - Added status area for skills actions
- `public/css/style.css` - Added success/error status styles
- `public/js/app.js` - Added export/import/migration status messages
- `public/js/i18n.js` - Added export/migration status strings
- `docs/skills_notes.md` - Added manual test checklist for export/import/migration
- `public/js/app.js` - Migration now uses fingerprint (not just count) for idempotency

## Status
**All Phases Complete** - Skills Manager enhancement fully implemented. Manual test checklist available in `docs/skills_notes.md`.
