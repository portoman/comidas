"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { RecipeDetail } from "@/components/RecipeDetail";
import { useRecipe, useRecipeRows } from "@/hooks/useRecipes";
import { isEdited } from "@/lib/recipes-store";

export function RecipeRoute() {
  const id = useSearchParams().get("id");
  const recipe = useRecipe(id);
  const rows = useRecipeRows();

  useEffect(() => {
    if (recipe) document.title = `${recipe.name} · Recetario Familiar`;
  }, [recipe]);

  if (!recipe) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-10 text-center">
        <h1 className="font-serif text-2xl font-semibold text-brand-800">Receta no encontrada</h1>
        <p className="text-stone-600">Puede que se haya borrado o que el enlace no sea correcto.</p>
        <Link href="/" className="inline-block rounded-full bg-brand-700 px-5 py-2.5 font-medium text-cream">
          Ver recetas
        </Link>
      </div>
    );
  }
  return <RecipeDetail key={recipe.id} recipe={recipe} edited={isEdited(recipe.id, rows)} />;
}
