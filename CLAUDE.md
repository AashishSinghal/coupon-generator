# Coupon Press

Project directives live in **[AGENTS.md](./AGENTS.md)** — read it before working
in this repo. The short version:

- **The notebook (`docs/Logo_coupon_printable.ipynb`) is the source of truth** for
  all layout, numbering, and rendering. Match it exactly; document any deviation
  in `docs/NOTEBOOK_ANALYSIS.md`.
- **Browser-only, no backend.** Everything runs client-side; deploys static on
  Vercel. The image never leaves the browser.
- The rendering engine in `src/lib` is **pure TypeScript** — no React imports.
- Previews and the PDF share one renderer so the preview is exact.
- Verify with `npm run build` before committing; `main` auto-deploys to Vercel.

@AGENTS.md
