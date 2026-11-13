import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RecipeInteractive } from "@/components/RecipeInteractive";
import { getBaseRecipe as getRecipe } from "@/data/recipes";
import { scaleIngredient } from "@/lib/scale";
import { shoppingStore, EMPTY_SHOPPING } from "@/lib/shopping-store";
import { menuStore, EMPTY_MENU } from "@/lib/menu-store";

const recipe = getRecipe("pollo-guisado-patatas-guisantes")!;

function texts() {
  return screen.getAllByTestId("ingredient-text").map((el) => el.textContent);
}

describe("ajuste de cantidades", () => {
  it("escala gramos de forma exacta y unidades a medias o enteros", () => {
    expect(scaleIngredient({ id: "patata", quantity: 450, unit: "g" }, 2)).toBe(900);
    expect(scaleIngredient({ id: "cebolla", quantity: 1, unit: "ud" }, 4 / 3)).toBe(1.5);
    expect(scaleIngredient({ id: "zanahoria", quantity: 2, unit: "ud" }, 5 / 3)).toBe(3);
    expect(scaleIngredient({ id: "pimiento-verde", quantity: 0.5, unit: "ud" }, 5 / 3)).toBe(1);
    expect(scaleIngredient({ id: "ajo", quantity: 2, unit: "diente" }, 5 / 3)).toBe(3);
    expect(scaleIngredient({ id: "huevo", quantity: 5, unit: "ud" }, 4 / 3)).toBe(7);
    expect(scaleIngredient({ id: "sal", unit: "al-gusto" }, 2)).toBeUndefined();
  });

  it("el selector de raciones recalcula los ingredientes", async () => {
    const user = userEvent.setup();
    render(<RecipeInteractive recipe={recipe} />);
    expect(texts()).toContain("500 g de muslos de pollo");
    const add = screen.getByRole("button", { name: /Añadir una ración/ });
    for (let i = 0; i < 3; i++) await user.click(add); // 3 -> 6 raciones
    expect(texts()).toContain("1000 g de muslos de pollo");
    expect(texts()).toContain("2 cebollas");
    expect(texts()).toContain("4 dientes de ajo");
  });

  it("permite marcar ingredientes mientras se cocina", async () => {
    const user = userEvent.setup();
    render(<RecipeInteractive recipe={recipe} />);
    const list = screen.getByTestId("ingredient-list");
    const box = within(list).getAllByRole("checkbox")[0];
    await user.click(box);
    expect(box).toBeChecked();
  });
});

describe("botones de compra y menú", () => {
  it("añade la receta a la compra con las raciones elegidas y acumula", async () => {
    shoppingStore.set(EMPTY_SHOPPING);
    const user = userEvent.setup();
    render(<RecipeInteractive recipe={recipe} />);
    await user.click(screen.getByRole("button", { name: /Añadir una ración/ }));
    await user.click(screen.getByRole("button", { name: "Añadir a la lista de la compra" }));
    await user.click(screen.getByRole("button", { name: "Añadir a la lista de la compra" }));
    expect(shoppingStore.get().selections).toEqual([{ recipeId: recipe.id, servings: 4, times: 2 }]);
    expect(JSON.parse(localStorage.getItem("recetario:compra:v1")!).selections).toHaveLength(1);
  });

  it("asigna la receta a un hueco del menú", async () => {
    menuStore.set(EMPTY_MENU);
    // jsdom no implementa showModal
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; };
    const user = userEvent.setup();
    render(<RecipeInteractive recipe={recipe} />);
    await user.click(screen.getByRole("button", { name: "Añadir al menú semanal" }));
    await user.click(screen.getByRole("button", { name: /Martes · Cena/ }));
    const state = menuStore.get();
    expect(state.current.slots["mar-cena"]).toEqual({ recipeId: recipe.id, servings: 3 });
    expect(state.current.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
