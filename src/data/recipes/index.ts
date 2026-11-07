import type { Recipe } from "../types";
import { PHOTOS } from "../photos";
import { arrozPastaRecipes } from "./arroz-pasta";
import { avesRecipes } from "./aves";
import { carneRecipes } from "./carne";
import { cremasRecipes } from "./cremas";
import { huevosRecipes } from "./huevos";
import { legumbresRecipes } from "./legumbres";
import { pescadoRecipes } from "./pescado";

/** Catálogo completo, ordenado por número de receta. */
export const RECIPES: Recipe[] = [
  ...avesRecipes,
  ...carneRecipes,
  ...pescadoRecipes,
  ...legumbresRecipes,
  ...huevosRecipes,
  ...arrozPastaRecipes,
  ...cremasRecipes,
]
  .map((r) => ({ ...r, image: PHOTOS[r.id] ?? r.image }))
  .sort((a, b) => a.number - b.number);

const byId = new Map(RECIPES.map((r) => [r.id, r]));

export function getRecipe(id: string): Recipe | undefined {
  return byId.get(id);
}

export function totalMinutes(recipe: Pick<Recipe, "prepMinutes" | "cookMinutes">): number {
  return recipe.prepMinutes + recipe.cookMinutes;
}
