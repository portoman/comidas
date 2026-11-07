"use client";

import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { RECIPES } from "@/data/recipes";
import type { Recipe } from "@/data/types";
import { filterRecipes } from "@/lib/search";

/** Lista de recetas con buscador; modo simple (un clic) o múltiple. */
export function RecipePicker({
  multiple,
  onPick,
  confirmLabel = "Añadir",
}: {
  multiple?: boolean;
  onPick: (recipes: Recipe[]) => void;
  confirmLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const results = useMemo(() => filterRecipes(RECIPES, { query }), [query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar receta…"
          aria-label="Buscar receta"
          className="h-11 w-full rounded-xl border border-brand-900/10 bg-white pl-9 pr-3 text-base outline-none focus:border-brand-500"
        />
      </div>
      <ul className="max-h-[50dvh] space-y-1.5 overflow-y-auto">
        {results.map((r) => {
          const on = picked.includes(r.id);
          return (
            <li key={r.id}>
              <button
                type="button"
                aria-pressed={multiple ? on : undefined}
                onClick={() =>
                  multiple
                    ? setPicked((p) => (on ? p.filter((x) => x !== r.id) : [...p, r.id]))
                    : onPick([r])
                }
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition ${
                  on ? "bg-brand-50 ring-brand-500" : "bg-white ring-brand-900/5"
                }`}
              >
                {multiple && (
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${on ? "border-brand-600 bg-brand-600 text-white" : "border-stone-300"}`}>
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
                  </span>
                )}
                <span className="text-sm font-medium">{r.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {multiple && (
        <button
          type="button"
          disabled={picked.length === 0}
          onClick={() => {
            onPick(RECIPES.filter((r) => picked.includes(r.id)));
            setPicked([]);
          }}
          className="h-12 w-full rounded-2xl bg-brand-700 font-medium text-cream disabled:opacity-40"
        >
          {picked.length > 0 ? `${confirmLabel} ${picked.length} ${picked.length === 1 ? "receta" : "recetas"}` : "Selecciona recetas"}
        </button>
      )}
    </div>
  );
}
