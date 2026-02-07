# File Upload Notes (Current)

Last updated: 2026-02-07

## Purpose

File uploads enrich `[CONTEXT]` so the assistant can answer with grounded input.

## Supported Types

- Images: PNG, JPG/JPEG, GIF, WebP
- Documents: PDF, TXT, MD, DOCX

## Current Data Flow

### Frontend

1. User adds files via click, drag/drop, or image paste.
2. Images are optionally compressed and converted to base64.
3. Documents are parsed client-side into plain text (`extractedText`).
4. Payload is sent with structured prompt and history.

### Backend

1. `/api/chat` validates file count/type/size.
2. Documents keep `extractedText` (truncated to configured length).
3. Images keep base64 data.
4. OpenAI service injects document text into user context and sends images as data URLs.

## Limits

- Max files per request: 5
- Max file size: 20MB each
- Max extracted document text: 50,000 chars (truncated)

## Notes

- Files are not persisted as server-side artifacts.
- This flow is ChatGPT-only in the current product.
