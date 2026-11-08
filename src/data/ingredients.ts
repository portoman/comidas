import type { Aisle, IngredientDef, RecipeIngredient } from "./types";

export const AISLE_LABELS: Record<Aisle, string> = {
  "fruta-verdura": "Fruta y verdura",
  carne: "Carnicería",
  pescado: "Pescadería",
  "huevos-lacteos": "Huevos y lácteos",
  despensa: "Despensa (arroz, pasta y legumbres)",
  conservas: "Conservas y salsas",
  congelados: "Congelados",
  "especias-aceites": "Aceites y especias",
};

export const AISLE_ORDER: Aisle[] = [
  "fruta-verdura",
  "carne",
  "pescado",
  "huevos-lacteos",
  "despensa",
  "conservas",
  "congelados",
  "especias-aceites",
];

const list: IngredientDef[] = [
  // Fruta y verdura
  { id: "patata", name: "Patata", plural: "Patatas", aisle: "fruta-verdura", synonyms: ["papa", "papas"] },
  { id: "boniato", name: "Boniato", plural: "Boniatos", aisle: "fruta-verdura", synonyms: ["batata"] },
  { id: "zanahoria", name: "Zanahoria", plural: "Zanahorias", aisle: "fruta-verdura" },
  { id: "cebolla", name: "Cebolla", plural: "Cebollas", aisle: "fruta-verdura" },
  { id: "ajo", name: "Ajo", plural: "Ajos", aisle: "fruta-verdura" },
  { id: "puerro", name: "Puerro", plural: "Puerros", aisle: "fruta-verdura" },
  { id: "pimiento-rojo", name: "Pimiento rojo", plural: "Pimientos rojos", aisle: "fruta-verdura" },
  { id: "pimiento-verde", name: "Pimiento verde", plural: "Pimientos verdes", aisle: "fruta-verdura" },
  { id: "tomate", name: "Tomate maduro", plural: "Tomates maduros", aisle: "fruta-verdura" },
  { id: "calabaza", name: "Calabaza", plural: "Calabaza", aisle: "fruta-verdura", synonyms: ["zapallo"] },
  { id: "calabacin", name: "Calabacín", plural: "Calabacines", aisle: "fruta-verdura" },
  { id: "brocoli", name: "Brócoli", plural: "Brócoli", aisle: "fruta-verdura" },
  { id: "champinon", name: "Champiñón", plural: "Champiñones", aisle: "fruta-verdura", synonyms: ["setas"] },
  { id: "espinaca", name: "Espinaca fresca", plural: "Espinacas frescas", aisle: "fruta-verdura" },
  { id: "judia-verde", name: "Judía verde", plural: "Judías verdes", aisle: "fruta-verdura" },
  { id: "limon", name: "Limón", plural: "Limones", aisle: "fruta-verdura" },
  { id: "perejil", name: "Perejil fresco", plural: "Perejil fresco", aisle: "fruta-verdura" },

  // Carnicería
  { id: "muslo-pollo", name: "Muslo de pollo", plural: "Muslos de pollo", aisle: "carne", synonyms: ["contramuslo"] },
  { id: "pollo-troceado", name: "Pollo troceado", plural: "Pollo troceado", aisle: "carne" },
  { id: "pechuga-pollo", name: "Pechuga de pollo", plural: "Pechugas de pollo", aisle: "carne" },
  { id: "pechuga-pavo", name: "Pechuga de pavo", plural: "Pechugas de pavo", aisle: "carne" },
  { id: "ternera-guisar", name: "Ternera para guisar", plural: "Ternera para guisar", aisle: "carne", synonyms: ["morcillo", "aguja", "babilla"] },
  { id: "carne-picada-ternera", name: "Carne picada de ternera", plural: "Carne picada de ternera", aisle: "carne" },

  // Pescadería
  { id: "gallo", name: "Gallo", plural: "Gallos", aisle: "pescado", synonyms: ["lenguado"] },
  { id: "merluza", name: "Merluza", plural: "Merluza", aisle: "pescado" },
  { id: "salmon", name: "Salmón", plural: "Salmón", aisle: "pescado" },
  { id: "bacalao-fresco", name: "Bacalao fresco", plural: "Bacalao fresco", aisle: "pescado" },

  // Huevos y lácteos
  { id: "huevo", name: "Huevo", plural: "Huevos", aisle: "huevos-lacteos" },
  { id: "leche", name: "Leche entera", plural: "Leche entera", aisle: "huevos-lacteos" },
  { id: "mantequilla", name: "Mantequilla sin sal", plural: "Mantequilla sin sal", aisle: "huevos-lacteos" },
  { id: "queso-rallado", name: "Queso rallado (pasteurizado)", plural: "Queso rallado (pasteurizado)", aisle: "huevos-lacteos" },

  // Despensa
  { id: "arroz-redondo", name: "Arroz redondo", plural: "Arroz redondo", aisle: "despensa", synonyms: ["arroz bomba"] },
  { id: "macarrones", name: "Macarrones", plural: "Macarrones", aisle: "despensa", synonyms: ["pasta"] },
  { id: "pasta-corta", name: "Pasta corta (hélices o lacitos)", plural: "Pasta corta (hélices o lacitos)", aisle: "despensa", synonyms: ["pasta", "fusilli"] },
  { id: "cuscus", name: "Cuscús", plural: "Cuscús", aisle: "despensa", synonyms: ["couscous"] },
  { id: "garbanzo-seco", name: "Garbanzo seco", plural: "Garbanzos secos", aisle: "despensa" },
  { id: "alubia-blanca-seca", name: "Alubia blanca seca", plural: "Alubias blancas secas", aisle: "despensa", synonyms: ["judía blanca", "fabes"] },
  { id: "lenteja-pardina", name: "Lenteja pardina", plural: "Lentejas pardinas", aisle: "despensa" },
  { id: "harina-trigo", name: "Harina de trigo", plural: "Harina de trigo", aisle: "despensa" },

  // Conservas y salsas
  { id: "tomate-triturado", name: "Tomate triturado natural sin sal añadida", plural: "Tomate triturado natural sin sal añadida", aisle: "conservas" },
  { id: "garbanzo-cocido", name: "Garbanzos cocidos (bote)", plural: "Garbanzos cocidos (bote)", aisle: "conservas", synonyms: ["garbanzo"] },
  { id: "alubia-blanca-cocida", name: "Alubias blancas cocidas (bote)", plural: "Alubias blancas cocidas (bote)", aisle: "conservas", synonyms: ["alubia", "judía blanca"] },

  // Congelados
  { id: "guisante", name: "Guisante (congelado)", plural: "Guisantes (congelados)", aisle: "congelados", synonyms: ["chícharo", "arveja"] },

  // Aceites y especias
  { id: "aceite-oliva", name: "Aceite de oliva virgen extra", plural: "Aceite de oliva virgen extra", aisle: "especias-aceites", synonyms: ["AOVE"] },
  { id: "sal", name: "Sal", plural: "Sal", aisle: "especias-aceites" },
  { id: "pimienta-negra", name: "Pimienta negra molida", plural: "Pimienta negra molida", aisle: "especias-aceites" },
  { id: "laurel", name: "Laurel", plural: "Laurel", aisle: "especias-aceites" },
  { id: "pimenton-dulce", name: "Pimentón dulce", plural: "Pimentón dulce", aisle: "especias-aceites" },
  { id: "comino", name: "Comino molido", plural: "Comino molido", aisle: "especias-aceites" },
  { id: "oregano", name: "Orégano seco", plural: "Orégano seco", aisle: "especias-aceites" },
  { id: "tomillo", name: "Tomillo seco", plural: "Tomillo seco", aisle: "especias-aceites" },
  { id: "romero", name: "Romero", plural: "Romero", aisle: "especias-aceites" },
  { id: "curcuma", name: "Cúrcuma molida", plural: "Cúrcuma molida", aisle: "especias-aceites" },
  { id: "nuez-moscada", name: "Nuez moscada", plural: "Nuez moscada", aisle: "especias-aceites" },
];

