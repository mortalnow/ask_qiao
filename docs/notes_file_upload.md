# Notes: File Upload Feature Research

## Current Architecture

### Frontend Flow
1. Prompt Builder has 5 fields: PERSONA, TASK, CONTEXT, FORMAT, REFERENCES
2. `sendPrompt()` in `app.js` builds text message from fields
3. Calls `window.API.sendMessage(message, model, history, ...)`
4. Messages are text-only strings

### Backend Flow
1. `POST /api/chat` receives `{ message, model, history }`
2. Validates and sanitizes text message (max 32KB)
3. Passes to AI service's `streamChat(messages, onChunk, onDone, onError)`
4. Services use provider SDKs to stream responses

### AI Service Message Format
- **OpenAI**: `{ role: 'user', content: 'text' }`
- **Gemini**: `{ role: 'user', parts: [{ text: 'text' }] }`

## LLM File Format Support

### OpenAI (GPT-4 Vision / GPT-5)
**Supported Image Formats:**
- PNG, JPEG, GIF (static), WebP
- Max file size: 20MB per image
- Max dimensions: 2048x2048 (larger images are resized)

**Message Format with Images:**
```javascript
{
  role: 'user',
  content: [
    { type: 'text', text: 'What is in this image?' },
    { type: 'image_url', image_url: { url: 'data:image/png;base64,...' } }
  ]
}
```

### Gemini
**Supported Formats:**
- Images: PNG, JPEG, WebP, HEIC, HEIF, GIF
- Documents: PDF (up to 3600 pages)
- Audio: MP3, WAV, AIFF, AAC, OGG, FLAC
- Video: MP4, MPEG, MOV, AVI, MKV, WEBM, etc.

**Max Sizes:**
- Images: 20MB inline, larger via File API
- PDF: 30MB inline
- Audio/Video: Various limits

**Message Format with Files:**
```javascript
{
  role: 'user',
  parts: [
    { text: 'What is in this image?' },
    { inlineData: { mimeType: 'image/png', data: 'base64...' } }
  ]
}
```

## Implementation Strategy

### Ephemeral File Handling (No Server Storage)
1. **Frontend**: Convert files to base64 using FileReader
2. **API**: Send base64 data in JSON body (larger payload)
3. **Backend**: Process in memory, pass to AI, never write to disk
4. **Response**: Stream back, file data garbage collected

### Supported Formats (Common between providers)
**Images (both support):**
- PNG, JPEG, GIF, WebP

**Gemini-only extras:**
- HEIC, HEIF (images)
- PDF (documents)
- Audio/Video files

### UI Design for Context Section
Add file upload area to Context field:
- Drag & drop zone
- Click to select files
- Preview thumbnails for images
- File name/size for documents
- Remove button per file
- Max 5 files limit
- Visual indicator for model compatibility

### Size Considerations
- Base64 encoding increases size by ~33%
- 20MB image → ~27MB base64
- JSON body limit may need adjustment
- Consider compression for large images

## Key Implementation Files

### Frontend Changes
- `public/index.html` - Add file upload UI
- `public/js/app.js` - Handle file selection, base64 conversion
- `public/js/api.js` - Modify sendMessage to include files
- `public/css/style.css` - File upload styles

### Backend Changes
- `server/routes/chat.js` - Accept files array, pass to services
- `server/services/openai.js` - Format multimodal messages
- `server/services/gemini.js` - Format multimodal messages

## Decisions Made
- NO server-side file storage (ephemeral)
- Base64 encoding for file transfer
- Frontend handles file conversion
- Backend passes through to AI without saving
