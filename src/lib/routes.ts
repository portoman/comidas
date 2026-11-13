export function recipeHref(id: string): string {
  return `/receta?id=${encodeURIComponent(id)}`;
}
