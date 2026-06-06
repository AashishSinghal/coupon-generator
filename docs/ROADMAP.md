# Roadmap — feature ideas

A backlog of features to make Coupon Press more appealing and cover more use
cases. Nothing here is committed work yet; it's a menu to pull from. Effort is a
rough estimate (S = small, M = medium, L = large). ★ = high impact.

## Make each coupon do more

- **★ QR / barcode per coupon (M)** — encode the coupon code as a scannable QR
  or Code-128 barcode, drawn as a second overlay. Turns printed art into a real
  redeemable coupon / event ticket / gift card. Client-side libraries only.
- **Extra text fields (M)** — beyond the number, add static or templated lines
  (e.g. "Valid till 31 Dec", store name, a sub-line), each with its own
  size/position/rotation controls.
- **Text styling (S–M)** — font family, weight, color, and an outline/stroke or
  background chip so the number stays legible on busy artwork. Currently the
  number is fixed bold-black Arial.

## Cover more numbering use cases

- **★ Import codes from CSV / paste (M)** — instead of a sequential `start→end`
  range, paste or upload a column of real codes (pre-generated vouchers,
  gift-card numbers, raffle IDs).
- **Pattern builder UI (S)** — prefix / number / zero-padding / suffix fields so
  users never have to learn the Python `{number:04d}` syntax.
- **Step, shuffle, exclusions (S)** — increment by N, randomize order, or skip
  specific numbers.

## Professional print output

- **★ Page size + orientation (S–M)** — A4 / Letter / A3 / custom mm, portrait
  or landscape. Today everything is A4-portrait.
- **Crop / cut marks + thin cut borders (M)** — so a print shop (or scissors)
  can trim coupons cleanly. High value since coupons are cut apart.
- **Adjustable margins & gutter (S)** — currently hard-coded (2pt margin / 1pt
  gutter, from the notebook).

## More output targets

- **Individual coupons as PNG → ZIP (M)** — for digital/email distribution, not
  just a print PDF.
- **Multi-page preview + page navigation (M)** — preview an arbitrary page N,
  not just page 1.
- **Avery / label-sheet presets (M)** — expands into name tags, labels, stickers.

## Quick wins / polish

- **Re-enable presets + export/import settings as JSON (S)** — the preset engine
  is already built and currently hidden (see `PresetBar.tsx`, `storage.ts`).
- **Drag-to-position on the page preview (S)** — was on the removed single-coupon
  preview; could return as a toggle on the page preview.
- **Preview zoom (S)**, **sample/template coupon image (S)**, **Web Worker
  generation (M)** for smoother large jobs.

## Recommended first wave

For maximum appeal and reach, in order:

1. **QR / barcode per coupon** — scannable, real-world coupons/tickets.
2. **Import codes (CSV / paste)** — bring-your-own pre-generated codes.
3. **Page size + crop marks** — professional printing beyond A4.
