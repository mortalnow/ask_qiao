# Implementation Checklist: Prompt-Based AI Service (Archived)

> Status: historical checklist from an earlier migration phase.
> It remains as implementation history and may not reflect the latest architecture decisions.

## Phase 2: Database Schema Changes

### server/db/models.js
- [x] Add `usage_count` field to User schema (Number, default: 0)
- [x] Add `usage_limit` field to User schema (Number, default: 5)
- [x] Add `is_unlimited` field to User schema (Boolean, default: false)
- [x] Create `ExtensionRequest` schema with all fields
- [x] Export `ExtensionRequest` model

### Migration Script (optional)
- [ ] Create script to set existing admins to is_unlimited=true

---

## Phase 3: Backend API Implementation

### server/middleware/auth.js
- [x] Create `checkUsageLimit` middleware
- [x] Export the new middleware
- [x] Create `incrementUsage` helper function

### server/routes/chat.js
- [x] Import `checkUsageLimit` middleware
- [x] Add middleware to POST `/` route
- [x] Increment `usage_count` after successful response
- [x] Return usage info in done event

### server/routes/extension.js (new file)
- [x] Create router with authenticateToken
- [x] POST `/request` - create extension request
- [x] GET `/status` - get user's extension request status

### server/routes/admin.js
- [x] Import `ExtensionRequest` model
- [x] GET `/extensions` - list all extension requests
- [x] POST `/extensions/:id/approve` - approve with amount
- [x] POST `/extensions/:id/reject` - reject with reason
- [x] GET `/users` - list all users with usage stats

### server/index.js
- [x] Import and mount extension routes

---

## Phase 4: Frontend - Mandatory Prompt Builder

### public/index.html
- [x] Remove or hide free-form textarea `#message-input`
- [x] Make prompt builder visible by default (not hidden)
- [x] Add usage counter display in header
- [x] Add extension request modal HTML
- [x] Add "Apply for unlimited" button next to usage counter

### public/js/app.js
- [x] Remove `handleSubmit` for free-form input
- [x] Create `sendPrompt` as the only submit path
- [x] Add `fetchUsageStatus()` on init
- [x] Add `updateUsageDisplay()` function
- [x] Add `showExtensionModal()` function
- [x] Add `handleExtensionSubmit()` function
- [x] Handle usage_limit_exceeded via onUsageLimitExceeded callback
- [x] Wire "Apply for unlimited" button to open modal

### public/js/api.js
- [x] Add `getUsageStatus()` function
- [x] Add `requestExtension(reason, amount)` function
- [x] Add `getExtensionRequests()` function (admin)
- [x] Add `approveExtension()` function (admin)
- [x] Add `rejectExtension()` function (admin)
- [x] Update `sendMessage` to handle usage limit errors

### public/css/style.css
- [x] Add usage counter styles
- [x] Add modal styles
- [x] Add mandatory prompt builder styles

---

## Phase 5: Admin Panel Enhancements

### public/admin.html
- [x] Add "Extension Requests" section
- [x] Add pending requests list container
- [x] Add approve/reject action buttons
- [x] Add stats for extensions (pending, approved, etc.)
- [x] Add filter tabs (pending, approved, rejected, all)

### public/js/admin.js
- [x] Add `loadExtensions()` function
- [x] Add `renderExtensions()` function
- [x] Add `renderExtensionStats()` function
- [x] Add `approveRequest()` global function
- [x] Add `rejectRequest()` global function
- [x] Add filter tab event listeners

---

## Phase 6: Testing and Polish

### Manual Testing
- [ ] Test new user gets 5 prompts
- [ ] Test usage counter updates correctly
- [ ] Test limit reached shows modal
- [ ] Test extension request submission
- [ ] Test admin sees pending requests
- [ ] Test admin approve flow
- [ ] Test admin reject flow
- [ ] Test user gets more uses after approval
- [ ] Test unlimited user has no counter

### i18n
- [x] Add all Chinese translations to i18n.js
- [x] Add all English translations to i18n.js
- [ ] Test language switching works with new strings

### CSS Styling
- [x] Style usage counter in header
- [x] Style limit reached modal
- [x] Style extension request form
- [x] Style admin extension requests section

---

## Files Summary

| File | Action |
|------|--------|
| `server/db/models.js` | Modify |
| `server/middleware/auth.js` | Modify |
| `server/routes/chat.js` | Modify |
| `server/routes/extension.js` | Create |
| `server/routes/admin.js` | Modify |
| `server/index.js` | Modify |
| `public/index.html` | Modify |
| `public/js/app.js` | Modify |
| `public/js/api.js` | Modify |
| `public/admin.html` | Modify |
| `public/js/admin.js` | Modify |
| `public/js/i18n.js` | Modify |
| `public/css/style.css` | Modify |
