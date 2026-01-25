# Skills Manager Enhancement - Research Notes

## Current Implementation Analysis

### Existing Skills System (localStorage)
- Location: `public/js/app.js` lines 103-107, 1030-1368
- Storage key: `ask_qiao_skills`
- Data structure:
  ```javascript
  { id, name, description, content, enabled, addedAt }
  ```
- Features:
  - Upload .md files
  - Parse YAML frontmatter for name/description
  - Toggle skills on/off
  - Delete individual skills
  - Clear all skills
  - Token warning when content > 2000 chars
  - Skills prepended to prompts as `[SKILLS]` section

### Limitations of Current System
1. Skills lost if browser data cleared
2. Not synced across devices
3. No editing after upload
4. No organization (categories/tags)
5. No skill creation from prompts
6. No export capability

## AI Skill Generation Approach

### Prompt for AI Skill Generation
```
Given the following prompt and response from a chat conversation, extract and generalize this into a reusable "skill" that can be applied to future prompts.

A skill should:
1. Capture the core capability, expertise, or role demonstrated
2. Be general enough to apply to similar tasks
3. Remove specific details while keeping the useful patterns
4. Include clear instructions the AI should follow

Original Prompt:
[PERSONA]
{persona}

[TASK]
{task}

[CONTEXT]
{context}

---

Please generate a skill in this format:
---
name: [Short descriptive name]
description: [One-sentence description of what this skill does]
---

[Skill content in markdown - instructions, guidelines, patterns to follow]
```

### Example Transformation
**Original Prompt:**
```
[PERSONA]
You are a senior React developer with expertise in TypeScript and testing.

[TASK]
Review this component and suggest improvements for performance and type safety.

[CONTEXT]
Working on a large e-commerce application with strict performance requirements.
```

**Generated Skill:**
```
---
name: React Code Reviewer
description: Expert code review for React/TypeScript with focus on performance and type safety
---

# React Code Review Expert

When reviewing React code, I will:

1. **Performance Analysis**
   - Identify unnecessary re-renders
   - Check for proper memoization (useMemo, useCallback, React.memo)
   - Review data fetching patterns
   - Suggest code splitting opportunities

2. **Type Safety**
   - Verify TypeScript types are properly defined
   - Check for any/unknown usage
   - Ensure props interfaces are complete
   - Validate generic constraints

3. **Best Practices**
   - Component composition patterns
   - Hook dependency arrays
   - Error boundary usage
   - Accessibility considerations

Output format: Structured review with severity levels (Critical, Warning, Suggestion)
```

## UI/UX Design Notes

### Skills Modal Layout
```
┌─────────────────────────────────────────────────────┐
│  Skills Manager                              [X]    │
├─────────────────────────────────────────────────────┤
│  [My Skills]  [Create New]  [Import]               │
├─────────────────────────────────────────────────────┤
│  🔍 Search...           [Category ▼] [Tags ▼]      │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐  │
│  │ ☑ React Code Reviewer                    [⋮] │  │
│  │   Expert code review for React/TypeScript    │  │
│  │   📁 Development  🏷 react, typescript       │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ ☐ Technical Writer                       [⋮] │  │
│  │   Write clear technical documentation        │  │
│  │   📁 Writing  🏷 docs, technical             │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌ Token Usage ──────────────────────────────────┐ │
│  │ ██████░░░░ 1,234 / 4,000 chars                │ │
│  └───────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│                                    [Done]          │
└─────────────────────────────────────────────────────┘
```

### Skill Edit Modal
```
┌─────────────────────────────────────────────────────┐
│  Edit Skill                                  [X]    │
├─────────────────────────────────────────────────────┤
│  Name: [React Code Reviewer                      ]  │
│                                                     │
│  Description:                                       │
│  [Expert code review for React/TypeScript with... ] │
│                                                     │
│  Category: [Development          ▼] [+ New]        │
│                                                     │
│  Tags: [react ×] [typescript ×] [Add tag...]       │
│                                                     │
│  Content:                                           │
│  ┌──────────────────────────────────────────────┐  │
│  │ # React Code Review Expert                   │  │
│  │                                              │  │
│  │ When reviewing React code, I will:           │  │
│  │ ...                                          │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [Delete]                      [Cancel] [Save]     │
└─────────────────────────────────────────────────────┘
```

