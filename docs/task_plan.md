# Task Plan: Add File Upload to Prompt Builder Context

## Goal
Add file upload functionality to the Context section of the Prompt Builder, supporting all file formats that OpenAI and Gemini LLMs support, with ephemeral (no server storage) file handling.

## Phases
- [x] Phase 1: Research - Understand current architecture and LLM file support
- [x] Phase 2: Design - Plan the implementation approach
- [x] Phase 3: Frontend - Add file upload UI to Prompt Builder Context
- [x] Phase 4: Backend - Handle file processing and pass to AI providers
- [x] Phase 5: Testing - Verify file upload works with both models

## Implementation Summary

### Files Modified
1. `public/index.html` - Added file upload zone HTML
2. `public/css/style.css` - Added file upload styles + file indicator + incompatible warning
3. `public/js/app.js` - File handling, base64 conversion, preview rendering, compatibility checks
4. `public/js/api.js` - Updated sendMessage to include files
5. `public/js/i18n.js` - Added file upload translations (zh-CN/en-US)
6. `server/routes/chat.js` - Accept and validate files in request
7. `server/services/openai.js` - Format multimodal messages for OpenAI
8. `server/services/gemini.js` - Format multimodal messages for Gemini
9. `server/index.js` - Increased body parser limit to 50MB
10. `api/index.js` - Increased body parser limit to 50MB (Vercel)

### Key Features Implemented
- Drag & drop file upload zone
- Click to select files
- **Clipboard paste support** for images (Ctrl+V / Cmd+V)
- Image thumbnail preview
- Document icon preview (PDF)
- File size validation (20MB max)
- File type validation per model
- File count limit (5 files max)
- Base64 encoding (ephemeral, no server storage)
- **Automatic image compression** for large files (>2MB)
- Clear files on form reset
- i18n support for both languages
- **Model compatibility warnings** (Gemini-only formats)
- **File indicator in message bubbles**
- **Visual incompatible file markers**
- **Keyboard accessibility** (Tab navigation, Enter/Space activation)
- **Progress bar** during file encoding
- **Loading state** with spinner animation

### Supported Formats
- **Both models**: PNG, JPEG, GIF, WebP (images)
- **Gemini only**: HEIC, HEIF, PDF

## Ralph Loop Progress

### Iteration 1: Core Implementation
- Added file upload UI to Context section
- Implemented base64 conversion and file validation
- Updated API client and backend routes
- Modified AI services for multimodal messages
- Added i18n translations

### Iteration 2: Polish and Safety
- Increased Express body parser limit (100KB → 50MB) for file uploads
- Added model compatibility warnings (Gemini-only format detection)
- Added file attachment indicator in user message bubbles
- Added visual "incompatible" styling for Gemini-only files when OpenAI selected
- Added new i18n keys for compatibility warnings

### Iteration 3: Bug Fixes and UX Improvements
- Fixed incompatible class not being removed when switching to Gemini
- Added loading state with spinner during file processing
- Improved mobile UX with touch feedback
- Verified all file paths and imports work correctly

### Iteration 4: Enhanced Accessibility and UX
- Added **clipboard paste support** for images (Ctrl+V / Cmd+V)
- Added **keyboard accessibility** for file zone (Tab focus, Enter/Space to activate)
- Added **progress bar** for file encoding (shows percentage during large file processing)
- Added ARIA attributes for screen reader support
- Added paste hint text in UI
- Added focus outline styles for keyboard navigation
- Updated i18n with new translation keys

### Iteration 5: Performance and Polish
- Added **automatic image compression** for large files (>2MB)
  - Uses canvas API to resize images to max 2048px dimension
  - Applies JPEG compression at 85% quality
  - Only uses compressed version if smaller than original
  - Logs compression results to console for debugging
- Verified memory management (Object URLs properly revoked)
- Final code quality review completed

## Status
**COMPLETED** - All 5 Ralph Loop iterations complete. Feature fully implemented with:
- Core file upload functionality
- Safety and compatibility features
- Bug fixes and mobile UX
- Accessibility improvements
- Performance optimizations
