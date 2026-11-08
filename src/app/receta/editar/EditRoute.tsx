"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RecipeEditor } from "@/components/RecipeEditor";
import { useHydrated } from "@/hooks/useHydrated";
import { useRecipe, useRecipeRows } from "@/hooks/useRecipes";
import { isEdited } from "@/lib/recipes-store";

export function EditRoute() {
  const id = useSearchParams().get("id");
  const recipe = useRecipe(id);
  const rows = useRecipeRows();
  // El formulario parte de la versión guardada en el dispositivo.
  if (!useHydrated()) return null;
  if (!recipe) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-10 text-center">
        <h1 className="font-serif text-2xl font-semibold text-brand-800">Receta no encontrada</h1>
        <Link href="/" className="inline-block rounded-full bg-brand-700 px-5 py-2.5 font-medium text-cream">
          Ver recetas
        </Link>
      </div>
    );
  }
  // La clave cambia con cada versión guardada: el formulario siempre parte de la última.
  const version = rows[recipe.id]?.updatedAt ?? "original";
  return <RecipeEditor key={`${recipe.id}:${version}`} recipe={recipe} edited={isEdited(recipe.id, rows)} />;
}
