# Document Parsing Library Notes

Last updated: 2026-02-07

## Libraries Used

### PDF: pdf.js

- CDN module: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs`
- Strength: reliable client-side text extraction from standard PDFs
- Limitation: scanned/image-only PDFs may return little or no text (no OCR)

### DOCX: mammoth.js

- CDN: `https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js`
- Strength: lightweight extraction of readable text from `.docx`
- Limitation: advanced formatting is not preserved

### TXT/MD: native FileReader

- No additional dependency
- UTF-8 text extraction

## Operational Notes

- Extraction happens in browser before API call.
- Very long extracted text is truncated to avoid model-context overflow.
- If extraction yields empty text, the UI warns the user.
