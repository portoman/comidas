import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecipeEditor } from "@/components/RecipeEditor";
import { getBaseRecipe, RECIPES } from "@/data/recipes";
import { draftToRecipe, emptyDraft, parseNumber, recipeToDraft } from "@/lib/recipe-draft";
import {
  currentRecipes,
  deleteRecipe,
  getRecipe,
  hiddenRecipes,
  isEdited,
  newRecipeId,
  recipesStore,
  restoreRecipe,
  saveRecipe,
} from "@/lib/recipes-store";
import { buildShoppingList, formatItemQuantity } from "@/lib/shopping";
import { filterRecipes } from "@/lib/search";
import type { Recipe } from "@/data/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  recipesStore.setRemote({});
  push.mockReset();
});

function customRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "tortitas-avena-x1",
    number: 26,
    name: "Tortitas de avena y plátano",
    category: "huevos",
    summary: "Desayuno rápido.",
    image: null,
    prepMinutes: 5,
    cookMinutes: 10,
    servings: 3,
    ingredients: [
      { id: "huevo", quantity: 2, unit: "ud" },
      { id: "propio-copos-de-avena", quantity: 80, unit: "g", custom: { name: "Copos de avena", aisle: "despensa" } },
    ],
    steps: [{ text: "Mezcla y cuaja en la sartén.", minutes: 10, appliance: "vitro" }],
    baby: { texture: "Tiras blandas", howTo: [], warnings: [] },
    freezable: true,
    freezingNotes: "",
    storage: [],
    ...overrides,
  };
}

