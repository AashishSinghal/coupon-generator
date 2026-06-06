<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Coupon Press — Project Directives

A browser-only coupon **PDF generator**. Upload a coupon image, choose a
numbering pattern and layout, preview live, and download a print-ready PDF —
all client-side. It is a faithful port of the Python notebook at
`docs/Logo_coupon_printable.ipynb`.

## Prime directive: the notebook is the source of truth

`docs/Logo_coupon_printable.ipynb` defines the correct output. When changing any
rendering, layout, numbering, or PDF behaviour:

1. Re-read the relevant part of the notebook.
2. Match its math **exactly** (page size, margins, gutters, placement, font
   sizing, numbering).
3. Update `docs/NOTEBOOK_ANALYSIS.md` if the mapping changes.
4. Only deviate where the browser makes it unavoidable, and document the
   deviation in `NOTEBOOK_ANALYSIS.md` (see the "faithful deviations" section).

If this file or the spec disagrees with the notebook, **the notebook wins.**

## Hard constraints (from the spec)

- **No backend.** No API routes for generation, no FastAPI, no database, no
  external services. Everything runs in the browser.
- **Deploys on Vercel** as a static/SSG Next.js app. Don't add server-only deps
  to the generation path.
- Image stays **in memory only** (object URLs); never uploaded anywhere.
- Supported uploads: PNG, JPG, JPEG, WEBP. Reject others with a friendly error.
- Coupon range capped at **5000** (`MAX_COUPONS`).
- PDF generation must **not freeze the UI** — keep the `requestAnimationFrame`
  yield and progress callbacks in `pdf-generator.ts`.

## Architecture

The rendering engine is **pure TypeScript, framework-free** — keep it that way
so it stays testable and reusable.

```
src/
  lib/
    types.ts            CouponConfig + defaults (mirror notebook params)
    layout.ts           A4 geometry, cell sizing, placement (bottom-left origin)
    coupon-renderer.ts  canvas: upscale + draw code + resize  (no React)
    pdf-generator.ts    pdf-lib assembly + progress            (no React)
    number-generator.ts sequential codes
    validate.ts         field-level validation
    utils.ts            cn()
  utils/
    formatNumber.ts     Python str.format integer subset
    image.ts            file load / download helpers
  components/           SettingsPanel · CouponPreview · PagePreview · ProgressDialog · ImageDropzone
    ui/                 small shadcn-style primitives (button, field, switch, slider, card)
  app/                  page.tsx (wiring), layout.tsx, globals.css
```

Rules of thumb:
- New rendering/PDF logic goes in `src/lib` and must not import React.
- Previews and the PDF **must share the same renderer** (`coupon-renderer.ts`) so
  "what you see is what prints."
- Validation lives in `validate.ts`; surface errors inline, never block typing.

## Design language

Refined "press / ticket-stub" minimal: warm paper background, ink-black text, a
single vermilion **stamp** accent (`--color-stamp`), Bricolage Grotesque display
+ JetBrains Mono for codes/numbers. Keep it minimal and fully responsive
(two-column desktop, single-column mobile with a fixed generate bar). Tailwind
v4 with theme tokens in `globals.css` — use the tokens (`bg-paper`, `text-ink`,
`border-line`, `text-stamp`), don't hardcode hex in components.

## Workflow

- Verify with `npm run build` (type-check + build) before committing.
- This repo auto-deploys to Vercel on push to `main` — each commit is a live
  deploy, so keep `main` building.
- Commit messages: concise, imperative.
