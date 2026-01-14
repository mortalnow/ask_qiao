# Task Plan: Transform to Prompt-Based AI Education Service

## Goal
Transform "Ask Qiao" from a free-form multi-model chat interface into a structured prompt-based educational service with usage limits (5 free prompts per user), mandatory prompt builder, and admin approval workflow for usage extensions.

## Phases
- [x] Phase 1: Planning and research
- [x] Phase 2: Database schema changes
- [x] Phase 3: Backend API implementation
- [x] Phase 4: Frontend mandatory prompt builder
- [x] Phase 5: Admin panel enhancements
- [x] Phase 6: Testing and polish

## Key Questions
1. ~~How should usage be counted?~~ **Answer: Per prompt sent**
2. ~~What extension types should admin grant?~~ **Answer: Both fixed amounts (+N) and unlimited**
3. ~~How should admin be notified?~~ **Answer: UI-only (admin checks pending requests)**
4. How to handle existing users during migration?
5. Should there be a grace period or hard cutoff at 5 uses?

## Decisions Made
- **Usage counting**: Per prompt (not per session) - more granular control
- **Extension types**: Both fixed amounts and unlimited - flexibility for admin
- **Notification**: UI-only - simpler implementation, no email dependencies
- **Prompt builder**: Make mandatory, remove free-form input entirely
- **Admin auto-unlimited**: Admin users get `is_unlimited: true` automatically

## Technical Architecture

### Database Changes
```
User Schema:
  + usage_count: Number (default: 0)
  + usage_limit: Number (default: 5)
  + is_unlimited: Boolean (default: false)

New ExtensionRequest Schema:
  - user: ObjectId (ref: User)
  - reason: String
  - requested_amount: Number (null = unlimited)
  - status: enum ['pending', 'approved', 'rejected']
  - admin_response: String
  - granted_amount: Number
  - created_at: Date
  - resolved_at: Date
```

### API Endpoints to Add
```
User endpoints:
  POST /api/extension/request
  GET  /api/extension/status

Admin endpoints:
  GET  /api/admin/extensions
  POST /api/admin/extensions/:id/approve
  POST /api/admin/extensions/:id/reject
```

## Errors Encountered
- (none yet)

## Status
**COMPLETED** - All phases complete, test scripts updated
