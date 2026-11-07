"use client";

import { Minus, Plus } from "lucide-react";

export function ServingsStepper({
  value,
  onChange,
  min = 1,
  max = 12,
  label = "Raciones",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Quitar una ración (${label.toLowerCase()})`}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition active:scale-90 disabled:opacity-40"
      >
        <Minus className="h-5 w-5" aria-hidden />
      </button>
      <output aria-live="polite" className="min-w-[2.5rem] text-center text-lg font-semibold tabular-nums">
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Añadir una ración (${label.toLowerCase()})`}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition active:scale-90 disabled:opacity-40"
      >
        <Plus className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
