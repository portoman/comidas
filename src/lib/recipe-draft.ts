import { BABY, STORAGE } from "@/data/recipes/helpers";
import { resolveIngredient } from "@/data/ingredients";
import type { Aisle, Appliance, CategoryId, PressureCookerInfo, Recipe, RecipeImage, RecipeIngredient, Unit } from "@/data/types";

/*
 * Borrador editable de una receta: todo como texto (lo que escribe el
 * usuario) y la conversión de ida y vuelta con el modelo `Recipe`.
 */

export interface DraftIngredient {
  key: string;
  id: string;
  /** Nombre que se muestra (del catálogo o propio). */
  name: string;
  custom?: { name: string; plural?: string; aisle: Aisle };
  quantity: string;
  unit: Unit;
  note: string;
  optional: boolean;
}

export interface DraftStep {
  key: string;
  text: string;
  minutes: string;
  appliance: Appliance | "";
}

export interface RecipeDraft {
  name: string;
  category: CategoryId;
  summary: string;
  prepMinutes: string;
  cookMinutes: string;
  servings: string;
  ingredients: DraftIngredient[];
  steps: DraftStep[];
  usePressureCooker: boolean;
  pressure: { minutesAtPressure: string; pressure: PressureCookerInfo["pressure"]; release: PressureCookerInfo["release"] };
  alternative: string;
  babyTexture: string;
  babyHowTo: string;
  babyWarnings: string;
  freezable: boolean;
  freezingNotes: string;
  storage: string;
  image: RecipeImage | null;
}

let counter = 0;
export function draftKey(): string {
  counter += 1;
  return `k${counter}`;
}

const num = (n: number | undefined) => (n === undefined ? "" : String(n).replace(".", ","));
const lines = (list: string[]) => list.join("\n");

export function ingredientToDraft(ri: RecipeIngredient): DraftIngredient {
  const def = resolveIngredient(ri);
  return {
    key: draftKey(),
    id: ri.id,
    name: def.name,
    custom: ri.custom,
    quantity: ri.unit === "al-gusto" ? "" : num(ri.quantity),
    unit: ri.unit,
    note: ri.note ?? "",
    optional: Boolean(ri.optional),
  };
}

export function recipeToDraft(r: Recipe): RecipeDraft {
  return {
    name: r.name,
    category: r.category,
    summary: r.summary,
    prepMinutes: String(r.prepMinutes),
    cookMinutes: String(r.cookMinutes),
    servings: String(r.servings),
    ingredients: r.ingredients.map(ingredientToDraft),
    steps: r.steps.map((s) => ({ key: draftKey(), text: s.text, minutes: num(s.minutes), appliance: s.appliance ?? "" })),
    usePressureCooker: Boolean(r.pressureCooker),
    pressure: {
      minutesAtPressure: r.pressureCooker ? String(r.pressureCooker.minutesAtPressure) : "",
      pressure: r.pressureCooker?.pressure ?? "alta",
      release: r.pressureCooker?.release ?? "natural",
    },
    alternative: r.alternative ?? "",
    babyTexture: r.baby.texture,
    babyHowTo: lines(r.baby.howTo),
    babyWarnings: lines(r.baby.warnings),
    freezable: r.freezable,
    freezingNotes: r.freezingNotes,
    storage: lines(r.storage),
    image: r.image,
  };
}

export function emptyDraft(): RecipeDraft {
  return {
    name: "",
    category: "aves",
    summary: "",
    prepMinutes: "10",
    cookMinutes: "25",
    servings: "3",
    ingredients: [],
    steps: [{ key: draftKey(), text: "", minutes: "", appliance: "" }],
    usePressureCooker: false,
    pressure: { minutesAtPressure: "", pressure: "alta", release: "natural" },
    alternative: "",
    babyTexture: "",
    babyHowTo: "",
    babyWarnings: lines([BABY.noSalt, BABY.temp]),
    freezable: true,
    freezingNotes: "",
    storage: lines([STORAGE.cool, STORAGE.fridge2, STORAGE.reheat]),
    image: null,
  };
}

