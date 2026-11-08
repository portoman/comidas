import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { Recipe } from "@/data/types";
import { favoritesStore } from "../favorites-store";
import { menuStore } from "../menu-store";
import { recipesStore, setRecipeWriter, validateRows, type RecipeRows } from "../recipes-store";
import { shoppingStore } from "../shopping-store";
import type { LocalStore } from "../storage";

/*
 * Sincronización con Supabase.
 * - Favoritos, menú y compra: un documento JSON por familia (tabla
 *   household_state). Cada cambio local se guarda al momento en el
 *   dispositivo y se sube a la nube; si no hay conexión queda pendiente y se
 *   sube al recuperarla. Gana el último cambio.
 * - Recetas: tabla recipes; se guardan directamente en la nube (hace falta
 *   conexión) y se copian al dispositivo para consultarlas sin conexión.
 * - Los cambios del otro móvil llegan en tiempo real y al volver a la app.
 */

export type SyncStatus = "idle" | "syncing" | "synced" | "pending" | "offline" | "error";

const DOCS: Record<"favoritos" | "menu" | "compra", LocalStore<unknown>> = {
  favoritos: favoritesStore as LocalStore<unknown>,
  menu: menuStore as LocalStore<unknown>,
  compra: shoppingStore as LocalStore<unknown>,
};
type DocKey = keyof typeof DOCS;
const DOC_KEYS = Object.keys(DOCS) as DocKey[];

const PENDING_KEY = "recetario:pendiente:v1";

let status: SyncStatus = "idle";
const statusListeners = new Set<() => void>();
function setStatus(next: SyncStatus) {
  if (next === status) return;
  status = next;
  statusListeners.forEach((l) => l());
}

export const syncStatusStore = {
  get: () => status,
  getServer: (): SyncStatus => "idle",
  subscribe(listener: () => void) {
    statusListeners.add(listener);
    return () => statusListeners.delete(listener);
  },
};

function readPending(): Set<DocKey> {
  try {
    const raw = JSON.parse(window.localStorage.getItem(PENDING_KEY) ?? "[]");
    return new Set((Array.isArray(raw) ? raw : []).filter((k): k is DocKey => DOC_KEYS.includes(k)));
  } catch {
    return new Set();
  }
}

interface RecipeDbRow {
  id: string;
  data: Recipe | null;
  deleted: boolean;
  updated_at: string;
}

function toRows(list: RecipeDbRow[]): RecipeRows {
  const raw = Object.fromEntries(list.map((r) => [r.id, { data: r.data, deleted: r.deleted, updatedAt: r.updated_at }]));
  return validateRows(raw) ?? {};
}

/** Empieza a sincronizar con la familia indicada. Devuelve la función para pararla. */
export function startSync(sb: SupabaseClient, householdId: string): () => void {
  let stopped = false;
  const pending = readPending();
  const timers = new Map<DocKey, number>();
  const inFlight = new Set<DocKey>();

  function savePending() {
    try {
      window.localStorage.setItem(PENDING_KEY, JSON.stringify([...pending]));
    } catch {
      /* ignorar */
    }
    if (pending.size > 0) setStatus(navigator.onLine ? "syncing" : "pending");
  }

  async function push(key: DocKey) {
    if (stopped || inFlight.has(key)) return;
    inFlight.add(key);
    const value = DOCS[key].get();
    const { error } = await sb.from("household_state").upsert({ household_id: householdId, key, value });
    inFlight.delete(key);
    if (error) {
      setStatus(navigator.onLine ? "error" : "pending");
      return;
    }
    // Si hubo otro cambio mientras se subía, se vuelve a subir.
    if (DOCS[key].get() !== value) return push(key);
    pending.delete(key);
    savePending();
    if (pending.size === 0) setStatus("synced");
  }

  function schedule(key: DocKey) {
    pending.add(key);
    savePending();
    window.clearTimeout(timers.get(key));
    timers.set(key, window.setTimeout(() => void push(key), 400));
  }

  function applyDoc(key: string, value: unknown) {
    if (!DOC_KEYS.includes(key as DocKey) || pending.has(key as DocKey)) return;
    const store = DOCS[key as DocKey];
    const valid = store.validate(value);
    if (valid !== null && JSON.stringify(valid) !== JSON.stringify(store.get())) store.setRemote(valid);
  }

  async function pull() {
    if (stopped) return;
    setStatus("syncing");
    const [state, recipes] = await Promise.all([
      sb.from("household_state").select("key, value").eq("household_id", householdId),
      sb.from("recipes").select("id, data, deleted, updated_at").eq("household_id", householdId),
    ]);
    if (stopped) return;
    if (state.error || recipes.error) {
      setStatus(navigator.onLine ? "error" : "offline");
      return;
    }
    recipesStore.setRemote(toRows(recipes.data as RecipeDbRow[]));
    const remote = new Map(state.data.map((r) => [r.key as string, r.value as unknown]));
    for (const key of DOC_KEYS) {
      if (pending.has(key)) void push(key);
      else if (remote.has(key)) applyDoc(key, remote.get(key));
      else if (DOCS[key].get() !== DOCS[key].getServer()) void push(key); // primera vez: sube lo que había en el móvil
    }
    if (pending.size === 0) setStatus("synced");
  }

  const unsubscribers = DOC_KEYS.map((key) => DOCS[key].onLocalChange(() => schedule(key)));

  setRecipeWriter(async (id, row) => {
    const { error } = await sb
      .from("recipes")
      .upsert({ household_id: householdId, id, data: row.data, deleted: row.deleted });
    if (error) {
      throw new Error(
        navigator.onLine ? `No se ha podido guardar: ${error.message}` : "Sin conexión: conéctate para guardar la receta.",
      );
    }
  });

  const channel: RealtimeChannel = sb
    .channel(`familia-${householdId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "household_state", filter: `household_id=eq.${householdId}` },
      (payload) => {
        const row = payload.new as { key?: string; value?: unknown };
        if (row?.key) applyDoc(row.key, row.value);
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "recipes", filter: `household_id=eq.${householdId}` },
      (payload) => {
        const row = payload.new as RecipeDbRow | undefined;
        if (!row?.id) return;
        recipesStore.setRemote({ ...recipesStore.get(), ...toRows([row]) });
      },
    )
    .subscribe();

  const onOnline = () => void pull();
  const onOffline = () => setStatus(pending.size > 0 ? "pending" : "offline");
  const onVisible = () => {
    if (document.visibilityState === "visible") void pull();
  };
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  document.addEventListener("visibilitychange", onVisible);

  void pull();

  return () => {
    stopped = true;
    unsubscribers.forEach((u) => u());
    timers.forEach((t) => window.clearTimeout(t));
    setRecipeWriter(null);
    void sb.removeChannel(channel);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
    document.removeEventListener("visibilitychange", onVisible);
    setStatus("idle");
  };
}
