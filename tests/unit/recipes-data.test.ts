import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { INGREDIENTS } from "@/data/ingredients";
import { RECIPES, getRecipe, totalMinutes } from "@/data/recipes";
import { CATEGORY_BY_ID } from "@/data/categories";
import { normalizeText } from "@/lib/text";

describe("catálogo de recetas", () => {
  it("contiene las 25 recetas numeradas del 1 al 25", () => {
    expect(RECIPES).toHaveLength(25);
    expect(RECIPES.map((r) => r.number)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
  });

  it("tiene IDs únicos y en formato kebab-case", () => {
    const ids = RECIPES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/));
  });

  it("solo usa ingredientes del catálogo normalizado, sin repetir dentro de una receta", () => {
    for (const r of RECIPES) {
      const ids = r.ingredients.map((i) => i.id);
      expect(new Set(ids).size, r.id).toBe(ids.length);
      ids.forEach((id) => expect(INGREDIENTS[id], `${r.id}: ${id}`).toBeDefined());
    }
  });

  it("cada receta tiene datos completos y útiles", () => {
    for (const r of RECIPES) {
      expect(CATEGORY_BY_ID[r.category], r.id).toBeDefined();
      expect(r.servings).toBe(3);
      expect(r.prepMinutes).toBeGreaterThan(0);
      expect(r.cookMinutes).toBeGreaterThan(0);
      expect(totalMinutes(r)).toBe(r.prepMinutes + r.cookMinutes);
      expect(r.ingredients.length, r.id).toBeGreaterThanOrEqual(5);
      expect(r.steps.length, r.id).toBeGreaterThanOrEqual(5);
      expect(r.baby.texture.length).toBeGreaterThan(10);
      expect(r.baby.howTo.length).toBeGreaterThan(0);
      expect(r.baby.warnings.some((w) => /pediatra/i.test(w)), r.id).toBe(true);
      expect(r.storage.length).toBeGreaterThan(0);
      expect(r.freezingNotes.length).toBeGreaterThan(0);
      r.ingredients.forEach((i) => {
        if (i.unit !== "al-gusto") expect(i.quantity, `${r.id}: ${i.id}`).toBeGreaterThan(0);
      });
    }
  });

  it("no incluye miel en ninguna receta", () => {
    for (const r of RECIPES) {
      expect(normalizeText(JSON.stringify(r))).not.toMatch(/\bmiel\b/);
    }
  });

  it("solo la receta 15 lleva espinacas, con alternativa de calabacín para el bebé", () => {
    const withSpinach = RECIPES.filter((r) => r.ingredients.some((i) => i.id === "espinaca"));
    expect(withSpinach.map((r) => r.number)).toEqual([15]);
    const r = getRecipe("garbanzos-pollo-espinacas")!;
    expect(r.ingredients.some((i) => i.id === "calabacin")).toBe(true);
    expect(r.baby.warnings.join(" ")).toMatch(/AESAN/);
    expect(r.baby.howTo.join(" ")).toMatch(/calabac[ií]n/);
  });

  it("las recetas con olla rápida la usan en sus pasos e indican cómo soltar la presión", () => {
    const withPressure = RECIPES.filter((r) => r.pressureCooker);
    expect(withPressure.length).toBeGreaterThanOrEqual(8);
    for (const r of withPressure) {
      expect(r.pressureCooker!.minutesAtPressure, r.id).toBeGreaterThan(0);
      const ollaSteps = r.steps.filter((s) => s.appliance === "olla-rapida");
      expect(ollaSteps.length, r.id).toBeGreaterThan(0);
      expect(r.steps.map((s) => s.text).join(" "), r.id).toMatch(/válvula/);
    }
  });

  it("son recetas de diario: ninguna pasa de 1 hora y la mayoría rondan 30-45 min", () => {
    const totals = RECIPES.map(totalMinutes);
    totals.forEach((t, i) => expect(t, RECIPES[i].id).toBeLessThanOrEqual(60));
    const upTo45 = totals.filter((t) => t <= 45).length;
    expect(upTo45).toBeGreaterThanOrEqual(23);
  });

  it("cada fotografía existe en /public y tiene autoría y licencia libre", () => {
    for (const r of RECIPES) {
      if (!r.image) continue;
      const file = join(process.cwd(), "public", r.image.src);
      expect(existsSync(file), r.image.src).toBe(true);
      expect(statSync(file).size, r.image.src).toBeGreaterThan(10_000);
      expect(r.image.author, r.id).not.toBe("");
      expect(r.image.license, r.id).toMatch(/^(CC0|CC BY|Public domain)/i);
      expect(r.image.sourceUrl, r.id).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    }
  });

  it("no repite fotografías entre recetas distintas", () => {
    const srcs = RECIPES.flatMap((r) => (r.image ? [r.image.src] : []));
    expect(new Set(srcs).size).toBe(srcs.length);
  });
});
