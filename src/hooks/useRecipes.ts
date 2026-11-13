"use client";

import { useSyncExternalStore } from "react";
import { currentRecipes, getRecipe, recipesStore, serverRecipes } from "@/lib/recipes-store";
import type { Recipe } from "@/data/types";

/** Todas las recetas de la familia; se actualiza al editar o sincronizar. */
export function useRecipes(): Recipe[] {
  return useSyncExternalStore(recipesStore.subscribe, currentRecipes, serverRecipes);
}

export function useRecipe(id: string | null | undefined): Recipe | undefined {
  useRecipes();
  return id ? getRecipe(id) : undefined;
}

export function useRecipeRows() {
  return useSyncExternalStore(recipesStore.subscribe, recipesStore.get, recipesStore.getServer);
}
