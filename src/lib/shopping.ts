import { AISLE_LABELS, AISLE_ORDER, allIngredients, resolveIngredient } from "@/data/ingredients";
import { getRecipe } from "@/lib/recipes-store";
import type { Aisle, Recipe, Unit } from "@/data/types";
import { formatQuantity, unitLabel } from "./format";
import type { Week } from "./menu-store";
import { scaleIngredient } from "./scale";
import type { ManualItem, ShoppingSelection } from "./shopping-store";
import { normalizeText } from "./text";

/**
 * Clase de medida. Solo se suman cantidades de la misma clase:
 * - mass: g y kg (se guarda en gramos)
 * - volume: ml y l (se guarda en mililitros)
 * - spoon: cucharadas y cucharaditas (se guarda en cucharaditas; 1 cda = 3 cdta)
 * - el resto de unidades (ud, diente, hoja…) son cada una su propia clase.
 */
type MeasureClass = "mass" | "volume" | "spoon" | Exclude<Unit, "g" | "kg" | "ml" | "l" | "cda" | "cdta">;

function normalize(quantity: number, unit: Unit): { cls: MeasureClass; value: number } {
  switch (unit) {
    case "g":
      return { cls: "mass", value: quantity };
    case "kg":
      return { cls: "mass", value: quantity * 1000 };
    case "ml":
      return { cls: "volume", value: quantity };
    case "l":
      return { cls: "volume", value: quantity * 1000 };
    case "cda":
      return { cls: "spoon", value: quantity * 3 };
    case "cdta":
      return { cls: "spoon", value: quantity };
    default:
      return { cls: unit, value: quantity };
  }
}

export interface ShoppingAmount {
  cls: MeasureClass;
  value: number;
}

export interface ShoppingItem {
  /** Clave estable: ID normalizado del ingrediente o «manual:…». */
  key: string;
  name: string;
  aisle: Aisle | "otros";
  amounts: ShoppingAmount[];
  /** Texto libre (artículos manuales). */
  freeQuantity?: string;
  /** Recetas que lo usan. */
  recipes: string[];
  manual?: boolean;
}

/** Une las selecciones de la misma receta y raciones. */
export function mergeSelections(selections: ShoppingSelection[]): ShoppingSelection[] {
  const out: ShoppingSelection[] = [];
  for (const s of selections) {
    const same = out.find((o) => o.recipeId === s.recipeId && o.servings === s.servings);
    if (same) same.times += s.times;
    else out.push({ ...s });
  }
  return out;
}

/** Suma los ingredientes de varias recetas en una lista consolidada. */
export function buildShoppingList(
  selections: ShoppingSelection[],
  options: { includeOptional?: boolean; recipes?: (id: string) => Recipe | undefined } = {},
): ShoppingItem[] {
  const lookup = options.recipes ?? getRecipe;
  const items = new Map<string, ShoppingItem>();

  for (const sel of selections) {
    const recipe = lookup(sel.recipeId);
    if (!recipe || sel.times <= 0 || sel.servings <= 0) continue;
    const factor = sel.servings / recipe.servings;
    for (const ri of recipe.ingredients) {
      if (ri.optional && !options.includeOptional) continue;
      const def = resolveIngredient(ri);
      let item = items.get(ri.id);
      if (!item) {
        item = { key: ri.id, name: def.plural ?? def.name, aisle: def.aisle, amounts: [], recipes: [] };
        items.set(ri.id, item);
      }
      if (!item.recipes.includes(recipe.name)) item.recipes.push(recipe.name);
      const scaled = scaleIngredient(ri, factor);
      if (scaled === undefined) continue; // «al gusto»: aparece sin cantidad
      const { cls, value } = normalize(scaled * sel.times, ri.unit);
      const existing = item.amounts.find((a) => a.cls === cls);
      if (existing) existing.value += value;
      else item.amounts.push({ cls, value });
    }
  }
  return [...items.values()];
}

/** Recetas a comprar para un menú: las sobras no cuentan dos veces. */
export function selectionsFromWeek(week: Week): ShoppingSelection[] {
  const sel: ShoppingSelection[] = [];
  for (const slot of Object.values(week.slots)) {
    if (!slot || slot.leftoverOf) continue;
    sel.push({ recipeId: slot.recipeId, servings: slot.servings, times: 1 });
  }
  return mergeSelections(sel);
}

export function formatAmount(a: ShoppingAmount): string {
  switch (a.cls) {
    case "mass":
      return a.value >= 1000 ? `${formatQuantity(a.value / 1000, "kg")} kg` : `${formatQuantity(a.value, "g")} g`;
    case "volume":
      return a.value >= 1000 ? `${formatQuantity(a.value / 1000, "l")} l` : `${formatQuantity(a.value, "ml")} ml`;
    case "spoon": {
      if (a.value >= 3) {
        const cda = Math.round((a.value / 3) * 2) / 2;
        return `${formatQuantity(cda, "cda")} ${unitLabel("cda", cda)}`;
      }
      return `${formatQuantity(a.value, "cdta")} ${unitLabel("cdta", a.value)}`;
    }
    case "ud":
      return `${formatQuantity(a.value, "ud")} ud`;
    default:
      return `${formatQuantity(a.value, a.cls)} ${unitLabel(a.cls, a.value)}`;
  }
}

export function formatItemQuantity(item: ShoppingItem): string {
  if (item.freeQuantity) return item.freeQuantity;
  return item.amounts.map(formatAmount).join(" + ");
}

/** Deduce la sección del súper de un artículo escrito a mano. */
export function guessAisle(name: string): Aisle | "otros" {
  const n = normalizeText(name);
  if (!n) return "otros";
  for (const def of allIngredients()) {
    const names = [def.name, def.plural ?? "", ...(def.synonyms ?? [])].map(normalizeText).filter(Boolean);
    if (names.some((x) => x === n || x.split(" ")[0] === n || n.startsWith(x))) return def.aisle;
  }
  return "otros";
}

export function manualToItem(m: ManualItem): ShoppingItem {
  return { key: `manual:${m.id}`, name: m.name, aisle: m.aisle, amounts: [], freeQuantity: m.quantity, recipes: [], manual: true };
}

export const AISLE_GROUPS: { id: Aisle | "otros"; label: string }[] = [
  ...AISLE_ORDER.map((id) => ({ id, label: AISLE_LABELS[id] })),
  { id: "otros", label: "Otros" },
];

export function groupByAisle(items: ShoppingItem[]) {
  return AISLE_GROUPS.map((g) => ({
    ...g,
    items: items
      .filter((i) => i.aisle === g.id)
      .sort((a, b) => a.name.localeCompare(b.name, "es")),
  })).filter((g) => g.items.length > 0);
}

/** Texto para copiar o compartir (solo lo pendiente de comprar). */
export function shoppingText(items: ShoppingItem[], checked: ReadonlySet<string>): string {
  const pending = items.filter((i) => !checked.has(i.key));
  const lines = ["🛒 Lista de la compra"];
  for (const group of groupByAisle(pending)) {
    lines.push("", `*${group.label}*`);
    for (const item of group.items) {
      const q = formatItemQuantity(item);
      lines.push(`• ${item.name}${q ? `: ${q}` : ""}`);
    }
  }
  return lines.join("\n");
}
