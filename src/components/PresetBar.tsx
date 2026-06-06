"use client";

import { useState } from "react";
import { Bookmark, Plus, X, Check } from "lucide-react";
import type { Preset } from "@/lib/storage";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";

/**
 * Save the current settings as a named preset, then re-apply or delete it
 * later. Presets persist in localStorage alongside the last-used config.
 */
export function PresetBar({
  presets,
  onApply,
  onSave,
  onDelete,
}: {
  presets: Preset[];
  onApply: (id: string) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setName("");
    setAdding(false);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-sm font-bold tracking-tight text-ink">
          <Bookmark className="h-4 w-4 text-ink-soft" />
          Presets
        </h2>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft transition-colors hover:text-stamp"
          >
            <Plus className="h-3.5 w-3.5" />
            Save current
          </button>
        ) : null}
      </div>

      {adding ? (
        <div className="mt-3 flex items-center gap-2">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") {
                setAdding(false);
                setName("");
              }
            }}
            placeholder="Preset name"
            className="h-9"
          />
          <button
            type="button"
            onClick={submit}
            aria-label="Save preset"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-ink text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
            disabled={!name.trim()}
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setName("");
            }}
            aria-label="Cancel"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line-strong text-ink-soft transition-colors hover:text-stamp"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {presets.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((p) => (
            <span
              key={p.id}
              className="group inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-paper-deep/50 py-1 pl-3 pr-1.5 transition-colors hover:border-ink"
            >
              <button
                type="button"
                onClick={() => onApply(p.id)}
                className="font-mono text-[12px] font-medium text-ink"
              >
                {p.name}
              </button>
              <button
                type="button"
                onClick={() => onDelete(p.id)}
                aria-label={`Delete preset ${p.name}`}
                className="grid h-4 w-4 place-items-center rounded-full text-ink-faint transition-colors hover:text-stamp"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : !adding ? (
        <p className="mt-2 font-mono text-[11px] text-ink-faint">
          No presets yet — tune the settings, then “Save current”.
        </p>
      ) : null}
    </Card>
  );
}
