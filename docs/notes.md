# Notes: Prompt-Based AI Service Transformation

## Current Codebase Analysis

### Existing Database Models (server/db/models.js)
- **User**: username, password_hash, is_admin, created_at
- **InviteCode**: code, used_by, used_at, created_at
- No usage tracking currently exists

### Existing Authentication (server/middleware/auth.js)
- JWT-based with 7-day expiration
- `authenticateToken` middleware extracts user from JWT
- `requireAdmin` middleware for admin-only routes
- Token contains: id, username, isAdmin

### Existing Chat Route (server/routes/chat.js)
- `/api/chat` - POST with streaming SSE response
- No usage tracking or limits
- Accepts: message, model, history[]

### Existing Prompt Builder (public/index.html, public/js/app.js)
- Already has full prompt builder UI!
- Fields: [PERSONA], [TASK], [CONTEXT], [FORMAT], [REFERENCES]
- Currently OPTIONAL - users can bypass with free-form input
- `generatePrompt()` function builds structured prompt

### Existing Admin Panel (public/admin.html, server/routes/admin.js)
- Invite code management only
- Generate, list, delete invite codes
- Stats display (total, used, unused)

## Implementation Notes

### Phase 2: Schema Changes
Files to modify:
- `server/db/models.js` - Add fields to User, create ExtensionRequest

Migration strategy:
- Existing users: usage_count=0, usage_limit=5, is_unlimited=false
- Admin users: Set is_unlimited=true in migration script

### Phase 3: Backend API
Files to modify:
- `server/middleware/auth.js` - Add checkUsageLimit middleware
- `server/routes/chat.js` - Add usage tracking after successful response
- `server/routes/admin.js` - Add extension request endpoints
- Create `server/routes/extension.js` - User-facing extension endpoints

Key logic:
```javascript
// In chat.js - after successful stream
if (!req.dbUser.is_unlimited) {
  await User.findByIdAndUpdate(req.user.id, { $inc: { usage_count: 1 } });
}
```

### Phase 4: Frontend Changes
Files to modify:
- `public/index.html` - Remove free-form textarea, show usage counter
- `public/js/app.js` - Remove direct input handling, add limit modal
- `public/js/api.js` - Add extension API functions

UI Changes:
1. Remove `#message-input` textarea (or make it readonly/hidden)
2. Prompt builder becomes the ONLY input method
3. Add usage counter in header: "3/5 prompts used"
4. Add "Request Extension" modal when limit reached

### Phase 5: Admin Panel
Files to modify:
- `public/admin.html` - Add extension requests section
- `public/js/admin.js` - Add extension management functions

New admin section:
- Pending requests list with user info
- Approve button with amount picker (5, 10, 20, unlimited)
- Reject button with reason input
- Stats: pending count, approved today, etc.

## i18n Strings Needed

### Chinese (zh-CN)
```
usage.counter: "已使用 {used}/{limit} 次"
usage.unlimited: "无限制"
usage.limitReached: "您已用完 {limit} 次免费提问"
extension.request: "申请更多次数"
extension.reason: "申请理由"
extension.pending: "申请处理中"
extension.approved: "已批准"
extension.rejected: "已拒绝"
admin.extensions: "使用申请"
admin.pendingRequests: "待处理申请"
```

### English (en)
```
usage.counter: "{used}/{limit} prompts used"
usage.unlimited: "Unlimited"
usage.limitReached: "You've used all {limit} free prompts"
extension.request: "Request more"
extension.reason: "Reason for request"
extension.pending: "Request pending"
extension.approved: "Approved"
extension.rejected: "Rejected"
admin.extensions: "Extension Requests"
admin.pendingRequests: "Pending Requests"
```

## Open Questions
1. Should rejected users be able to re-request? (Probably yes, with cooldown?)
2. Show usage stats publicly or just to admin? (Just counter to user)
3. Email field needed for users? (No, keep it simple for now)
