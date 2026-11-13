import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startSync, syncStatusStore } from "@/lib/cloud/sync";
import { favoritesStore } from "@/lib/favorites-store";
import { getRecipe, recipesStore, saveRecipe } from "@/lib/recipes-store";
import { getBaseRecipe } from "@/data/recipes";
import { EMPTY_SHOPPING, shoppingStore } from "@/lib/shopping-store";

type Row = Record<string, unknown>;
type Handler = (payload: { new: Row }) => void;

/** Supabase de mentira: tablas en memoria y canal de tiempo real manual. */
function fakeSupabase(initial: { household_state?: Row[]; recipes?: Row[] } = {}) {
  const tables: Record<string, Row[]> = { household_state: initial.household_state ?? [], recipes: initial.recipes ?? [] };
  const handlers: Record<string, Handler> = {};
  const state = { failing: false, upserts: [] as { table: string; row: Row }[] };
  const error = () => ({ message: "Failed to fetch" });
  const client = {
    from(table: string) {
      return {
        select: () => ({
          eq: async () => (state.failing ? { data: null, error: error() } : { data: tables[table], error: null }),
        }),
        upsert: async (row: Row) => {
          if (state.failing) return { error: error() };
          state.upserts.push({ table, row });
          const key = table === "recipes" ? "id" : "key";
          tables[table] = [...tables[table].filter((r) => r[key] !== row[key]), { ...row, updated_at: new Date().toISOString() }];
          return { error: null };
        },
      };
    },
    channel() {
      const ch = {
        on(_type: string, filter: { table: string }, handler: Handler) {
          handlers[filter.table] = handler;
          return ch;
        },
        subscribe: () => ch,
      };
      return ch;
    },
    removeChannel: async () => "ok",
  };
  return { client: client as unknown as SupabaseClient, tables, handlers, state };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let stop: (() => void) | undefined;

beforeEach(() => {
  favoritesStore.setRemote([]);
  shoppingStore.setRemote(EMPTY_SHOPPING);
  recipesStore.setRemote({});
});
afterEach(() => {
  stop?.();
  stop = undefined;
  vi.restoreAllMocks();
});

describe("sincronización con la nube", () => {
  it("al entrar descarga lo de la familia", async () => {
    const base = getBaseRecipe("lentejas-arroz")!;
    const fake = fakeSupabase({
      household_state: [{ key: "favoritos", value: ["lentejas-arroz", "tortilla-brocoli"] }],
      recipes: [
        { id: "lentejas-arroz", data: { ...base, name: "Lentejas de casa" }, deleted: false, updated_at: "2026-11-01" },
        { id: "tortilla-brocoli", data: null, deleted: true, updated_at: "2026-11-01" },
      ],
    });
    stop = startSync(fake.client, "fam-1");
    await wait(20);
    expect(favoritesStore.get()).toEqual(["lentejas-arroz", "tortilla-brocoli"]);
    expect(getRecipe("lentejas-arroz")?.name).toBe("Lentejas de casa");
    expect(getRecipe("tortilla-brocoli")).toBeUndefined();
    expect(syncStatusStore.get()).toBe("synced");
  });

  it("sube los cambios hechos en el móvil", async () => {
    const fake = fakeSupabase();
    stop = startSync(fake.client, "fam-1");
    await wait(20);
    favoritesStore.set(["macarrones-bolonesa"]);
    await wait(500);
    expect(fake.tables.household_state).toContainEqual(
      expect.objectContaining({ household_id: "fam-1", key: "favoritos", value: ["macarrones-bolonesa"] }),
    );
  });

  it("aplica en tiempo real los cambios del otro móvil", async () => {
    const fake = fakeSupabase();
    stop = startSync(fake.client, "fam-1");
    await wait(20);
    fake.handlers.household_state({ new: { key: "compra", value: { ...EMPTY_SHOPPING, checked: ["patata"] } } });
    expect(shoppingStore.get().checked).toEqual(["patata"]);
    const base = getBaseRecipe("macarrones-bolonesa")!;
    fake.handlers.recipes({ new: { id: "macarrones-bolonesa", data: { ...base, servings: 4 }, deleted: false, updated_at: "x" } });
    expect(getRecipe("macarrones-bolonesa")?.servings).toBe(4);
  });

  it("sin conexión guarda en el móvil y sube al volver la conexión", async () => {
    const fake = fakeSupabase();
    stop = startSync(fake.client, "fam-1");
    await wait(20);
    fake.state.failing = true;
    favoritesStore.set(["lentejas-arroz"]);
    await wait(500);
    expect(favoritesStore.get()).toEqual(["lentejas-arroz"]);
    expect(fake.tables.household_state).not.toContainEqual(expect.objectContaining({ value: ["lentejas-arroz"] }));
    expect(JSON.parse(localStorage.getItem("recetario:pendiente:v1")!)).toEqual(["favoritos"]);

    fake.state.failing = false;
    window.dispatchEvent(new Event("online"));
    await wait(50);
    expect(fake.tables.household_state).toContainEqual(expect.objectContaining({ key: "favoritos", value: ["lentejas-arroz"] }));
    expect(JSON.parse(localStorage.getItem("recetario:pendiente:v1")!)).toEqual([]);
  });

  it("un cambio pendiente no se pisa con lo que llega de la nube", async () => {
    const fake = fakeSupabase();
    stop = startSync(fake.client, "fam-1");
    await wait(20);
    fake.state.failing = true;
    favoritesStore.set(["lentejas-arroz"]);
    await wait(10);
    fake.handlers.household_state({ new: { key: "favoritos", value: [] } });
    expect(favoritesStore.get()).toEqual(["lentejas-arroz"]);
  });

  it("las recetas se guardan en la nube y, sin conexión, avisa sin guardar", async () => {
    const fake = fakeSupabase();
    stop = startSync(fake.client, "fam-1");
    await wait(20);
    const base = getBaseRecipe("lentejas-arroz")!;
    await saveRecipe({ ...base, name: "Lentejas nuevas" });
    expect(fake.tables.recipes).toContainEqual(expect.objectContaining({ household_id: "fam-1", id: "lentejas-arroz", deleted: false }));
    expect(getRecipe("lentejas-arroz")?.name).toBe("Lentejas nuevas");

    fake.state.failing = true;
    await expect(saveRecipe({ ...base, name: "Otra" })).rejects.toThrow(/guardar|conexión/);
    expect(getRecipe("lentejas-arroz")?.name).toBe("Lentejas nuevas");
  });
});
