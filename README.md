# Coupon Press

Generate **print-ready coupon book PDFs** in your browser. Upload a coupon
design, choose a numbering pattern and page grid, place the number, and download
a multi-page PDF — entirely client-side. No backend, no upload, no Python.

It's a faithful web port of a Python/reportlab notebook
([`docs/Logo_coupon_printable.ipynb`](docs/Logo_coupon_printable.ipynb)), which
remains the source of truth for the page geometry and numbering. See
[`docs/NOTEBOOK_ANALYSIS.md`](docs/NOTEBOOK_ANALYSIS.md) for the exact mapping.

**Live:** deployed on Vercel · **Repo:** https://github.com/AashishSinghal/coupon-generator

## Features

- **Upload any coupon image** — PNG, JPG, JPEG, or WEBP. Held in memory only;
  never uploaded anywhere.
- **Python-style numbering** — patterns like `A{number:04d}`, `PROMO-{number:05d}`,
  or `SAVE{number}`, generated sequentially from a start to an end number.
- **Page grid** — rows × columns per A4 page, with the notebook's exact margins,
  gutters, aspect-fit sizing, and placement.
- **Number overlay controls** — set the coupon number's **size**, **position**,
  and **rotation**. The artwork keeps the quality you uploaded (PNG embeds
  losslessly; JPEG embeds at high quality).
- **Live page preview** — page 1 renders at A4 proportions through the same
  canvas pipeline used for the PDF, always fitted to the viewport height.
- **Generates in-browser** — `pdf-lib` + Canvas, with a progress bar and a
  responsive (non-freezing) generation loop for large jobs (up to 5,000 coupons).
- **Remembers your settings** — your last configuration and recently used images
  are restored on your next visit (recent images via the File System Access API,
  re-opened only if still available at the same location).

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS · pdf-lib · HTML Canvas.
Everything runs on the client; the app deploys as a static Next.js site on Vercel.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build (also runs the type-check)
npm run start    # serve the production build
```

## How it works

The rendering engine is pure TypeScript and framework-free, so previews and the
final PDF share exactly one code path:

```
src/
  lib/
    types.ts            CouponConfig + defaults
    layout.ts           A4 geometry, cell sizing, placement (bottom-left origin)
    coupon-renderer.ts  canvas: draw the number onto the image
    pdf-generator.ts    pdf-lib page assembly + progress
    number-generator.ts sequential codes
    validate.ts         field-level validation
    storage.ts          persisted config + presets (localStorage)
    recent-images.ts    recent images via File System Access + IndexedDB
  utils/
    formatNumber.ts     Python str.format integer subset
    image.ts            load / thumbnail / pick / download helpers
  components/           SettingsPanel · PagePreview · ProgressDialog · ImageDropzone
    ui/                 small styled primitives
  app/                  page.tsx, layout.tsx, globals.css
```

1. The uploaded image is drawn to a canvas at native resolution.
2. The coupon number is drawn on top using the size/position/rotation controls.
3. Each coupon is embedded into an A4 page at the computed grid position.
4. `pdf-lib` assembles the pages and the browser downloads `coupon-book.pdf`.

## Deployment

Pushing to `main` triggers a Vercel deploy. The app is static and needs no
environment variables, server runtime, or database.

## Docs

- [`docs/SPEC.md`](docs/SPEC.md) — the original technical specification.
- [`docs/NOTEBOOK_ANALYSIS.md`](docs/NOTEBOOK_ANALYSIS.md) — how the notebook's
  logic maps to this implementation, and the documented deviations.
- [`docs/Logo_coupon_printable.ipynb`](docs/Logo_coupon_printable.ipynb) — the
  reference notebook (the source of truth).
- [`AGENTS.md`](AGENTS.md) / [`CLAUDE.md`](CLAUDE.md) — project directives for
  anyone (human or agent) working on the codebase.