export const INGREDIENTS: Record<string, IngredientDef> = Object.fromEntries(
  list.map((i) => [i.id, i]),
);

/** Ingredientes propios de la familia (los define cada receta en `custom`). */
let customIngredients: Record<string, IngredientDef> = {};

export function setCustomIngredients(defs: IngredientDef[]) {
  customIngredients = Object.fromEntries(defs.map((d) => [d.id, d]));
}

/** Catálogo + ingredientes propios. */
export function allIngredients(): IngredientDef[] {
  return [...list, ...Object.values(customIngredients).filter((d) => !INGREDIENTS[d.id])];
}

export function findIngredient(id: string): IngredientDef | undefined {
  return INGREDIENTS[id] ?? customIngredients[id];
}

/** Definición de un ingrediente de una receta (del catálogo o propio). */
export function resolveIngredient(ri: Pick<RecipeIngredient, "id" | "custom">): IngredientDef {
  const def = INGREDIENTS[ri.id] ?? (ri.custom ? { id: ri.id, ...ri.custom } : customIngredients[ri.id]);
  return def ?? { id: ri.id, name: ri.id, aisle: "despensa" };
}

export function getIngredient(id: string): IngredientDef {
  const def = findIngredient(id);
  if (!def) throw new Error(`Ingrediente desconocido: ${id}`);
  return def;
}

/** ID normalizado para un ingrediente propio: «Queso fresco» → «propio-queso-fresco». */
export function customIngredientId(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `propio-${slug || "ingrediente"}`;
}
