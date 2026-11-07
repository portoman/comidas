import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { MenuView } from "@/app/menu/MenuView";
import {
  EMPTY_MENU,
  ensureWeek,
  mondayOf,
  menuStore,
  preparationsCount,
  restoreWeek,
  saveWeek,
  setSlot,
  shareWith,
  SLOTS,
  startNewWeek,
  unshare,
} from "@/lib/menu-store";
import { selectionsFromWeek } from "@/lib/shopping";
import { EMPTY_SHOPPING, shoppingStore } from "@/lib/shopping-store";

describe("lógica del menú semanal", () => {
  it("tiene cenas de lunes a viernes y comida y cena el fin de semana", () => {
    expect(SLOTS.map((s) => s.id)).toEqual([
      "lun-cena", "mar-cena", "mie-cena", "jue-cena", "vie-cena",
      "sab-comida", "sab-cena", "dom-comida", "dom-cena",
    ]);
  });

  it("calcula el lunes de la semana", () => {
    expect(mondayOf(new Date(2026, 10, 7))).toBe("2026-11-02"); // sábado
    expect(mondayOf(new Date(2026, 10, 8))).toBe("2026-11-02"); // domingo
    expect(mondayOf(new Date(2026, 10, 9))).toBe("2026-11-09"); // lunes
  });

  it("permite repetir recetas y cocinar doble para el día siguiente sin contar dos veces", () => {
    let m = ensureWeek(EMPTY_MENU, new Date(2026, 10, 3));
    m = setSlot(m, "lun-cena", { recipeId: "lentejas-arroz", servings: 3 });
    m = shareWith(m, "lun-cena", "mar-cena");
    m = setSlot(m, "mie-cena", { recipeId: "tortilla-brocoli", servings: 3 });
    m = setSlot(m, "sab-cena", { recipeId: "tortilla-brocoli", servings: 3 });
    expect(m.current.slots["lun-cena"]).toEqual({ recipeId: "lentejas-arroz", servings: 6 });
    expect(m.current.slots["mar-cena"]).toEqual({ recipeId: "lentejas-arroz", servings: 3, leftoverOf: "lun-cena" });
    expect(preparationsCount(m.current)).toBe(3);
    expect(selectionsFromWeek(m.current)).toEqual([
      { recipeId: "lentejas-arroz", servings: 6, times: 1 },
      { recipeId: "tortilla-brocoli", servings: 3, times: 2 },
    ]);
    m = unshare(m, "mar-cena");
    expect(m.current.slots["lun-cena"]?.servings).toBe(3);
    expect(m.current.slots["mar-cena"]).toBeUndefined();
  });

  it("al quitar una receta se quitan también sus sobras", () => {
    let m = ensureWeek(EMPTY_MENU);
    m = setSlot(m, "lun-cena", { recipeId: "lentejas-arroz", servings: 3 });
    m = shareWith(m, "lun-cena", "mar-cena");
    m = setSlot(m, "lun-cena", null);
    expect(m.current.slots).toEqual({});
  });

  it("guarda, crea nueva semana y recupera menús anteriores", () => {
    let m = ensureWeek(EMPTY_MENU, new Date(2026, 10, 3));
    m = setSlot(m, "lun-cena", { recipeId: "lentejas-arroz", servings: 3 });
    m = startNewWeek(m, new Date(2026, 10, 4));
    expect(m.archive).toHaveLength(1);
    expect(m.current.slots).toEqual({});
    expect(m.current.start).toBe("2026-11-09");
    m = saveWeek(m);
    expect(m.archive).toHaveLength(2);
    m = restoreWeek(m, m.archive[1].id);
    expect(m.current.slots["lun-cena"]?.recipeId).toBe("lentejas-arroz");
    expect(m.current.start).toBe("2026-11-02");
  });
});

describe("<MenuView />", () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; };
  });
  beforeEach(() => {
    menuStore.set(EMPTY_MENU);
    shoppingStore.set(EMPTY_SHOPPING);
    push.mockClear();
  });

  it("planifica la semana, usa sobras y genera la compra", async () => {
    const user = userEvent.setup();
    render(<MenuView />);
    await user.click(screen.getByRole("button", { name: /Elegir receta para Lunes · Cena/ }));
    await user.click(screen.getByRole("button", { name: "Lentejas con arroz" }));
    expect(within(screen.getByTestId("slot-lun-cena")).getByText("Lentejas con arroz")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Cocinar doble para martes · cena/ }));
    expect(within(screen.getByTestId("slot-mar-cena")).getByText(/Sobras de lunes · cena/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Elegir receta para Sábado · Comida/ }));
    await user.click(screen.getByRole("button", { name: "Lentejas con arroz" }));
    expect(screen.getByTestId("menu-summary")).toHaveTextContent("3 comidas planificadas · 2 preparaciones");

    await user.click(screen.getByRole("button", { name: /Generar compra/ }));
    expect(shoppingStore.get().selections).toEqual([
      { recipeId: "lentejas-arroz", servings: 6, times: 1 },
      { recipeId: "lentejas-arroz", servings: 3, times: 1 },
    ]);
    expect(push).toHaveBeenCalledWith("/compra");
    const saved = JSON.parse(localStorage.getItem("recetario:menu:v1")!);
    expect(Object.keys(saved.current.slots)).toEqual(["lun-cena", "mar-cena", "sab-comida"]);
  });
});
