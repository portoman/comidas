import type { CategoryId } from "./types";

export interface Category {
  id: CategoryId;
  label: string;
  /** Emoji decorativo para el marcador de foto pendiente. */
  emoji: string;
  /** Degradado del marcador visual (clases de Tailwind). */
  gradient: string;
}

export const CATEGORIES: Category[] = [
  { id: "aves", label: "Pollo y pavo", emoji: "🍗", gradient: "from-amber-100 via-orange-50 to-amber-200" },
  { id: "carne", label: "Carne", emoji: "🥩", gradient: "from-rose-100 via-orange-50 to-red-200" },
  { id: "pescado", label: "Pescado", emoji: "🐟", gradient: "from-sky-100 via-cyan-50 to-blue-200" },
  { id: "legumbres", label: "Legumbres", emoji: "🫘", gradient: "from-yellow-100 via-amber-50 to-orange-200" },
  { id: "huevos", label: "Huevos", emoji: "🍳", gradient: "from-yellow-50 via-amber-50 to-yellow-200" },
  { id: "arroz-pasta", label: "Arroz, pasta y cuscús", emoji: "🍝", gradient: "from-orange-100 via-amber-50 to-yellow-200" },
  { id: "cremas-verduras", label: "Cremas y verduras", emoji: "🥣", gradient: "from-orange-100 via-lime-50 to-emerald-100" },
];

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, Category>;
