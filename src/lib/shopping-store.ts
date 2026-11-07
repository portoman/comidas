import { createLocalStore } from "./storage";
import type { Aisle } from "@/data/types";

/** Una receta elegida para la compra. */
export interface ShoppingSelection {
  recipeId: string;
  /** Raciones por preparación. */
  servings: number;
  /** Cuántas veces se va a cocinar. */
  times: number;
}

export interface ManualItem {
  id: string;
  name: string;
  quantity?: string;
  aisle: Aisle | "otros";
}

export interface ShoppingState {
  selections: ShoppingSelection[];
  /** Claves de artículos marcados como comprados. */
  checked: string[];
  /** Claves de artículos eliminados de la lista. */
  removed: string[];
  manual: ManualItem[];
}

export const EMPTY_SHOPPING: ShoppingState = { selections: [], checked: [], removed: [], manual: [] };

function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export const shoppingStore = createLocalStore<ShoppingState>(
  "recetario:compra:v1",
  EMPTY_SHOPPING,
  (raw) => {
    if (!isObj(raw) || !Array.isArray(raw.selections)) return null;
    return {
      selections: raw.selections.filter(
        (s): s is ShoppingSelection =>
          isObj(s) && typeof s.recipeId === "string" && typeof s.servings === "number" && typeof s.times === "number",
      ),
      checked: Array.isArray(raw.checked) ? raw.checked.filter((x): x is string => typeof x === "string") : [],
      removed: Array.isArray(raw.removed) ? raw.removed.filter((x): x is string => typeof x === "string") : [],
      manual: Array.isArray(raw.manual) ? (raw.manual.filter((m) => isObj(m) && typeof m.name === "string") as ManualItem[]) : [],
    };
  },
);

/** Añade (o suma) una receta a la compra. */
export function addToShopping(state: ShoppingState, sel: ShoppingSelection): ShoppingState {
  const existing = state.selections.find((s) => s.recipeId === sel.recipeId && s.servings === sel.servings);
  const selections = existing
    ? state.selections.map((s) => (s === existing ? { ...s, times: s.times + sel.times } : s))
    : [...state.selections, sel];
  return { ...state, selections };
}
