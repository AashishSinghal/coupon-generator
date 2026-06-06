"use client";

import { RotateCcw } from "lucide-react";
import type { CouponConfig } from "@/lib/types";
import type { FieldErrors } from "@/lib/validate";
import type { LoadedImage } from "@/utils/image";
import type { RecentImage } from "@/lib/recent-images";
import { Card, SectionHeading } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { SliderField } from "@/components/ui/slider";
import { ImageDropzone, type ImageSelectHandler } from "@/components/ImageDropzone";

/** Numeric input that emits NaN for empty/invalid so validation can flag it. */
function NumberInput({
  id,
  value,
  onChange,
  invalid,
  min,
  ...rest
}: {
  id: string;
  value: number;
  onChange: (v: number) => void;
  invalid?: boolean;
  min?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <Input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      invalid={invalid}
      value={Number.isNaN(value) ? "" : value}
      onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
      {...rest}
    />
  );
}

export function SettingsPanel({
  config,
  onChange,
  image,
  onImageSelect,
  onImageClear,
  imageError,
  errors,
  recents,
  onPickRecent,
  onRemoveRecent,
  onResetOverlay,
}: {
  config: CouponConfig;
  onChange: <K extends keyof CouponConfig>(key: K, value: CouponConfig[K]) => void;
  image: LoadedImage | null;
  onImageSelect: ImageSelectHandler;
  onImageClear: () => void;
  imageError: string | null;
  errors: FieldErrors;
  recents: RecentImage[];
  onPickRecent: (id: string) => void;
  onRemoveRecent: (id: string) => void;
  onResetOverlay: () => void;
}) {
  return (
    <div className="space-y-4 lg:columns-2 lg:gap-4 lg:space-y-0">
      {/* 1 — Coupon image */}
      <Card className="mb-4 break-inside-avoid p-4 lg:mb-4">
        <SectionHeading index="1" title="Coupon image" />
        <div className="mt-4">
          <ImageDropzone
            image={image}
            onSelect={onImageSelect}
            onClear={onImageClear}
            error={imageError}
            recents={recents}
            onPickRecent={onPickRecent}
            onRemoveRecent={onRemoveRecent}
          />
        </div>
      </Card>

      {/* 2 — Numbering */}
      <Card className="mb-4 break-inside-avoid p-4 lg:mb-4">
        <SectionHeading index="2" title="Numbering" />
        <div className="mt-4 space-y-4">
          <Field
            label="Number pattern"
            htmlFor="pattern"
            error={errors.pattern}
            hint="Use {number} with an optional Python format, e.g. A{number:04d}"
          >
            <Input
              id="pattern"
              value={config.pattern}
              invalid={!!errors.pattern}
              onChange={(e) => onChange("pattern", e.target.value)}
              placeholder="A{number:04d}"
              spellCheck={false}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start number" htmlFor="start" error={errors.startNumber}>
              <NumberInput
                id="start"
                value={config.startNumber}
                invalid={!!errors.startNumber}
                onChange={(v) => onChange("startNumber", v)}
              />
            </Field>
            <Field label="End number" htmlFor="end" error={errors.endNumber}>
              <NumberInput
                id="end"
                value={config.endNumber}
                invalid={!!errors.endNumber}
                onChange={(v) => onChange("endNumber", v)}
              />
            </Field>
          </div>
          {errors.total ? (
            <p className="font-mono text-[11px] text-stamp">{errors.total}</p>
          ) : null}
        </div>
      </Card>

      {/* 3 — Page layout */}
      <Card className="mb-4 break-inside-avoid p-4 lg:mb-4">
        <SectionHeading index="3" title="Page layout" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Rows per page" htmlFor="rows" error={errors.rows}>
            <NumberInput
              id="rows"
              min={1}
              value={config.rows}
              invalid={!!errors.rows}
              onChange={(v) => onChange("rows", v)}
            />
          </Field>
          <Field label="Columns per page" htmlFor="cols" error={errors.cols}>
            <NumberInput
              id="cols"
              min={1}
              value={config.cols}
              invalid={!!errors.cols}
              onChange={(v) => onChange("cols", v)}
            />
          </Field>
        </div>
      </Card>

      {/* 4 — Number overlay */}
      <Card className="mb-4 break-inside-avoid p-4 lg:mb-4">
        <SectionHeading index="4" title="Number on coupon">
          <button
            type="button"
            onClick={onResetOverlay}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft transition-colors hover:text-stamp"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </SectionHeading>
        <p className="mt-1.5 font-mono text-[11px] leading-snug text-ink-faint">
          Set the number&apos;s size, position, and rotation. Drag the number on the
          preview to place it — the artwork stays exactly as you uploaded it.
        </p>
        <div className="mt-4 space-y-5">
          <SliderField
            id="size"
            label="Size"
            value={Math.round(config.fontScale * 100)}
            min={2}
            max={100}
            step={1}
            format={(v) => `${v}%`}
            onChange={(v) => onChange("fontScale", v / 100)}
          />
          <SliderField
            id="rotation"
            label="Rotation"
            value={config.rotation}
            min={-180}
            max={180}
            step={1}
            format={(v) => `${v}°`}
            onChange={(v) => onChange("rotation", v)}
          />
          <div className="grid grid-cols-2 gap-4">
            <SliderField
              id="posX"
              label="Position X"
              value={Math.round(config.posX * 100)}
              min={0}
              max={100}
              step={1}
              format={(v) => `${v}%`}
              onChange={(v) => onChange("posX", v / 100)}
            />
            <SliderField
              id="posY"
              label="Position Y"
              value={Math.round(config.posY * 100)}
              min={0}
              max={100}
              step={1}
              format={(v) => `${v}%`}
              onChange={(v) => onChange("posY", v / 100)}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
