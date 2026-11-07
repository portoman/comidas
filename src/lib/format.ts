import { getIngredient } from "@/data/ingredients";
import type { RecipeIngredient, Unit } from "@/data/types";
import { scaleIngredient } from "./scale";

const FRACTIONS: [number, string][] = [
  [0.25, "¼"],
  [0.33, "⅓"],
  [0.5, "½"],
  [0.66, "⅔"],
  [0.75, "¾"],
];

/** Formatea cantidades de forma amigable: 0.5 -> «½», 1.5 -> «1 ½», 812.4 -> «810». */
export function formatQuantity(value: number, unit: Unit): string {
  if (unit === "g" || unit === "ml") {
    if (value >= 100) return String(Math.round(value / 10) * 10);
    return String(Math.round(value));
  }
  if (unit === "kg" || unit === "l") {
    return value.toLocaleString("es-ES", { maximumFractionDigits: 2 });
  }
  const whole = Math.floor(value);
  const frac = value - whole;
  if (frac < 0.12) return String(whole || 1);
  if (frac > 0.88) return String(whole + 1);
  const [, symbol] = FRACTIONS.reduce((best, cur) =>
    Math.abs(cur[0] - frac) < Math.abs(best[0] - frac) ? cur : best,
  );
  return whole > 0 ? `${whole} ${symbol}` : symbol;
}

const UNIT_LABELS: Record<Unit, [string, string]> = {
  g: ["g", "g"],
  kg: ["kg", "kg"],
  ml: ["ml", "ml"],
  l: ["l", "l"],
  ud: ["", ""],
  diente: ["diente", "dientes"],
  hoja: ["hoja", "hojas"],
  ramita: ["ramita", "ramitas"],
  cda: ["cucharada", "cucharadas"],
  cdta: ["cucharadita", "cucharaditas"],
  pizca: ["pizca", "pizcas"],
  "al-gusto": ["", ""],
};

export function unitLabel(unit: Unit, quantity: number): string {
  const [singular, plural] = UNIT_LABELS[unit];
  return quantity > 1 ? plural : singular;
}

/** «600 g de Patatas», «2 dientes de ajo», «Sal al gusto». */
export function describeIngredient(item: RecipeIngredient, factor = 1): string {
  const def = getIngredient(item.id);
  if (item.unit === "al-gusto" || item.quantity === undefined) {
    return `${def.name} al gusto`;
  }
  const qty = scaleIngredient(item, factor) ?? item.quantity;
  const q = formatQuantity(qty, item.unit);
  const label = unitLabel(item.unit, qty);
  // Con unidades «de recipiente» (diente, cucharada…) el nombre va en singular.
  const usePlural = qty > 1 && ["ud", "g", "kg"].includes(item.unit);
  const name = usePlural && def.plural ? def.plural : def.name;
  if (item.unit === "ud") return `${q} ${name.toLowerCase()}`;
  return `${q} ${label} de ${name.toLowerCase()}`;
}
