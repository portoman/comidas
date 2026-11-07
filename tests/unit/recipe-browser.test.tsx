import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RecipeBrowser } from "@/components/RecipeBrowser";
import { RECIPES } from "@/data/recipes";
import { favoritesStore } from "@/hooks/useFavorites";

describe("<RecipeBrowser />", () => {
  it("muestra las 25 recetas en tarjetas con enlace a la ficha", () => {
    render(<RecipeBrowser recipes={RECIPES} />);
    const cards = screen.getAllByTestId("recipe-card");
    expect(cards).toHaveLength(25);
    const first = within(cards[0]).getByRole("link");
    expect(first).toHaveAttribute("href", "/recetas/pollo-guisado-patatas-guisantes");
    expect(screen.getByText("25 recetas")).toBeInTheDocument();
  });

  it("filtra al escribir en el buscador", async () => {
    const user = userEvent.setup();
    render(<RecipeBrowser recipes={RECIPES} />);
    await user.type(screen.getByRole("searchbox"), "lentejas");
    expect(screen.getAllByTestId("recipe-card")).toHaveLength(1);
    expect(screen.getByText("Lentejas con arroz")).toBeInTheDocument();
  });

  it("filtra por categoría", async () => {
    const user = userEvent.setup();
    render(<RecipeBrowser recipes={RECIPES} />);
    await user.click(screen.getByRole("button", { name: "Pescado" }));
    expect(screen.getAllByTestId("recipe-card")).toHaveLength(4);
    await user.click(screen.getByRole("button", { name: "Todas" }));
    expect(screen.getAllByTestId("recipe-card")).toHaveLength(25);
  });

  it("guarda los favoritos en localStorage", async () => {
    const user = userEvent.setup();
    render(<RecipeBrowser recipes={RECIPES} />);
    const btn = screen.getByRole("button", { name: "Añadir Lentejas con arroz a favoritos" });
    await user.click(btn);
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(JSON.parse(window.localStorage.getItem("recetario:favoritos:v1")!)).toEqual(["lentejas-arroz"]);
    await user.click(btn);
    expect(favoritesStore.get()).toEqual([]);
  });
});
