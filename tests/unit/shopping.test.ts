import { describe, expect, it } from "vitest";
import type { Recipe } from "@/data/types";
import { getRecipe } from "@/data/recipes";
import {
  buildShoppingList,
  formatItemQuantity,
  guessAisle,
  mergeSelections,
  selectionsFromWeek,
  shoppingText,
} from "@/lib/shopping";

// Recetas mínimas de prueba
const base = {
  category: "aves", summary: "", image: null, prepMinutes: 1, cookMinutes: 1, servings: 3, steps: [],
  baby: { texture: "", howTo: [], warnings: [] }, freezable: false, freezingNotes: "", storage: [],
} as const;
const A = { ...base, id: "a", number: 1, name: "Receta A", ingredients: [
  { id: "patata", quantity: 300, unit: "g" },
  { id: "aceite-oliva", quantity: 2, unit: "cda" },
  { id: "sal", unit: "al-gusto" },
] } as unknown as Recipe;
const B = { ...base, id: "b", number: 2, name: "Receta B", ingredients: [
  { id: "patata", quantity: 0.5, unit: "kg" },
  { id: "aceite-oliva", quantity: 3, unit: "cdta" },
  { id: "leche", quantity: 1, unit: "l" },
  { id: "huevo", quantity: 2, unit: "ud" },
  { id: "laurel", quantity: 1, unit: "hoja", optional: true },
] } as unknown as Recipe;
const C = { ...base, id: "c", number: 3, name: "Receta C", ingredients: [
  { id: "patata", quantity: 2, unit: "ud" },
  { id: "leche", quantity: 250, unit: "ml" },
] } as unknown as Recipe;
const lookup = (id: string) => ({ a: A, b: B, c: C })[id as "a" | "b" | "c"];
const find = (items: ReturnType<typeof buildShoppingList>, key: string) => items.find((i) => i.key === key)!;

describe("lista de la compra consolidada", () => {
  it("suma ingredientes repetidos normalizando g/kg: 300 g + 500 g = 800 g", () => {
    const items = buildShoppingList([{ recipeId: "a", servings: 3, times: 1 }, { recipeId: "b", servings: 3, times: 1 }], { recipes: lookup });
    expect(formatItemQuantity(find(items, "patata"))).toBe("800 g");
    expect(find(items, "patata").recipes).toEqual(["Receta A", "Receta B"]);
  });

  it("convierte a kg y l al superar 1000", () => {
    const items = buildShoppingList([{ recipeId: "b", servings: 3, times: 3 }, { recipeId: "c", servings: 3, times: 1 }], { recipes: lookup });
    expect(formatItemQuantity(find(items, "patata"))).toBe("1,5 kg + 2 ud");
    expect(formatItemQuantity(find(items, "leche"))).toBe("3,25 l");
  });

  it("no suma unidades incompatibles", () => {
    const items = buildShoppingList([{ recipeId: "a", servings: 3, times: 1 }, { recipeId: "c", servings: 3, times: 1 }], { recipes: lookup });
    expect(find(items, "patata").amounts).toEqual([{ cls: "mass", value: 300 }, { cls: "ud", value: 2 }]);
  });

  it("suma cucharadas y cucharaditas", () => {
    const items = buildShoppingList([{ recipeId: "a", servings: 3, times: 1 }, { recipeId: "b", servings: 3, times: 1 }], { recipes: lookup });
    expect(formatItemQuantity(find(items, "aceite-oliva"))).toBe("3 cucharadas");
  });

  it("ajusta por raciones y por número de veces", () => {
    const items = buildShoppingList([{ recipeId: "a", servings: 6, times: 2 }], { recipes: lookup });
    expect(formatItemQuantity(find(items, "patata"))).toBe("1,2 kg");
  });

  it("incluye «al gusto» sin cantidad y omite los opcionales", () => {
    const items = buildShoppingList([{ recipeId: "a", servings: 3, times: 1 }, { recipeId: "b", servings: 3, times: 1 }], { recipes: lookup });
    expect(find(items, "sal").amounts).toEqual([]);
    expect(items.find((i) => i.key === "laurel")).toBeUndefined();
  });

  it("usa IDs normalizados: misma clave aunque el nombre visible cambie", () => {
    const items = buildShoppingList([{ recipeId: "pollo-guisado-patatas-guisantes", servings: 3, times: 1 }, { recipeId: "gallo-horno-patatas", servings: 3, times: 1 }]);
    const patatas = items.filter((i) => i.key === "patata");
    expect(patatas).toHaveLength(1);
    expect(formatItemQuantity(patatas[0])).toBe("1,05 kg"); // 450 + 600
  });

  it("une selecciones repetidas", () => {
    expect(mergeSelections([{ recipeId: "a", servings: 3, times: 1 }, { recipeId: "a", servings: 3, times: 2 }])).toEqual([{ recipeId: "a", servings: 3, times: 3 }]);
  });

  it("genera texto agrupado por secciones sin lo ya comprado", () => {
    const items = buildShoppingList([{ recipeId: "b", servings: 3, times: 1 }], { recipes: lookup });
    const text = shoppingText(items, new Set(["huevo"]));
    expect(text).toContain("*Fruta y verdura*\n• Patatas: 500 g");
    expect(text).not.toContain("• Huevos");
    expect(text).toContain("• Leche entera: 1 l");
  });

  it("deduce la sección de artículos escritos a mano", () => {
    expect(guessAisle("Patatas")).toBe("fruta-verdura");
    expect(guessAisle("leche")).toBe("huevos-lacteos");
    expect(guessAisle("pañales")).toBe("otros");
  });
});

describe("compra desde el menú semanal", () => {
  it("no cuenta dos veces una preparación que se usa en dos comidas", () => {
    const sel = selectionsFromWeek({
      id: "w", start: "2026-11-02",
      slots: {
        "lun-cena": { recipeId: "lentejas-arroz", servings: 6 },
        "mar-cena": { recipeId: "lentejas-arroz", servings: 6, leftoverOf: "lun-cena" },
        "mie-cena": { recipeId: "tortilla-brocoli", servings: 3 },
        "sab-comida": { recipeId: "tortilla-brocoli", servings: 3 },
      },
    });
    expect(sel).toEqual([
      { recipeId: "lentejas-arroz", servings: 6, times: 1 },
      { recipeId: "tortilla-brocoli", servings: 3, times: 2 },
    ]);
    const lentejas = getRecipe("lentejas-arroz")!.ingredients.find((i) => i.id === "lenteja-pardina")!;
    const items = buildShoppingList(sel);
    expect(items.find((i) => i.key === "lenteja-pardina")!.amounts[0].value).toBe(lentejas.quantity! * 2);
  });
});
