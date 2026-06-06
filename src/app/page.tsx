"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileDown, Loader2, ScrollText } from "lucide-react";
import { DEFAULT_CONFIG, type CouponConfig } from "@/lib/types";
import { validateConfig, isValid } from "@/lib/validate";
import { prepareBaseImage } from "@/lib/coupon-renderer";
import { computeLayout } from "@/lib/layout";
import { generatePdf } from "@/lib/pdf-generator";
import { firstCode, lastCode } from "@/lib/number-generator";
import { loadConfig, saveConfig } from "@/lib/storage";
import {
  listRecent,
  addRecent,
  removeRecent,
  resolveRecent,
  tryAutoRestore,
  recentImagesSupported,
  type RecentImage,
} from "@/lib/recent-images";
import {
  loadImageFromFile,
  downloadBlob,
  makeThumbnail,
  type LoadedImage,
} from "@/utils/image";
import { buildPdfFilename } from "@/utils/filename";
import { SettingsPanel } from "@/components/SettingsPanel";
import { PagePreview } from "@/components/PagePreview";
import { ProgressDialog } from "@/components/ProgressDialog";
import { Button } from "@/components/ui/button";

const OVERLAY_KEYS = ["fontScale", "posX", "posY", "rotation"] as const;

export default function Home() {
  const [config, setConfig] = useState<CouponConfig>(DEFAULT_CONFIG);
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const [recents, setRecents] = useState<RecentImage[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const errors = useMemo(() => validateConfig(config), [config]);
  const configValid = isValid(errors);

  const refreshRecents = useCallback(async () => {
    setRecents(await listRecent());
  }, []);

  const setImageFromFile = useCallback(async (file: File): Promise<LoadedImage | null> => {
    const loaded = await loadImageFromFile(file);
    setImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.objectUrl);
      return loaded;
    });
    return loaded;
  }, []);

  // On first mount: restore the saved config, presets, and recent images, and
  // silently re-open the last image if it's still available (no permission prompt).
  useEffect(() => {
    const saved = loadConfig();
    if (saved) setConfig(saved);
    setHydrated(true);

    void refreshRecents();
    void (async () => {
      try {
        const file = await tryAutoRestore();
        if (file) await setImageFromFile(file);
      } catch {
        /* ignore — user can pick from recents */
      }
    })();
  }, [refreshRecents, setImageFromFile]);

  // Persist config whenever it changes (after the initial hydration read).
  useEffect(() => {
    if (hydrated) saveConfig(config);
  }, [config, hydrated]);

  // Cache the source image at native resolution; rebuild only when it changes.
  const base = useMemo(() => {
    if (!image) return null;
    return prepareBaseImage(image.element);
  }, [image]);

  const layout = useMemo(
    () => (image ? computeLayout(config, image.width, image.height) : null),
    [image, config],
  );

  const onChange = useCallback(
    <K extends keyof CouponConfig>(key: K, value: CouponConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const onImageSelect = useCallback(
    async (file: File, handle?: FileSystemFileHandle) => {
      setImageError(null);
      try {
        const loaded = await setImageFromFile(file);
        // Remember it (with a thumbnail) when we have a persistable handle.
        if (loaded && handle && recentImagesSupported()) {
          await addRecent(handle, file, makeThumbnail(loaded.element));
          await refreshRecents();
        }
      } catch (e) {
        setImageError(e instanceof Error ? e.message : "Could not load image.");
      }
    },
    [setImageFromFile, refreshRecents],
  );

  const onPickRecent = useCallback(
    async (id: string) => {
      setImageError(null);
      try {
        const file = await resolveRecent(id);
        if (file) {
          await setImageFromFile(file);
        } else {
          setImageError("That image is no longer available — it was removed.");
        }
      } catch {
        setImageError("Could not reopen that image.");
      }
      await refreshRecents();
    },
    [setImageFromFile, refreshRecents],
  );

  const onRemoveRecent = useCallback(
    async (id: string) => {
      await removeRecent(id);
      await refreshRecents();
    },
    [refreshRecents],
  );

  const onImageClear = useCallback(() => {
    setImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
    setImageError(null);
  }, []);

  const onResetOverlay = useCallback(() => {
    setConfig((prev) => {
      const next = { ...prev };
      for (const key of OVERLAY_KEYS) next[key] = DEFAULT_CONFIG[key];
      return next;
    });
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
      downloadBlob(blob, buildPdfFilename(config));
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

  const stats =
    image && total > 0 ? (
      <p className="mt-0.5 font-mono text-[11px] text-ink-soft">
        {total.toLocaleString()} coupons · {layout?.totalPages.toLocaleString()} page
        {layout && layout.totalPages === 1 ? "" : "s"} · {firstCode(config)}–{lastCode(config)}
      </p>
    ) : (
      <p className="mt-0.5 font-mono text-[11px] text-ink-faint">Upload an image to begin</p>
    );

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col px-4 pb-28 sm:px-6 lg:h-screen lg:overflow-hidden lg:pb-0">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-line py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-paper">
            <ScrollText className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <h1 className="font-display text-lg font-extrabold tracking-tight text-ink">
              Coupon Press
            </h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
              Printable coupon books, generated in your browser.
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

      <main className="grid grid-cols-1 gap-6 py-6 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:gap-8 lg:py-5 lg:[grid-template-rows:minmax(0,1fr)]">
        {/* Options — two of the three columns; scrolls internally on desktop */}
        <section className="lg:col-span-2 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-2">
          <SettingsPanel
            config={config}
            onChange={onChange}
            image={image}
            onImageSelect={onImageSelect}
            onImageClear={onImageClear}
            imageError={imageError}
            errors={errors}
            recents={recents}
            onPickRecent={onPickRecent}
            onRemoveRecent={onRemoveRecent}
            onResetOverlay={onResetOverlay}
          />
        </section>

        {/* Preview — one column: generation summary, generate button, page preview */}
        <section className="lg:col-span-1 lg:h-full lg:min-h-0">
          <div className="flex h-full flex-col gap-3">
            <div className="shrink-0 space-y-3">
              <div>
                <h2 className="font-display text-sm font-bold tracking-tight text-ink">
                  Live preview
                </h2>
                {stats}
              </div>
              <Button
                variant="stamp"
                size="md"
                className="hidden w-full lg:inline-flex"
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

            {image && base ? (
              <div className="flex min-h-0 flex-1 animate-fade-up flex-col gap-2">
                <p className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                  Page 1 · A4
                </p>
                <div className="perforated flex min-h-0 flex-1 items-center justify-center rounded-lg p-2">
                  <PagePreview
                    base={base}
                    config={config}
                    className="max-h-full w-full lg:h-full lg:w-auto"
                  />
                </div>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1">
                <EmptyPreview />
              </div>
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
    <div className="grid w-full place-items-center rounded-xl border border-dashed border-line-strong bg-card/60 p-8 text-center">
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
