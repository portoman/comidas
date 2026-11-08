"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CATEGORIES } from "@/data/categories";
import type { CategoryId, Recipe } from "@/data/types";
import { useRecipes } from "@/hooks/useRecipes";
import { filterRecipes } from "@/lib/search";
import { RecipeCard } from "./RecipeCard";

interface Props {
  /** Por defecto, todas las recetas de la familia. */
  recipes?: Recipe[];
  /** Si se indica, restringe a estos IDs (para la pantalla de favoritos). */
  onlyIds?: ReadonlySet<string>;
  emptyMessage?: string;
}

export function RecipeBrowser({ recipes: given, onlyIds, emptyMessage }: Props) {
  const all = useRecipes();
  const recipes = given ?? all;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "todas">("todas");

  const results = useMemo(
    () => filterRecipes(recipes, { query, category, onlyIds }),
    [recipes, query, category, onlyIds],
  );

  const chips: { id: CategoryId | "todas"; label: string }[] = [
    { id: "todas", label: "Todas" },
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" aria-hidden />
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o ingrediente…"
          aria-label="Buscar recetas por nombre o ingrediente"
          // 16 px evita el zoom automático de Safari en iOS al enfocar.
          className="h-12 w-full rounded-2xl border border-brand-900/10 bg-white pl-12 pr-11 text-base shadow-sm outline-none placeholder:text-stone-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Borrar búsqueda"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      <div
        role="group"
        aria-label="Filtrar por categoría"
        className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
      >
        {chips.map((chip) => {
          const active = category === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setCategory(chip.id)}
              aria-pressed={active}
              className={`h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-700 text-cream"
                  : "bg-white text-brand-800 ring-1 ring-brand-900/10 hover:bg-brand-50"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-stone-500" aria-live="polite" data-testid="results-count">
        {results.length === 1 ? "1 receta" : `${results.length} recetas`}
      </p>

      {results.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center text-stone-500 ring-1 ring-brand-900/5">
          {emptyMessage ?? "No hay recetas que coincidan con la búsqueda."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((recipe, i) => (
            <RecipeCard key={recipe.id} recipe={recipe} priority={i < 2} />
          ))}
        </div>
      )}
    </div>
  );
}
