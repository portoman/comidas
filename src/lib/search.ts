import { resolveIngredient } from "@/data/ingredients";
import type { CategoryId, Recipe } from "@/data/types";
import { normalizeText } from "./text";

/** Texto indexable de una receta: nombre, resumen e ingredientes (con sinónimos). */
function searchableText(recipe: Recipe): string {
  const ingredientWords = recipe.ingredients.flatMap((ri) => {
    const def = resolveIngredient(ri);
    return [def.name, def.plural ?? "", ...(def.synonyms ?? [])];
  });
  return normalizeText(
    [recipe.name, recipe.summary, ...(recipe.tags ?? []), ...ingredientWords].join(" "),
  );
}

const cache = new WeakMap<Recipe, string>();
function getIndex(recipe: Recipe): string {
  let text = cache.get(recipe);
  if (text === undefined) {
    text = searchableText(recipe);
    cache.set(recipe, text);
  }
  return text;
}

export interface RecipeFilter {
  query?: string;
  category?: CategoryId | "todas";
  /** Si se indica, solo estas recetas (p. ej. favoritas). */
  onlyIds?: ReadonlySet<string>;
}

/**
 * Filtra recetas por texto (todas las palabras deben aparecer en el nombre o
 * en los ingredientes) y por categoría.
 */
export function filterRecipes(recipes: Recipe[], filter: RecipeFilter): Recipe[] {
  const words = normalizeText(filter.query ?? "")
    .split(/\s+/)
    .filter(Boolean);
  return recipes.filter((recipe) => {
    if (filter.category && filter.category !== "todas" && recipe.category !== filter.category) {
      return false;
    }
    if (filter.onlyIds && !filter.onlyIds.has(recipe.id)) return false;
    if (words.length === 0) return true;
    const index = getIndex(recipe);
    return words.every((w) => index.includes(w));
  });
}
