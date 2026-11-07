import { expect, test, type Page } from "@playwright/test";

/** Recoge errores de consola (incluidos los de hidratación) y de página. */
function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

test("muestra las 25 recetas sin errores de hidratación", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await expect(page.getByTestId("recipe-card")).toHaveCount(25);
  await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("busca, filtra y abre una ficha", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await page.getByRole("searchbox").fill("boniato");
  await expect(page.getByTestId("recipe-card")).toHaveCount(2);
  await page.getByRole("searchbox").fill("");
  await page.getByRole("button", { name: "Legumbres" }).click();
  await expect(page.getByTestId("recipe-card")).toHaveCount(6);
  await page.getByRole("link", { name: /Lentejas con arroz/ }).click();
  await expect(page.locator("h1:visible")).toHaveText("Lentejas con arroz");
  await expect(page.getByRole("heading", { name: "Para el bebé" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("ajusta raciones y añade a la compra; la lista suma ingredientes", async ({ page }) => {
  await page.goto("/recetas/pollo-guisado-patatas-guisantes");
  const first = page.getByTestId("ingredient-text").first();
  await expect(first).toHaveText("500 g de muslos de pollo");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: /Añadir una ración/ }).click();
  await expect(first).toHaveText("1000 g de muslos de pollo");
  await page.getByRole("button", { name: "Añadir a la lista de la compra" }).click();

  await page.goto("/recetas/gallo-horno-patatas");
  await page.getByRole("button", { name: "Añadir a la lista de la compra" }).click();

  await page.goto("/compra");
  await expect(page.locator("[data-key=patata] [data-testid=item-qty]")).toHaveText("1,5 kg"); // 900 + 600
  await page.getByRole("checkbox", { name: "Comprado: Patatas" }).check({ force: true });
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Comprado: Patatas" })).toBeChecked();
});

test("favoritos persisten tras recargar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Añadir Tortilla de brócoli a favoritos" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Quitar Tortilla de brócoli de favoritos" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Favoritos" }).click();
  await expect(page.locator("[data-testid=recipe-card]:visible")).toHaveCount(1);
});

test("planifica la semana con sobras y genera la compra sin duplicar", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/menu");
  await page.getByRole("button", { name: "Elegir receta para Lunes · Cena" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Lentejas con arroz" }).click();
  await page.getByRole("button", { name: /Cocinar doble para martes/ }).click();
  await expect(page.getByTestId("menu-summary")).toContainText("2 comidas planificadas · 1 preparación");
  await page.getByRole("button", { name: /Generar compra/ }).click();
  await expect(page).toHaveURL(/\/compra$/);
  await expect(page.locator("[data-key=lenteja-pardina] [data-testid=item-qty]")).toHaveText("400 g");
  expect(errors).toEqual([]);
});
