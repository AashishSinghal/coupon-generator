"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { FileDown, Loader2, ScrollText } from "lucide-react";
import { DEFAULT_CONFIG, type CouponConfig } from "@/lib/types";
import { validateConfig, isValid } from "@/lib/validate";
import { prepareBaseImage } from "@/lib/coupon-renderer";
import { computeLayout } from "@/lib/layout";
import { generatePdf } from "@/lib/pdf-generator";
import { firstCode, lastCode } from "@/lib/number-generator";
import { loadImageFromFile, downloadBlob, type LoadedImage } from "@/utils/image";
import { formatPattern } from "@/utils/formatNumber";
import { SettingsPanel } from "@/components/SettingsPanel";
import { CouponPreview } from "@/components/CouponPreview";
import { PagePreview } from "@/components/PagePreview";
import { ProgressDialog } from "@/components/ProgressDialog";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [config, setConfig] = useState<CouponConfig>(DEFAULT_CONFIG);
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const errors = useMemo(() => validateConfig(config), [config]);
  const configValid = isValid(errors);

  // Cache the source image at native resolution; rebuild only when it changes.
  const base = useMemo(() => {
    if (!image) return null;
    return prepareBaseImage(image.element);
  }, [image]);

  const layout = useMemo(
    () => (image ? computeLayout(config, image.width, image.height) : null),
    [image, config],
  );

  const previewCode = useMemo(() => {
    if (errors.pattern) return null;
    try {
      return formatPattern(config.pattern, config.startNumber || 0);
    } catch {
      return null;
    }
  }, [config.pattern, config.startNumber, errors.pattern]);

  const onChange = useCallback(
    <K extends keyof CouponConfig>(key: K, value: CouponConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const onImageSelect = useCallback(async (file: File) => {
    setImageError(null);
    try {
      const loaded = await loadImageFromFile(file);
      setImage((prev) => {
        if (prev) URL.revokeObjectURL(prev.objectUrl);
        return loaded;
      });
    } catch (e) {
      setImageError(e instanceof Error ? e.message : "Could not load image.");
    }
  }, []);

  const onImageClear = useCallback(() => {
    setImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
    setImageError(null);
  }, []);

  const canGenerate = configValid && !!image && !!base && !generating;

  const handleGenerate = useCallback(async () => {
    if (!image || !base) {
      setImageError("Upload a coupon image first.");
      return;
    }
    if (!configValid) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setGenerating(true);
    setProgress(0);
    setDone(0);

    try {
      const blob = await generatePdf(image.element, config, {
        baseImage: base,
        signal: controller.signal,
        sourceMime: image.mimeType,
        onProgress: (fraction, doneCount) => {
          setProgress(fraction);
          setDone(doneCount);
        },
      });
      downloadBlob(blob, "coupon-book.pdf");
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setImageError(e instanceof Error ? e.message : "PDF generation failed.");
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  }, [image, base, config, configValid]);

  const handleCancel = useCallback(() => abortRef.current?.abort(), []);

  const total = layout?.totalCoupons ?? 0;

  return (
    <div className="mx-auto min-h-full max-w-6xl px-4 pb-28 sm:px-6 lg:pb-12">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-line py-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-paper">
            <ScrollText className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <h1 className="font-display text-lg font-extrabold tracking-tight text-ink">
              Coupon Press
            </h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
              Generate printable coupon books from any image and numbering pattern.
            </p>
          </div>
        </div>
        <a
          href="https://github.com/AashishSinghal/coupon-generator"
          target="_blank"
          rel="noreferrer"
          className="hidden font-mono text-[11px] uppercase tracking-wide text-ink-soft transition-colors hover:text-ink sm:block"
        >
          Source ↗
        </a>
      </header>

      <main className="grid grid-cols-1 gap-6 py-7 lg:grid-cols-12">
        {/* Settings */}
        <section className="lg:col-span-5 lg:col-start-1">
          <SettingsPanel
            config={config}
            onChange={onChange}
            image={image}
            onImageSelect={onImageSelect}
            onImageClear={onImageClear}
            imageError={imageError}
            errors={errors}
          />
        </section>

        {/* Preview */}
        <section className="lg:col-span-7">
          <div className="space-y-5 lg:sticky lg:top-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-sm font-bold tracking-tight text-ink">
                  Live preview
                </h2>
                {image && total > 0 ? (
                  <p className="mt-0.5 font-mono text-[11px] text-ink-soft">
                    {total.toLocaleString()} coupons · {layout?.totalPages.toLocaleString()} page
                    {layout && layout.totalPages === 1 ? "" : "s"} · {firstCode(config)}–
                    {lastCode(config)}
                  </p>
                ) : (
                  <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
                    Upload an image to begin
                  </p>
                )}
              </div>
              <Button
                variant="stamp"
                size="md"
                className="hidden lg:inline-flex"
                disabled={!canGenerate}
                onClick={handleGenerate}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                Generate PDF
              </Button>
            </div>

            {image && base && previewCode ? (
              <div className="animate-fade-up space-y-5">
                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                    Single coupon · {previewCode}
                  </p>
                  <CouponPreview
                    base={base}
                    code={previewCode}
                    config={config}
                    onPositionChange={(posX, posY) =>
                      setConfig((prev) => ({ ...prev, posX, posY }))
                    }
                  />
                </div>
                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                    Page 1 · A4
                  </p>
                  <div className="perforated rounded-lg p-3">
                    <PagePreview base={base} config={config} />
                  </div>
                </div>
              </div>
            ) : (
              <EmptyPreview />
            )}
          </div>
        </section>
      </main>

      {/* Mobile sticky generate bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 p-4 backdrop-blur lg:hidden">
        <Button
          variant="stamp"
          size="lg"
          className="w-full"
          disabled={!canGenerate}
          onClick={handleGenerate}
        >
          {generating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <FileDown className="h-5 w-5" />
          )}
          Generate PDF
        </Button>
      </div>

      <ProgressDialog
        open={generating}
        progress={progress}
        done={done}
        total={total}
        onCancel={handleCancel}
      />
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-line-strong bg-card/60 px-6 py-20 text-center">
      <div className="max-w-xs space-y-2">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-paper-deep text-ink-faint">
          <ScrollText className="h-6 w-6" />
        </span>
        <p className="font-display text-sm font-semibold text-ink">No preview yet</p>
        <p className="font-mono text-[11px] leading-relaxed text-ink-faint">
          Upload a coupon image and your numbered preview will render here — the
          exact pixels that go into the PDF.
        </p>
      </div>
    </div>
  );
}
