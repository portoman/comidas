import { describe, expect, it } from "vitest";
import { RECIPES } from "@/data/recipes";
import { filterRecipes } from "@/lib/search";

const names = (q: string, category?: Parameters<typeof filterRecipes>[1]["category"]) =>
  filterRecipes(RECIPES, { query: q, category }).map((r) => r.number);

describe("búsqueda y filtros", () => {
  it("sin filtros devuelve las 25", () => {
    expect(filterRecipes(RECIPES, {})).toHaveLength(25);
  });

  it("busca por nombre sin importar tildes ni mayúsculas", () => {
    expect(names("SALMON")).toEqual([9]);
    expect(names("brócoli")).toContain(19);
  });

  it("busca por ingrediente", () => {
    const result = names("boniato");
    expect(result).toEqual(expect.arrayContaining([2, 9]));
    expect(names("calabaza")).toEqual(expect.arrayContaining([6, 12, 23, 25]));
  });

  it("busca por sinónimo", () => {
    expect(names("batata")).toEqual(expect.arrayContaining([2, 9]));
  });

  it("exige que aparezcan todas las palabras", () => {
    expect(names("garbanzos pollo")).toEqual([15]);
  });

  it("filtra por categoría y combina con la búsqueda", () => {
    expect(names("", "pescado")).toEqual([7, 8, 9, 10]);
    expect(names("", "huevos")).toEqual([18, 19, 20]);
    expect(names("calabacin", "huevos")).toEqual([18, 20]);
  });

  it("devuelve vacío si nada coincide", () => {
    expect(names("chocolate")).toEqual([]);
  });
});

import { describeIngredient, formatQuantity } from "@/lib/format";

describe("formato de ingredientes", () => {
  it("usa fracciones legibles y redondea gramos", () => {
    expect(formatQuantity(0.5, "ud")).toBe("½");
    expect(formatQuantity(1.5, "cda")).toBe("1 ½");
    expect(formatQuantity(812, "g")).toBe("810");
  });
  it("concuerda nombre y unidad", () => {
    expect(describeIngredient({ id: "ajo", quantity: 2, unit: "diente" })).toBe("2 dientes de ajo");
    expect(describeIngredient({ id: "zanahoria", quantity: 4, unit: "ud" })).toBe("4 zanahorias");
    expect(describeIngredient({ id: "patata", quantity: 600, unit: "g" })).toBe("600 g de patatas");
    expect(describeIngredient({ id: "sal", unit: "al-gusto" })).toBe("Sal al gusto");
  });
});
