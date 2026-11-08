"use client";

import { RecipeBrowser } from "@/components/RecipeBrowser";
import { useFavorites } from "@/hooks/useFavorites";

export function FavoritesView() {
  const { ids } = useFavorites();
  return (
    <RecipeBrowser
      onlyIds={ids}
      emptyMessage="Aún no tienes favoritas. Pulsa el corazón de una receta para guardarla aquí."
    />
  );
}
