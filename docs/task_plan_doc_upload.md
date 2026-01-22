# Task Plan: Document Text Extraction for Context Upload

## Goal
Extend the existing file upload feature to support document files (PDF, TXT, MD, DOCX) with **text extraction**, enabling these documents to be used as context for all AI models (both OpenAI and Gemini).

## Current State Analysis

### Existing File Upload Implementation
- **Location**: Context field in prompt builder
- **Current Support**: Images (PNG, JPG, GIF, WebP) + PDF (Gemini only, as binary)
- **Architecture**: Base64 encoding → API → AI provider
- **Limitations**:
  - PDFs sent as binary (only Gemini supports, no text extraction)
  - No text file support (.txt, .md)
  - No Word document support (.docx)
  - OpenAI can't process PDF content

### Key Files to Modify
| File | Changes |
|------|---------|
| `public/index.html` | Update accepted file types display, add library scripts |
| `public/js/app.js` | Add document parsing, text extraction logic |
| `server/routes/chat.js` | Validate new document types, handle extractedText |
| `server/services/openai.js` | Handle document text content |
| `server/services/gemini.js` | Handle document text content |

## Phases

- [x] Phase 1: Setup - Add document parsing libraries
- [x] Phase 2: Frontend - Implement client-side document parsing
- [x] Phase 3: Backend - Update API validation and handling
- [x] Phase 4: AI Integration - Update services to handle document text
- [x] Phase 5: Testing - End-to-end testing with all file types

## Key Design Decisions

### 1. Client-side vs Server-side Parsing
**Decision**: Client-side parsing
- Reduces server load
- Faster user feedback
- Works with ephemeral file approach (no server storage)
- Libraries: pdf.js (Mozilla), mammoth.js

### 2. Data Structure
Current:
```javascript
{ name, mimeType, data: base64 }
```

New:
```javascript
{
  name,
  mimeType,
  data: base64,           // Original file (for images/binary)
  extractedText?: string, // For documents - text content
  isDocument: boolean     // Flag to indicate document type
}
```

### 3. File Type Support Matrix

| Type | Extension | MIME Type | Parsing Method | AI Support |
|------|-----------|-----------|----------------|------------|
| Plain Text | .txt | text/plain | FileReader.readAsText | All models |
| Markdown | .md | text/markdown | FileReader.readAsText | All models |
| PDF | .pdf | application/pdf | pdf.js (text extraction) | All models |
| Word Doc | .docx | application/vnd.openxmlformats... | mammoth.js | All models |
| Images | .png, .jpg, etc. | image/* | Current base64 approach | Model-specific |

### 4. Text Length Limits
- Maximum extracted text: 50,000 characters
- If exceeded: Truncate with warning message
- Rationale: Prevent context window overflow and API errors

## Dependencies to Add

### Client-side (CDN)
```html
<!-- PDF.js for PDF text extraction -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs" type="module"></script>

<!-- Mammoth.js for DOCX parsing -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"></script>
```

## Detailed Implementation Plan

### Phase 1: Setup
- [ ] Add pdf.js CDN link to index.html
- [ ] Add mammoth.js CDN link to index.html
- [ ] Update accepted file types in file input element
- [ ] Update file format display text

### Phase 2: Frontend Document Parsing
- [ ] Add `DOCUMENT_TYPES` constant for document MIME types
- [ ] Create `extractTextFromPDF()` function using pdf.js
- [ ] Create `extractTextFromDOCX()` function using mammoth.js
- [ ] Create `extractTextFromPlainText()` function for .txt/.md
- [ ] Create unified `extractDocumentText()` dispatcher function
- [ ] Update `handleFileSelection()` to call text extraction
- [ ] Update file preview UI for documents (show text preview)
- [ ] Add truncation logic for long text (50K char limit)
- [ ] Update progress indicator for text extraction
- [ ] Remove model compatibility warnings for documents (now universal)

### Phase 3: Backend Validation
- [ ] Add new document MIME types to `supportedTypes`
- [ ] Add validation for `extractedText` field (string, max length)
- [ ] Update file processing to handle document type
- [ ] Add text length validation (server-side backup)

### Phase 4: AI Integration
- [ ] Update OpenAI service to inject extracted text as context
- [ ] Update Gemini service to use extracted text (prefer over binary)
- [ ] Format document content with clear delimiters
- [ ] Test with both AI models

### Phase 5: Testing
- [ ] Test TXT file upload and text extraction
- [ ] Test MD file upload and text extraction
- [ ] Test PDF text extraction (single and multi-page)
- [ ] Test DOCX text extraction
- [ ] Test with GPT models
- [ ] Test with Gemini models
- [ ] Test error handling (corrupt files, empty files)
- [ ] Test text truncation warning
- [ ] Test mixed uploads (documents + images)

## UI Changes

### File Upload Zone
- Update accepted formats text: "支持: PNG, JPG, PDF, TXT, MD, DOCX"
- Keep same drag-drop, click, paste interface

### File Preview
- Documents show: File icon + name + extracted text preview (first 200 chars)
- "View full text" expandable option
- Character count display

### Warnings
- Show truncation warning if text > 50K chars
- Remove "Gemini only" warning for PDF (now works with all models)

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large PDF text overflows context | High | 50K char limit with truncation |
| Complex DOCX formatting lost | Medium | Extract plain text, warn user |
| PDF.js bundle size (~500KB) | Medium | Lazy load only when PDF uploaded |
| Scanned PDFs (no text) | Medium | Show warning, fall back to binary for Gemini |
| Text encoding issues | Low | Force UTF-8, show encoding error |

## Success Criteria
1. ✓ Users can upload .txt, .md, .pdf, .docx files
2. ✓ Text is extracted client-side and sent to AI as context
3. ✓ Works with both GPT and Gemini models (universal support)
4. ✓ Clear error messages for unsupported/corrupt files
5. ✓ Text truncation with user notification for large documents
6. ✓ File preview shows document content preview

## Status
**COMPLETED** - All phases implemented and tested

### Implementation Summary (2026-01-23)

**Files Modified:**
1. `public/index.html` - Added pdf.js and mammoth.js CDN, updated file input accept
2. `public/js/app.js` - Added document parsing, text extraction, file handling
3. `public/js/i18n.js` - Added document-related translations
4. `public/css/style.css` - Added document preview styles
5. `server/routes/chat.js` - Updated validation for document types
6. `server/services/openai.js` - Handle document text injection
7. `server/services/gemini.js` - Handle document text injection
8. `scripts/test-backend-direct.js` - Updated test to pass files parameter

**Key Features:**
- PDF text extraction using pdf.js (lazy loaded)
- DOCX text extraction using mammoth.js
- TXT/MD text reading using FileReader
- Text truncation at 50K characters with warning
- Document preview with text excerpt and character count
- Universal model support (documents work with both GPT and Gemini)
- Clear delimiters for document context in AI prompts

---

## Notes
- This extends the existing file upload feature (docs/task_plan.md - COMPLETED)
- Maintains ephemeral file handling (no server storage)
- Backward compatible with existing image upload flow
