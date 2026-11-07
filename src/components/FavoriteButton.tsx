"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

export function FavoriteButton({
  recipeId,
  recipeName,
  className = "",
}: {
  recipeId: string;
  recipeName: string;
  className?: string;
}) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(recipeId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(recipeId);
      }}
      aria-pressed={active}
      aria-label={active ? `Quitar ${recipeName} de favoritos` : `Añadir ${recipeName} a favoritos`}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition active:scale-90 ${className}`}
    >
      <Heart
        className={`h-5 w-5 transition-colors ${active ? "fill-rose-500 text-rose-500" : "text-stone-600"}`}
        aria-hidden
      />
    </button>
  );
}
