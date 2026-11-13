import { setCustomIngredients } from "@/data/ingredients";
import { getBaseRecipe, RECIPES } from "@/data/recipes";
import type { IngredientDef, Recipe } from "@/data/types";
import { createLocalStore } from "./storage";

/**
 * Cambios de la familia sobre el recetario (una fila por receta):
 * - receta incluida en la app: data = versión editada (null = original),
 *   deleted = oculta;
 * - receta nueva: data = la receta; deleted = borrada.
 *
 * Con la nube activa, estas filas son una copia local de la tabla `recipes`
 * de Supabase (para poder consultar sin conexión).
 */
export interface RecipeRow {
  data: Recipe | null;
  deleted: boolean;
  updatedAt: string;
}

export type RecipeRows = Record<string, RecipeRow>;

const EMPTY: RecipeRows = {};

function isRecipe(x: unknown): x is Recipe {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.name === "string" &&
    Array.isArray(r.ingredients) &&
    Array.isArray(r.steps) &&
    typeof r.baby === "object" &&
    r.baby !== null
  );
}

export function validateRows(raw: unknown): RecipeRows | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const out: RecipeRows = {};
  for (const [id, row] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof row !== "object" || row === null) continue;
    const r = row as Record<string, unknown>;
    out[id] = {
      data: isRecipe(r.data) ? { ...r.data, id } : null,
      deleted: r.deleted === true,
      updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : "",
    };
  }
  return out;
}

export const recipesStore = createLocalStore<RecipeRows>("recetario:recetas:v1", EMPTY, validateRows);

/** Aplica las filas de la familia sobre las recetas incluidas en la app. */
export function mergeRecipes(rows: RecipeRows): Recipe[] {
  const out: Recipe[] = [];
  for (const base of RECIPES) {
    const row = rows[base.id];
    if (row?.deleted) continue;
    out.push(row?.data ? { ...row.data, id: base.id } : base);
  }
  for (const [id, row] of Object.entries(rows)) {
    if (getBaseRecipe(id) || row.deleted || !row.data) continue;
    out.push({ ...row.data, id });
  }
  return out.sort((a, b) => a.number - b.number || a.name.localeCompare(b.name, "es"));
}

function customIngredientsOf(recipes: Recipe[]): IngredientDef[] {
  const defs = new Map<string, IngredientDef>();
  for (const r of recipes) {
    for (const ri of r.ingredients) {
      if (ri.custom && !defs.has(ri.id)) defs.set(ri.id, { id: ri.id, ...ri.custom });
    }
  }
  return [...defs.values()];
}

let memoRows: RecipeRows | null = null;
let memoList: Recipe[] = RECIPES;
let memoById = new Map(RECIPES.map((r) => [r.id, r]));

/** Recetas actuales (incluidas + nuevas, con las ediciones aplicadas). */
export function currentRecipes(): Recipe[] {
  const rows = recipesStore.get();
  if (rows !== memoRows) {
    memoRows = rows;
    memoList = mergeRecipes(rows);
    memoById = new Map(memoList.map((r) => [r.id, r]));
    setCustomIngredients(customIngredientsOf(memoList));
  }
  return memoList;
}

export function serverRecipes(): Recipe[] {
  return RECIPES;
}

export function getRecipe(id: string): Recipe | undefined {
  currentRecipes();
  return memoById.get(id);
}

export function isBaseRecipe(id: string): boolean {
  return getBaseRecipe(id) !== undefined;
}

/** Receta incluida en la app que la familia ha modificado. */
export function isEdited(id: string, rows: RecipeRows = recipesStore.get()): boolean {
  return isBaseRecipe(id) && Boolean(rows[id]?.data) && !rows[id]?.deleted;
}

/** Recetas incluidas en la app que la familia ha ocultado. */
export function hiddenRecipes(rows: RecipeRows = recipesStore.get()): Recipe[] {
  return RECIPES.filter((r) => rows[r.id]?.deleted);
}

// --- Escritura ------------------------------------------------------------

type RemoteWriter = (id: string, row: Pick<RecipeRow, "data" | "deleted">) => Promise<void>;
let remoteWriter: RemoteWriter | null = null;

/** La sincronización con la nube registra aquí cómo guardar una receta. */
export function setRecipeWriter(writer: RemoteWriter | null) {
  remoteWriter = writer;
}

async function writeRow(id: string, row: Pick<RecipeRow, "data" | "deleted">) {
  if (remoteWriter) await remoteWriter(id, row);
  recipesStore.set((prev) => ({ ...prev, [id]: { ...row, updatedAt: new Date().toISOString() } }));
}

/** Guarda una receta nueva o editada. */
export function saveRecipe(recipe: Recipe): Promise<void> {
  return writeRow(recipe.id, { data: recipe, deleted: false });
}

/** Oculta una receta incluida o borra una receta nueva. */
export function deleteRecipe(id: string): Promise<void> {
  return writeRow(id, { data: null, deleted: true });
}

/** Vuelve a la versión original (o muestra de nuevo una receta oculta). */
export function restoreRecipe(id: string): Promise<void> {
  return writeRow(id, { data: null, deleted: false });
}

/** Siguiente número libre para una receta nueva. */
export function nextRecipeNumber(): number {
  return Math.max(0, ...currentRecipes().map((r) => r.number)) + 1;
}

/** ID único y legible para una receta nueva. */
export function newRecipeId(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${slug || "receta"}-${Math.random().toString(36).slice(2, 7)}`;
}
