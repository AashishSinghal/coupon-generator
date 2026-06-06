"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSupportedImage, pickImageFile, type LoadedImage } from "@/utils/image";
import type { RecentImage } from "@/lib/recent-images";

export type ImageSelectHandler = (file: File, handle?: FileSystemFileHandle) => void;

export function ImageDropzone({
  image,
  onSelect,
  onClear,
  error,
  recents,
  onPickRecent,
  onRemoveRecent,
}: {
  image: LoadedImage | null;
  onSelect: ImageSelectHandler;
  onClear: () => void;
  error?: string | null;
  recents: RecentImage[];
  onPickRecent: (id: string) => void;
  onRemoveRecent: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hasFsa = typeof window !== "undefined" && "showOpenFilePicker" in window;

  const browse = useCallback(async () => {
    if (hasFsa) {
      const picked = await pickImageFile();
      if (picked) onSelect(picked.file, picked.handle);
    } else {
      inputRef.current?.click();
    }
  }, [hasFsa, onSelect]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const item = e.dataTransfer.items?.[0] as
        | (DataTransferItem & { getAsFileSystemHandle?: () => Promise<FileSystemHandle | null> })
        | undefined;
      if (item?.getAsFileSystemHandle) {
        try {
          const handle = await item.getAsFileSystemHandle();
          if (handle && handle.kind === "file") {
            const fh = handle as FileSystemFileHandle;
            onSelect(await fh.getFile(), fh);
            return;
          }
        } catch {
          /* fall back to plain file */
        }
      }
      const file = e.dataTransfer.files?.[0];
      if (file) onSelect(file);
    },
    [onSelect],
  );

  return (
    <div className="space-y-3">
      {image ? (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-paper-deep/60 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.objectUrl}
            alt="Uploaded coupon"
            className="h-14 w-14 shrink-0 rounded-md border border-line bg-white object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-sm font-medium text-ink">{image.fileName}</p>
            <p className="font-mono text-[11px] text-ink-faint">
              {image.width} × {image.height} px
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            aria-label="Remove image"
            className="grid h-8 w-8 place-items-center rounded-md text-ink-soft transition-colors hover:bg-card hover:text-stamp"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={browse}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-9 text-center transition-colors",
              dragging
                ? "border-stamp bg-stamp/5"
                : error
                  ? "border-stamp/60 bg-card"
                  : "border-line-strong bg-card hover:border-ink/50 hover:bg-paper-deep/40",
            )}
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-paper-deep text-ink-soft">
              {dragging ? <ImageIcon className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
            </span>
            <span className="font-display text-sm font-semibold text-ink">
              Drop a coupon image, or browse
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
              PNG · JPG · JPEG · WEBP
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSelect(file);
            }}
          />
          {error ? <p className="mt-1.5 font-mono text-[11px] text-stamp">{error}</p> : null}
        </div>
      )}

      {recents.length > 0 ? (
        <div>
          <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            Recent
          </p>
          <div className="flex flex-wrap gap-2">
            {recents.map((r) => (
              <div key={r.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onPickRecent(r.id)}
                  title={`${r.name} · ${r.size > 1024 ? `${Math.round(r.size / 1024)} KB` : `${r.size} B`}`}
                  className="block h-14 w-14 overflow-hidden rounded-md border border-line bg-white transition-colors hover:border-ink"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.thumb} alt={r.name} className="h-full w-full object-contain" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveRecent(r.id)}
                  aria-label={`Forget ${r.name}`}
                  className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 place-items-center rounded-full border border-line bg-card text-ink-soft shadow-sm hover:text-stamp group-hover:grid"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