/** «1,5» / «1.5» / «½» → 1.5. Vacío → undefined. NaN si no es un número. */
export function parseNumber(text: string): number | undefined {
  const t = text.trim().replace(",", ".").replace("½", ".5").replace("¼", ".25").replace("¾", ".75");
  if (!t) return undefined;
  const n = Number(t.startsWith(".") ? `0${t}` : t);
  return Number.isFinite(n) ? n : Number.NaN;
}

const splitLines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

export type DraftResult = { ok: true; recipe: Recipe } | { ok: false; errors: string[] };

/** Convierte el borrador en receta, o devuelve qué hay que corregir. */
export function draftToRecipe(d: RecipeDraft, meta: { id: string; number: number; tags?: string[] }): DraftResult {
  const errors: string[] = [];
  const name = d.name.trim();
  if (!name) errors.push("Escribe el nombre de la receta.");

  const prep = parseNumber(d.prepMinutes);
  const cook = parseNumber(d.cookMinutes);
  const servings = parseNumber(d.servings);
  if (prep === undefined || Number.isNaN(prep) || prep < 0) errors.push("Los minutos de preparación deben ser un número.");
  if (cook === undefined || Number.isNaN(cook) || cook < 0) errors.push("Los minutos de cocción deben ser un número.");
  if (servings === undefined || Number.isNaN(servings) || servings < 1) errors.push("Las raciones deben ser 1 o más.");

  const ingredients: RecipeIngredient[] = [];
  if (d.ingredients.length === 0) errors.push("Añade al menos un ingrediente.");
  for (const di of d.ingredients) {
    const q = di.unit === "al-gusto" ? undefined : parseNumber(di.quantity);
    if (q !== undefined && (Number.isNaN(q) || q <= 0)) {
      errors.push(`Revisa la cantidad de «${di.name}».`);
      continue;
    }
    if (q === undefined && di.unit !== "al-gusto") {
      errors.push(`Falta la cantidad de «${di.name}» (o elige «al gusto»).`);
      continue;
    }
    const ri: RecipeIngredient = { id: di.id, unit: di.unit };
    if (q !== undefined) ri.quantity = q;
    if (di.custom) ri.custom = di.custom;
    if (di.note.trim()) ri.note = di.note.trim();
    if (di.optional) ri.optional = true;
    ingredients.push(ri);
  }

  const steps = d.steps
    .filter((s) => s.text.trim())
    .map((s) => {
      const minutes = parseNumber(s.minutes);
      return {
        text: s.text.trim(),
        ...(minutes && !Number.isNaN(minutes) ? { minutes } : {}),
        ...(s.appliance ? { appliance: s.appliance } : {}),
      };
    });
  if (steps.length === 0) errors.push("Escribe al menos un paso.");

  let pressureCooker: PressureCookerInfo | undefined;
  if (d.usePressureCooker) {
    const m = parseNumber(d.pressure.minutesAtPressure);
    if (m === undefined || Number.isNaN(m) || m <= 0) errors.push("Indica los minutos de olla rápida desde que sube la presión.");
    else pressureCooker = { minutesAtPressure: m, pressure: d.pressure.pressure, release: d.pressure.release };
  }

  if (errors.length > 0) return { ok: false, errors };

  const recipe: Recipe = {
    id: meta.id,
    number: meta.number,
    name,
    category: d.category,
    summary: d.summary.trim(),
    image: d.image,
    prepMinutes: Math.round(prep!),
    cookMinutes: Math.round(cook!),
    servings: Math.round(servings!),
    ingredients,
    steps,
    baby: { texture: d.babyTexture.trim(), howTo: splitLines(d.babyHowTo), warnings: splitLines(d.babyWarnings) },
    freezable: d.freezable,
    freezingNotes: d.freezingNotes.trim(),
    storage: splitLines(d.storage),
  };
  if (pressureCooker) recipe.pressureCooker = pressureCooker;
  if (d.alternative.trim()) recipe.alternative = d.alternative.trim();
  if (meta.tags?.length) recipe.tags = meta.tags;
  return { ok: true, recipe };
}
