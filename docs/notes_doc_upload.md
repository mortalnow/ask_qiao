# Research Notes: Document Parsing Libraries

## PDF Text Extraction

### Option 1: PDF.js (Mozilla) - RECOMMENDED
- **CDN**: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs`
- **Size**: ~500KB (can lazy load)
- **Browser Support**: All modern browsers
- **Pros**:
  - Official Mozilla library, well-maintained
  - Handles complex PDF layouts
  - Can extract text page by page
  - Works entirely client-side
- **Cons**:
  - Large bundle size
  - Scanned PDFs return empty text (no OCR)

**Usage Example**:
```javascript
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';

async function extractPDFText(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
}
```

### Option 2: pdf-parse (npm)
- Server-side only
- Not suitable for our ephemeral approach

## DOCX Text Extraction

### Option 1: Mammoth.js - RECOMMENDED
- **CDN**: `https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js`
- **Size**: ~50KB
- **Browser Support**: All modern browsers
- **Pros**:
  - Small bundle size
  - Extracts semantic text (ignores styling)
  - Can output HTML or plain text
  - Well-documented
- **Cons**:
  - Loses complex formatting
  - No support for older .doc format

**Usage Example**:
```javascript
async function extractDOCXText(arrayBuffer) {
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value; // Plain text content
}
```

### Option 2: docx-preview
- Focuses on rendering, not text extraction
- Not suitable for our use case

## Plain Text Files (.txt, .md)

### Native FileReader - RECOMMENDED
- No external library needed
- Built into all browsers
- Handles UTF-8 encoding

**Usage Example**:
```javascript
async function extractPlainText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file, 'UTF-8');
  });
}
```

## MIME Type Reference

| Extension | MIME Type |
|-----------|-----------|
| .txt | text/plain |
| .md | text/markdown, text/x-markdown |
| .pdf | application/pdf |
| .docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document |
| .doc | application/msword (NOT SUPPORTED - legacy format) |

## Library Loading Strategy

### Lazy Loading Approach
Load heavy libraries only when needed:

```javascript
let pdfJsLoaded = false;
let mammothLoaded = false;

async function loadPdfJs() {
  if (pdfJsLoaded) return;
  await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs');
  pdfJsLoaded = true;
}

async function loadMammoth() {
  if (mammothLoaded) return;
  // Mammoth uses global, so we use script tag
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
    script.onload = () => { mammothLoaded = true; resolve(); };
    document.head.appendChild(script);
  });
}
```

## Error Handling Considerations

1. **Empty PDF (scanned/image-only)**
   - Detection: Extracted text is empty or very short
   - Action: Fall back to binary for Gemini, show warning for OpenAI

2. **Corrupt File**
   - Detection: Library throws error during parsing
   - Action: Show user-friendly error message

3. **Encoding Issues**
   - Detection: Garbled text output
   - Action: Try different encodings or show warning

4. **Password-Protected PDF**
   - Detection: PDF.js throws authentication error
   - Action: Show "password protected" message

## Text Formatting for AI Context

When sending extracted text to AI, wrap in clear delimiters:

```
[DOCUMENT: filename.pdf]
--- Begin Document Content ---
(extracted text here)
--- End Document Content ---
```

This helps the AI understand the context source.
