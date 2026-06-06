"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSupportedImage, type LoadedImage } from "@/utils/image";

export function ImageDropzone({
  image,
  onSelect,
  onClear,
  error,
}: {
  image: LoadedImage | null;
  onSelect: (file: File) => void;
  onClear: () => void;
  error?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onSelect(file);
    },
    [onSelect],
  );

  if (image) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-line bg-paper-deep/60 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.objectUrl}
          alt="Uploaded coupon"
          className="h-14 w-14 shrink-0 rounded-md border border-line object-contain bg-white"
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
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file && isSupportedImage(file)) onSelect(file);
          else if (file) onSelect(file); // let the loader surface the format error
        }}
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
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error ? (
        <p className="mt-1.5 font-mono text-[11px] text-stamp">{error}</p>
      ) : null}
    </div>
  );
}
