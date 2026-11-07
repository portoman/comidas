import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ShoppingView } from "@/app/compra/ShoppingView";
import { EMPTY_MENU, menuStore } from "@/lib/menu-store";
import { EMPTY_SHOPPING, shoppingStore } from "@/lib/shopping-store";

const qtyOf = (key: string) => {
  const row = screen.getAllByTestId("shopping-item").find((el) => el.dataset.key === key)!;
  return within(row).queryByTestId("item-qty")?.textContent;
};

describe("<ShoppingView />", () => {
  beforeEach(() => {
    shoppingStore.set(EMPTY_SHOPPING);
    menuStore.set(EMPTY_MENU);
  });

  it("genera la lista consolidada de varias recetas y la recalcula al cambiar raciones", async () => {
    shoppingStore.set({
      ...EMPTY_SHOPPING,
      selections: [
        { recipeId: "pollo-guisado-patatas-guisantes", servings: 3, times: 1 },
        { recipeId: "gallo-horno-patatas", servings: 3, times: 1 },
      ],
    });
    const user = userEvent.setup();
    render(<ShoppingView />);
    expect(qtyOf("patata")).toBe("1,05 kg");
    // doble de raciones del pollo guisado: 900 + 600
    const add = screen.getByRole("button", { name: /Añadir una ración \(raciones de pollo guisado/i });
    for (let i = 0; i < 3; i++) await user.click(add);
    expect(qtyOf("patata")).toBe("1,5 kg");
    // cocinar el gallo dos veces: 900 + 1200
    await user.click(screen.getByRole("button", { name: /Añadir una ración \(veces que se cocina gallo/i }));
    expect(qtyOf("patata")).toBe("2,1 kg");
  });

  it("marca comprados, elimina y añade productos manuales con persistencia", async () => {
    shoppingStore.set({ ...EMPTY_SHOPPING, selections: [{ recipeId: "tortilla-brocoli", servings: 3, times: 1 }] });
    const user = userEvent.setup();
    render(<ShoppingView />);
    await user.click(screen.getByRole("checkbox", { name: "Comprado: Huevos" }));
    expect(shoppingStore.get().checked).toEqual(["huevo"]);
    await user.click(screen.getByRole("button", { name: "Eliminar Brócoli" }));
    expect(screen.getAllByTestId("shopping-item").some((el) => el.dataset.key === "brocoli")).toBe(false);
    await user.type(screen.getByRole("textbox", { name: "Nombre del producto" }), "Yogures");
    await user.type(screen.getByRole("textbox", { name: "Cantidad" }), "8");
    await user.click(screen.getByRole("button", { name: "Añadir producto" }));
    expect(screen.getByText("Yogures")).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem("recetario:compra:v1")!);
    expect(saved.manual[0]).toMatchObject({ name: "Yogures", quantity: "8" });
    expect(saved.removed).toEqual(["brocoli"]);
  });

  it("añade el menú de la semana sin duplicar las sobras", async () => {
    act(() =>
      menuStore.set({
        archive: [],
        current: {
          id: "w", start: "2026-11-02",
          slots: {
            "lun-cena": { recipeId: "lentejas-arroz", servings: 6 },
            "mar-cena": { recipeId: "lentejas-arroz", servings: 6, leftoverOf: "lun-cena" },
          },
        },
      }),
    );
    const user = userEvent.setup();
    render(<ShoppingView />);
    await user.click(screen.getByRole("button", { name: "Añadir el menú de la semana" }));
    expect(shoppingStore.get().selections).toEqual([{ recipeId: "lentejas-arroz", servings: 6, times: 1 }]);
    expect(qtyOf("lenteja-pardina")).toBe("400 g");
  });
});
