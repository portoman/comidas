import type { RecipeIngredient } from "@/data/types";

/**
 * Cantidad escalada. Las unidades sueltas (huevos, cebollas…) se redondean a
 * medias o enteros para que sean manejables; los pesos y volúmenes se dejan exactos y
 * se redondean al mostrarlos.
 */
export function scaleIngredient(item: RecipeIngredient, factor: number): number | undefined {
  if (item.quantity === undefined || item.unit === "al-gusto") return undefined;
  const raw = item.quantity * factor;
  if (item.unit === "g" || item.unit === "kg" || item.unit === "ml" || item.unit === "l") return raw;
  if (item.unit === "ud") {
    // Huevos siempre enteros; resto: medias hasta 2 unidades y enteros desde ahí.
    if (item.id === "huevo" || raw >= 2) return Math.max(1, Math.round(raw));
    return Math.max(0.5, Math.round(raw * 2) / 2);
  }
  if (item.unit === "diente" || item.unit === "hoja" || item.unit === "ramita" || item.unit === "pizca") {
    return Math.max(1, Math.round(raw));
  }
  // Cucharadas y cucharaditas: a medias.
  return Math.max(0.5, Math.round(raw * 2) / 2);
}
