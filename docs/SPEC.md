# Coupon PDF Generator Web App — Technical Specification

> This is the original delivery brief for the project, preserved as the contract
> the implementation is measured against. The reference notebook
> ([`Logo_coupon_printable.ipynb`](./Logo_coupon_printable.ipynb)) is the source
> of truth; where this spec and the notebook disagree, the notebook wins. See
> [`NOTEBOOK_ANALYSIS.md`](./NOTEBOOK_ANALYSIS.md) for the exact extraction of
> the notebook's logic and how each piece maps to the TypeScript port.

## Project Goal

Convert the existing Python notebook (`Logo_coupon_printable.ipynb`) into a
browser-based web application that can be deployed entirely on Vercel without
requiring a dedicated backend server. The generated PDFs should match the output
of the notebook as closely as possible.

## Critical Requirement

The notebook is the source of truth. The implementation must:

1. Read and understand the entire notebook.
2. Identify all configurable parameters.
3. Reproduce the rendering logic exactly.
4. Reproduce coupon placement and page layout exactly.
5. Reproduce numbering logic exactly.
6. Reproduce PDF dimensions exactly.

If implementation details in this specification differ from the notebook, the
notebook takes precedence.

## Deployment Requirements

- **Hosting:** Vercel
- **Architecture:** Static frontend, client-side PDF generation, no dedicated
  backend server, no FastAPI, no database. All processing occurs in the browser.

## Technology Stack

- **Framework:** Next.js (latest stable)
- **Language:** TypeScript
- **UI:** Tailwind CSS + shadcn-style components
- **PDF Generation:** pdf-lib
- **Image Manipulation:** HTML Canvas API
- **State Management:** React hooks (no Redux)
- **File Upload:** Browser local file upload only

## Functional Requirements

### Feature 1 — Upload Coupon Template
Upload a coupon image (PNG, JPG, JPEG, WEBP). Display it, store it in memory
only (no server upload), reject unsupported types with friendly errors.

### Feature 2 — Configuration Form
Expose every configurable value from the notebook: coupon image, number pattern
(e.g. `A{number:04d}`), starting number, ending number (must be ≥ start), rows
per page, columns per page, DPI, JPEG quality, upscale factor, and the
"preserve original size" boolean. Defaults come from the notebook.

### Feature 3 — Live Preview
A single-coupon preview (image + generated number, exact positioning) and a
page-1 preview (exact rows, columns, spacing, margins, scaling). Both update
immediately when settings change.

### Feature 4 — PDF Generation
Generate the PDF entirely in the browser — no server-side rendering, no API
calls, no external services. Output should match the notebook. Page size and
numbering use notebook values exactly.

### Feature 5 — Download PDF
"Generate PDF" creates and auto-downloads the file as `coupon-book.pdf`.

## UI Layout
- **Desktop:** two columns — configuration panel (left), live preview (right).
- **Mobile:** single column — settings first, preview second, generate button
  fixed near the bottom.

## Performance Requirements
- Target 100–5000 coupons.
- Preview updates under ~500ms.
- PDF generation must not freeze the UI — use async processing,
  `requestAnimationFrame`, and progress updates for large jobs.

## UX Requirements
- Loading state with a progress bar (e.g. 25% → 100%).
- Inline validation: invalid number range, unsupported image format, rows/cols
  must be greater than zero.

## Accessibility
Semantic HTML, keyboard accessible, visible focus states, labels for all inputs.

## Project Structure (target)
```
src/
  components/  CouponPreview · PagePreview · SettingsPanel · ProgressDialog
  lib/         pdf-generator · coupon-renderer · number-generator · layout
  utils/       formatNumber · image
  app/         page.tsx · layout.tsx
```

## Implementation Strategy
1. **Study the notebook** — number rendering, fonts, positioning, scaling,
   layout math, PDF dimensions. Document findings (done in `NOTEBOOK_ANALYSIS.md`).
2. **Pure TypeScript rendering engine** — `renderCoupon()`, `renderPage()`,
   `generatePdf()`, independent of React.
3. **React UI** — wire controls and previews.
4. **PDF generation** — verify output against the notebook.
5. **Testing** — use the notebook-generated PDF as the baseline; compare coupon
   placement, text position, margins, scaling, page count.

## Definition of Done
The app can upload a coupon image, configure numbering, show coupon + page
previews, generate and download a PDF in-browser, deploy on Vercel, and produce
output visually matching the notebook — with no Python runtime, backend,
database, or external services in production.
