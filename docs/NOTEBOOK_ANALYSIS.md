# Notebook Analysis — `Logo_coupon_printable.ipynb`

This document is the bridge between the reference notebook (the **source of
truth**) and the TypeScript port. Every behaviour below was extracted from
`generate_coupon_pdf()` and reproduced in `src/lib`. If you change the app,
re-read the notebook and update this file alongside the code.

## Parameters and defaults

The notebook function signature:

```python
def generate_coupon_pdf(
    coupon_image_path,
    output_pdf_path,
    rows_per_page=3,
    cols_per_page=2,
    coupon_code_pattern="A{number:04d}",
    start_number=1,
    end_number=9999,
    dpi=300,
    jpeg_quality=98,
    upscale_factor=2.0,
    preserve_original_size=False,
):
```

| Parameter | Notebook default | App | Mapped to |
|---|---|---|---|
| `rows_per_page` | 3 | 3 | `CouponConfig.rows` |
| `cols_per_page` | 2 | 2 | `CouponConfig.cols` |
| `coupon_code_pattern` | `A{number:04d}` | `A{number:04d}` | `CouponConfig.pattern` |
| `start_number` | 1 | 1 | `CouponConfig.startNumber` |
| `end_number` | 9999 | **100** | `CouponConfig.endNumber` |
| `dpi` | 300 | — | dropped (see below) |
| `jpeg_quality` | 98 | — | dropped (see below) |
| `upscale_factor` | 2.0 | — | dropped (see below) |
| `preserve_original_size` | False | — | dropped (see below) |

**Deliberate change to `end_number`:** the function default is 9999, but the
notebook's interactive `main()`/`quick_demo_hq()` use 100. We default to 100 so a
first run is small and fast rather than a 9999-coupon PDF.

### Product change — quality knobs replaced by number controls

By product decision, the four quality parameters (`dpi`, `jpeg_quality`,
`upscale_factor`, `preserve_original_size`) are **not exposed**. The source image
is kept at its uploaded resolution and embedded losslessly (PNG) — or as
high-quality JPEG when the upload was a JPEG — so there is nothing to "tune."

In their place, the user controls the **coupon number overlay**:

| Control | Field | Default | Notes |
|---|---|---|---|
| Size | `fontScale` | 0.5 | Fraction of the image's smaller side; auto-shrinks to fit width. |
| Position X | `posX` | 0.5 | 0..1 across width; also set by dragging on the preview. |
| Position Y | `posY` | 0.5 | 0..1 down height. |
| Rotation | `rotation` | 0° | Rotates the number about its center. |

The default is a **large, centered** number (≈50% of the image's smaller side).
The number is always shrunk to fit ~94% of the image width, so a big or long
code can't overflow off the coupon. The notebook's bold-black styling is kept;
size/position/rotation are the product extension.

## Numbering — `src/lib/number-generator.ts` + `src/utils/formatNumber.ts`

```python
all_numbers = list(range(start_number, end_number + 1))
coupon_code = coupon_code_pattern.format(number=number)
```

- Sequential, inclusive of both ends, **not random**.
- Codes are produced with Python's `str.format(number=n)`. `formatNumber.ts`
  re-implements the integer subset of the format mini-language
  (`[[fill]align][sign][#][0][width][grouping][.prec][type]`, types `b c d o x X n`),
  so `A{number:04d}` → `A0001`, `PROMO-{number:05d}` → `PROMO-00001`,
  `SAVE{number}` → `SAVE1`. Literal braces use `{{` / `}}`.

## Page geometry — `src/lib/layout.ts`

```python
page_width, page_height = A4         # reportlab A4 in points
margin = 2
gutter = 1
available_width  = page_width  - 2*margin
available_height = page_height - 2*margin
total_gutter_width  = gutter*(cols-1) if cols > 1 else 0
total_gutter_height = gutter*(rows-1) if rows > 1 else 0
coupon_width  = (available_width  - total_gutter_width ) / cols
coupon_height = (available_height - total_gutter_height) / rows
```

- A4 = `595.2755905511812 × 841.8897637795276` pt (reproduced exactly).
- `margin = 2 pt`, `gutter = 1 pt`.

Then the cell is fitted to the image. Default (aspect-fit):

```python
aspect_ratio = original_width / original_height
if coupon_width / coupon_height > aspect_ratio:
    coupon_width = coupon_height * aspect_ratio
else:
    coupon_height = coupon_width / aspect_ratio
```

`preserve_original_size = True` instead fits by physical size at DPI:

```python
original_width_points  = (original_width  * 72) / dpi
original_height_points = (original_height * 72) / dpi
scale_factor = min(coupon_width/original_width_points,
                   coupon_height/original_height_points)
coupon_width  = original_width_points  * scale_factor
coupon_height = original_height_points * scale_factor
```

**Subtle detail reproduced:** after fitting, the placement math reuses the
*shrunken* `coupon_width/height`, so coupons pack from the top-left margin with
the gutter rather than filling the page symmetrically.

## Placement — `cellPosition()` in `src/lib/layout.ts`

```python
x = margin + col * (coupon_width + gutter)
y = page_height - margin - (row + 1) * coupon_height - row * gutter
```

reportlab and pdf-lib both use a **bottom-left origin**, so this transfers with
no Y flip. Coupons fill **row-major** (outer loop rows, inner loop cols); a new
page starts every `rows * cols` coupons.

## Coupon rendering — `src/lib/coupon-renderer.ts`

The notebook upscales the source, draws the code, resizes to the DPI target, and
encodes JPEG on a white background:

```python
# upscale the source first (LANCZOS), slight sharpness 1.1
base_font_size = max(36, int(min(img_width, img_height) * 0.08))
font_size = int(base_font_size * upscale_factor)   # bold font
# bottom-center placement:
x = (img_width - text_width) // 2
y = img_height - text_height - max(40, int(img_height * 0.06))
# clamps: x >= 10; x+text_width <= img_width-10; y >= 10
# bold effect: draw text in a 3x3 grid of 1px offsets, fill black
# resize to (coupon_pts * dpi / 72), composite on white, JPEG(quality)
```

All geometry above is reproduced on a `<canvas>`: font sizing, bottom-center
placement, the edge clamps, and the 3×3 offset passes for faux-bold. The code is
drawn with `textBaseline = "top"` to match PIL's top-left text origin.

### Documented faithful deviations

These do not change layout, only micro-quality, and are unavoidable in-browser:

1. **Sharpness enhancement.** PIL applies `ImageEnhance.Sharpness` (1.1× on the
   source, 1.05× after resize). Canvas has no unsharp-mask primitive, so this is
   omitted.
2. **Resampling filter.** PIL uses LANCZOS; the browser uses its high-quality
   smoothing (`imageSmoothingQuality = "high"`). Visually equivalent for
   photographic coupon art.
3. **Font availability.** The notebook probes a long list of system fonts
   (Arial/Helvetica/Calibri/DejaVu…), bold preferred. The app uses a bold
   `Arial, Helvetica, sans-serif` canvas font, matching the notebook's first
   choices.

## PDF assembly — `src/lib/pdf-generator.ts`

- Target raster per coupon: `round(coupon_pts * dpi / 72)` px (matches the
  notebook's `target_*_px`).
- Each coupon canvas is exported as JPEG at `jpeg_quality/100` and embedded with
  `embedJpg`, then drawn at `coupon_width × coupon_height` pt at `(x, y)`.
- Progress is reported every 10 coupons with a `requestAnimationFrame` yield so
  the UI never freezes (spec performance requirement).
