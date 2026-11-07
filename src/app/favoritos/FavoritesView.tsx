"use client";

import { RecipeBrowser } from "@/components/RecipeBrowser";
import { RECIPES } from "@/data/recipes";
import { useFavorites } from "@/hooks/useFavorites";

export function FavoritesView() {
  const { ids } = useFavorites();
  return (
    <RecipeBrowser
      recipes={RECIPES}
      onlyIds={ids}
      emptyMessage="Aún no tienes favoritas. Pulsa el corazón de una receta para guardarla aquí."
    />
  );
}
