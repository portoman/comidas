import { createLocalStore } from "./storage";

export type DayId = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";
export type MealId = "comida" | "cena";
export type SlotId = `${DayId}-${MealId}`;

export const DAYS: { id: DayId; label: string; short: string }[] = [
  { id: "lun", label: "Lunes", short: "Lun" },
  { id: "mar", label: "Martes", short: "Mar" },
  { id: "mie", label: "Miércoles", short: "Mié" },
  { id: "jue", label: "Jueves", short: "Jue" },
  { id: "vie", label: "Viernes", short: "Vie" },
  { id: "sab", label: "Sábado", short: "Sáb" },
  { id: "dom", label: "Domingo", short: "Dom" },
];

/** De lunes a viernes solo cenas; fin de semana comida y cena. */
export const SLOTS: { id: SlotId; day: DayId; meal: MealId }[] = DAYS.flatMap((d) =>
  (d.id === "sab" || d.id === "dom" ? (["comida", "cena"] as MealId[]) : (["cena"] as MealId[])).map((meal) => ({
    id: `${d.id}-${meal}` as SlotId,
    day: d.id,
    meal,
  })),
);

export interface MenuSlot {
  recipeId: string;
  /** Raciones de la preparación. */
  servings: number;
  /**
   * Si se indica, este hueco se cubre con lo cocinado en otro hueco
   * (p. ej. el martes se comen las sobras del lunes) y no suma compra.
   */
  leftoverOf?: SlotId;
}

export interface Week {
  id: string;
  /** Lunes de la semana, AAAA-MM-DD. */
  start: string;
  name?: string;
  slots: Partial<Record<SlotId, MenuSlot>>;
  savedAt?: string;
}

export interface MenuState {
  current: Week;
  archive: Week[];
}

export function mondayOf(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function newWeek(start: string): Week {
  return { id: `semana-${start}-${Math.random().toString(36).slice(2, 7)}`, start, slots: {} };
}

/** Estado inicial estable (mismo en servidor y cliente) para la hidratación. */
export const EMPTY_MENU: MenuState = { current: { id: "semana-vacia", start: "", slots: {} }, archive: [] };

export const menuStore = createLocalStore<MenuState>("recetario:menu:v1", EMPTY_MENU, (raw) => {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Partial<MenuState>;
  if (!r.current || typeof r.current !== "object" || typeof r.current.slots !== "object") return null;
  return { current: r.current, archive: Array.isArray(r.archive) ? r.archive : [] };
});

export function setSlot(state: MenuState, slot: SlotId, value: MenuSlot | null): MenuState {
  const slots = { ...state.current.slots };
  if (value) slots[slot] = value;
  else {
    delete slots[slot];
    // Los huecos que eran sobras de este dejan de tener sentido.
    for (const [k, v] of Object.entries(slots)) if (v?.leftoverOf === slot) delete slots[k as SlotId];
  }
  return { ...state, current: { ...state.current, slots } };
}

/** Garantiza que la semana actual tiene fecha de inicio. */
export function ensureWeek(state: MenuState, today = new Date()): MenuState {
  return state.current.start ? state : { ...state, current: newWeek(mondayOf(today)) };
}

/** Número de preparaciones reales (las sobras no cuentan). */
export function preparationsCount(week: Week): number {
  return Object.values(week.slots).filter((s) => s && !s.leftoverOf).length;
}

/** Siguiente hueco en orden cronológico. */
export function nextSlot(slot: SlotId): SlotId | undefined {
  const i = SLOTS.findIndex((s) => s.id === slot);
  return SLOTS[i + 1]?.id;
}

/**
 * Marca que la preparación de `slot` se come también en `target`:
 * duplica las raciones y deja `target` como sobras (sin sumar compra).
 */
export function shareWith(state: MenuState, slot: SlotId, target: SlotId): MenuState {
  const src = state.current.slots[slot];
  if (!src || src.leftoverOf) return state;
  const slots = { ...state.current.slots };
  slots[slot] = { ...src, servings: src.servings * 2 };
  slots[target] = { recipeId: src.recipeId, servings: src.servings, leftoverOf: slot };
  return { ...state, current: { ...state.current, slots } };
}

/** Deshace las sobras: el hueco queda libre y la preparación original vuelve a su tamaño. */
export function unshare(state: MenuState, target: SlotId): MenuState {
  const t = state.current.slots[target];
  if (!t?.leftoverOf) return setSlot(state, target, null);
  const slots = { ...state.current.slots };
  const src = slots[t.leftoverOf];
  if (src) slots[t.leftoverOf] = { ...src, servings: Math.max(1, Math.round(src.servings / 2)) };
  delete slots[target];
  return { ...state, current: { ...state.current, slots } };
}

export function saveWeek(state: MenuState, now = new Date()): MenuState {
  const copy: Week = { ...state.current, id: `guardado-${now.getTime()}`, savedAt: now.toISOString() };
  return { ...state, archive: [copy, ...state.archive].slice(0, 30) };
}

export function startNewWeek(state: MenuState, today = new Date()): MenuState {
  const hasContent = Object.keys(state.current.slots).length > 0;
  const archived = hasContent ? saveWeek(state, today) : state;
  // La nueva semana es la siguiente a la actual (o la de hoy si no hay ninguna).
  let start = mondayOf(today);
  if (state.current.start) {
    const [y, m, d] = state.current.start.split("-").map(Number);
    const next = mondayOf(new Date(y, m - 1, d + 7));
    if (next > start) start = next;
  }
  return { ...archived, current: newWeek(start) };
}

export function restoreWeek(state: MenuState, id: string): MenuState {
  const w = state.archive.find((x) => x.id === id);
  if (!w) return state;
  return { ...state, current: { ...w, id: newWeek(w.start).id, savedAt: undefined } };
}

export function formatWeekStart(start: string): string {
  if (!start) return "";
  const [y, m, d] = start.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}