describe("borrador de receta", () => {
  it("convierte una receta en borrador y vuelta sin perder datos", () => {
    for (const r of RECIPES) {
      const result = draftToRecipe(recipeToDraft(r), { id: r.id, number: r.number, tags: r.tags });
      expect(result.ok, r.id).toBe(true);
      if (!result.ok) continue;
      const clean = JSON.parse(JSON.stringify(r));
      expect(JSON.parse(JSON.stringify(result.recipe)), r.id).toEqual(clean);
    }
  });

  it("explica qué falta en una receta incompleta", () => {
    const result = draftToRecipe({ ...emptyDraft(), prepMinutes: "abc" }, { id: "x", number: 30 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContain("Escribe el nombre de la receta.");
    expect(result.errors).toContain("Añade al menos un ingrediente.");
    expect(result.errors).toContain("Escribe al menos un paso.");
    expect(result.errors).toContain("Los minutos de preparación deben ser un número.");
  });

  it("acepta decimales con coma y fracciones", () => {
    expect(parseNumber("1,5")).toBe(1.5);
    expect(parseNumber("½")).toBe(0.5);
    expect(parseNumber("")).toBeUndefined();
    expect(Number.isNaN(parseNumber("dos"))).toBe(true);
  });

  it("genera IDs legibles y únicos", () => {
    const id = newRecipeId("Crema de calabacín");
    expect(id).toMatch(/^crema-de-calabacin-[a-z0-9]{1,5}$/);
    expect(newRecipeId("Crema de calabacín")).not.toBe(id);
  });
});

describe("recetas de la familia", () => {
  it("una receta nueva aparece en la lista, la búsqueda y la compra", async () => {
    await saveRecipe(customRecipe());
    expect(currentRecipes()).toHaveLength(26);
    expect(getRecipe("tortitas-avena-x1")?.name).toBe("Tortitas de avena y plátano");
    expect(filterRecipes(currentRecipes(), { query: "avena" }).map((r) => r.id)).toEqual(["tortitas-avena-x1"]);

    const items = buildShoppingList([{ recipeId: "tortitas-avena-x1", servings: 6, times: 1 }]);
    const avena = items.find((i) => i.key === "propio-copos-de-avena")!;
    expect(avena.aisle).toBe("despensa");
    expect(formatItemQuantity(avena)).toBe("160 g");
  });

  it("los ingredientes propios iguales se suman entre recetas", async () => {
    await saveRecipe(customRecipe());
    await saveRecipe(customRecipe({ id: "otra-y2", number: 27, name: "Gachas" }));
    const items = buildShoppingList([
      { recipeId: "tortitas-avena-x1", servings: 3, times: 1 },
      { recipeId: "otra-y2", servings: 3, times: 1 },
    ]);
    expect(formatItemQuantity(items.find((i) => i.key === "propio-copos-de-avena")!)).toBe("160 g");
  });

  it("editar una receta incluida cambia la compra y se puede volver a la original", async () => {
    const base = getBaseRecipe("lentejas-arroz")!;
    await saveRecipe({ ...base, name: "Lentejas de la abuela", servings: 6 });
    expect(getRecipe("lentejas-arroz")?.name).toBe("Lentejas de la abuela");
    expect(isEdited("lentejas-arroz")).toBe(true);
    expect(currentRecipes()).toHaveLength(25);

    await restoreRecipe("lentejas-arroz");
    expect(getRecipe("lentejas-arroz")).toBe(base);
    expect(isEdited("lentejas-arroz")).toBe(false);
  });

  it("ocultar una receta incluida y recuperarla", async () => {
    await deleteRecipe("tortilla-brocoli");
    expect(getRecipe("tortilla-brocoli")).toBeUndefined();
    expect(hiddenRecipes().map((r) => r.id)).toEqual(["tortilla-brocoli"]);
    await restoreRecipe("tortilla-brocoli");
    expect(getRecipe("tortilla-brocoli")).toBeDefined();
  });
});

describe("<RecipeEditor />", () => {
  it("crea una receta nueva con un ingrediente del catálogo y otro propio", async () => {
    const user = userEvent.setup();
    render(<RecipeEditor />);
    await user.type(screen.getByLabelText("Nombre"), "Crema de puerro");

    const search = screen.getByLabelText("Añadir ingrediente");
    await user.type(search, "puerro");
    await user.click(screen.getByRole("button", { name: /^Puerro/ }));
    await user.type(screen.getByLabelText("Cantidad de Puerro"), "300");

    await user.type(search, "Queso fresco batido");
    await user.selectOptions(screen.getByLabelText("Sección del súper"), "huevos-lacteos");
    await user.click(screen.getByRole("button", { name: "Añadir" }));
    expect(screen.getAllByTestId("editor-ingredient")).toHaveLength(2);
    await user.type(screen.getByLabelText("Cantidad de Queso fresco batido"), "100");

    await user.type(screen.getByLabelText("Paso 1"), "Cuece el puerro 15 minutos y tritura.");
    await user.click(screen.getByRole("button", { name: /Guardar receta/ }));

    const saved = currentRecipes().find((r) => r.name === "Crema de puerro")!;
    expect(saved).toBeDefined();
    expect(saved.number).toBe(26);
    expect(saved.ingredients).toEqual([
      { id: "puerro", quantity: 300, unit: "g" },
      {
        id: "propio-queso-fresco-batido",
        quantity: 100,
        unit: "g",
        custom: { name: "Queso fresco batido", aisle: "huevos-lacteos" },
      },
    ]);
    expect(push).toHaveBeenCalledWith(`/receta?id=${saved.id}`);
  });

  it("muestra los errores y no guarda si falta información", async () => {
    const user = userEvent.setup();
    render(<RecipeEditor />);
    await user.type(screen.getByLabelText("Nombre"), "Sin ingredientes");
    await user.click(screen.getByRole("button", { name: /Guardar receta/ }));
    const alert = screen.getByRole("alert");
    expect(within(alert).getByText("Añade al menos un ingrediente.")).toBeInTheDocument();
    expect(currentRecipes()).toHaveLength(25);
  });

  it("edita una receta incluida", async () => {
    const user = userEvent.setup();
    const base = getBaseRecipe("crema-calabaza-pollo")!;
    render(<RecipeEditor recipe={base} />);
    const name = screen.getByLabelText("Nombre");
    await user.clear(name);
    await user.type(name, "Crema de calabaza de casa");
    await user.click(screen.getByRole("button", { name: /Guardar receta/ }));
    expect(getRecipe("crema-calabaza-pollo")?.name).toBe("Crema de calabaza de casa");
    expect(getRecipe("crema-calabaza-pollo")?.ingredients).toEqual(base.ingredients);
  });
});