### "Save as Skill" Flow
After a successful chat response, show a subtle CTA:
```
┌─────────────────────────────────────────────────────┐
│  [AI Response content...]                           │
│                                                     │
│  ────────────────────────────────────────────────── │
│  💡 This was helpful? [Save as Skill] to reuse it  │
└─────────────────────────────────────────────────────┘
```

Clicking opens:
```
┌─────────────────────────────────────────────────────┐
│  Generate Skill from Prompt                  [X]    │
├─────────────────────────────────────────────────────┤
│  📝 Analyzing your prompt to create a reusable     │
│     skill...                                        │
│                                                     │
│  [█████████░░░░░░░░░░░]                            │
├─────────────────────────────────────────────────────┤
│  ▼ Preview Generated Skill                         │
│  ┌──────────────────────────────────────────────┐  │
│  │ Name: React Code Reviewer                    │  │
│  │ Description: Expert code review...           │  │
│  │ ─────────────────────────────────            │  │
│  │ [Content preview...]                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  [Edit Before Saving]        [Cancel] [Save Skill] │
└─────────────────────────────────────────────────────┘
```

## Migration Strategy

### Phase 1: Backward Compatibility
1. Keep localStorage as cache/fallback
2. On login, sync localStorage skills to server
3. Server is source of truth, localStorage is cache
4. If offline, use localStorage; sync when online

### Migration Script
```javascript
async function migrateLocalSkillsToServer() {
  const localSkills = JSON.parse(localStorage.getItem('ask_qiao_skills') || '[]');
  if (localSkills.length === 0) return;

  for (const skill of localSkills) {
    try {
      await API.createSkill({
        name: skill.name,
        description: skill.description,
        content: skill.content,
        enabled: skill.enabled
      });
    } catch (err) {
      console.error('Failed to migrate skill:', skill.name, err);
    }
  }

  // Clear localStorage after successful migration
  // localStorage.removeItem('ask_qiao_skills');
  // Or keep as backup: localStorage.setItem('ask_qiao_skills_migrated', 'true');
}
```

## Implementation Priority

### MVP (Must Have)
1. ✅ MongoDB storage schema
2. ✅ CRUD API endpoints
3. ✅ Skills list UI with enable/toggle
4. ✅ Skill edit modal
5. ✅ "Save as Skill" from prompt (manual)

### Phase 2 (AI Generation)
1. AI skill generation endpoint
2. Generation progress UI
3. Edit before save flow

### Phase 3 (Organization)
1. Categories CRUD
2. Tags input/autocomplete
3. Filter by category/tags
4. Search skills

### Phase 4 (Import/Export)
1. Export as .md (single or bulk)
2. Import .md files (existing feature, keep)
3. Batch operations

## Technical Considerations

### API Response Format
```javascript
// GET /api/skills
{
  skills: [
    { _id, name, description, category, tags, enabled, updatedAt },
    ...
  ],
  pagination: { page, limit, total, pages }
}

// GET /api/skills/:id
{
  skill: { _id, name, description, content, category, tags, enabled, createdAt, updatedAt }
}

// POST /api/skills/generate
{
  skill: { name, description, content },  // Preview only, not saved
  prompt_used: { persona, task, context }  // For reference
}
```

### Error Handling
- 401: Not authenticated
- 403: Not skill owner
- 404: Skill not found
- 400: Validation error (missing name, content too long, etc.)
- 429: Rate limit (for generation endpoint)

### Rate Limiting for AI Generation
- Max 10 skill generations per hour per user
- Each generation costs 1 "usage" if usage limits enabled
- Or: generation is free, only chat costs usage

## Manual Test Checklist (Phase 5/6)

### Export
- Export all skills from "My Skills" tab; verify `.md` download includes frontmatter and content
- Export enabled skills only; confirm disabled skills are excluded
- Export with no skills; expect empty bundle (still valid markdown) and no crash
- Export error (simulate by disabling server); status shows export error message

### Import to Server
- Import a single valid `.md` (with frontmatter); verify skill appears in server list
- Import multiple `.md` files; check created count matches
- Import a bundled export `.md` with separators; verify multiple skills created
- Import with duplicate name; ensure skipped count increments
- Import invalid type; UI shows error status
- Import empty file; server reports error in results

### Migration (localStorage → server)
- Add local skills, refresh; confirm they appear in server list after migration
- Verify migration is idempotent (no duplicates on reload)
- Simulate migration failure (server down); ensure error status appears when opening Skills modal

### Filters + Tags
- After import, confirm category/tag filters update with new values
- Tag datalist suggests existing tags in edit/generate modals
