"use client";

import { CalendarPlus, Check, ShoppingCart, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Recipe } from "@/data/types";
import { useMenu, useShopping } from "@/hooks/useStores";
import { describeIngredient } from "@/lib/format";
import { DAYS, mondayOf, newWeek, setSlot, SLOTS, type SlotId } from "@/lib/menu-store";
import { addToShopping } from "@/lib/shopping-store";
import { getRecipe } from "@/lib/recipes-store";
import { ServingsStepper } from "./ServingsStepper";
import { Sheet } from "./Sheet";

export function RecipeInteractive({ recipe }: { recipe: Recipe }) {
  const [servings, setServings] = useState(recipe.servings);
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const [, setShopping] = useShopping();
  const [menu, setMenu] = useMenu();
  const [toast, setToast] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const factor = servings / recipe.servings;

  function notify(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addShopping() {
    setShopping((s) => addToShopping(s, { recipeId: recipe.id, servings, times: 1 }));
    notify(`Añadida a la compra (${servings} raciones)`);
  }

  function assign(slot: SlotId) {
    setMenu((m) => {
      const base = m.current.start ? m : { ...m, current: newWeek(mondayOf(new Date())) };
      return setSlot(base, slot, { recipeId: recipe.id, servings });
    });
    setMenuOpen(false);
    const s = SLOTS.find((x) => x.id === slot)!;
    notify(`Añadida al menú: ${DAYS.find((d) => d.id === s.day)!.label}, ${s.meal}`);
  }

  return (
    <>
      <section className="rounded-3xl bg-white p-5 ring-1 ring-brand-900/5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-brand-800">Ingredientes</h2>
            <p className="flex items-center gap-1.5 text-sm text-stone-500">
              <Users className="h-4 w-4" aria-hidden />
              {servings === recipe.servings ? "2 adultos y un bebé" : `Base: ${recipe.servings} raciones (2 adultos y un bebé)`}
            </p>
          </div>
          <ServingsStepper value={servings} onChange={setServings} />
        </div>
        <ul className="divide-y divide-stone-100" data-testid="ingredient-list">
          {recipe.ingredients.map((item) => {
            const done = checked.has(item.id);
            return (
              <li key={item.id}>
                <label className="flex cursor-pointer items-start gap-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => toggle(item.id)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 ${
                      done ? "border-brand-600 bg-brand-600 text-white" : "border-stone-300 bg-white"
                    }`}
                  >
                    {done && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                  <span className={done ? "text-stone-400 line-through" : ""}>
                    <span data-testid="ingredient-text" className="font-medium first-letter:uppercase">
                      {describeIngredient(item, factor)}
                    </span>
                    {item.note && <span className="text-stone-500"> — {item.note}</span>}
                    {item.optional && <span className="ml-1 text-xs text-stone-400">(opcional)</span>}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={addShopping}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-700 px-4 font-medium text-cream transition active:scale-[0.98]"
          >
            <ShoppingCart className="h-5 w-5" aria-hidden /> Añadir a la lista de la compra
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-50 px-4 font-medium text-brand-800 ring-1 ring-brand-700/20 transition active:scale-[0.98]"
          >
            <CalendarPlus className="h-5 w-5" aria-hidden /> Añadir al menú semanal
          </button>
        </div>
      </section>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="¿Qué día?">
        <p className="mb-3 text-sm text-stone-600">
          Se añadirá con {servings} raciones. Si el hueco ya tiene receta, se sustituye.
        </p>
        <ul className="space-y-2">
          {SLOTS.map((slot) => {
            const day = DAYS.find((d) => d.id === slot.day)!;
            const current = menu.current.slots[slot.id];
            const currentName = current ? getRecipe(current.recipeId)?.name : undefined;
            return (
              <li key={slot.id}>
                <button
                  type="button"
                  onClick={() => assign(slot.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-brand-900/5 active:bg-brand-50"
                >
                  <span className="font-medium">
                    {day.label} · {slot.meal === "comida" ? "Comida" : "Cena"}
                  </span>
                  <span className="truncate text-sm text-stone-500">
                    {current ? (current.leftoverOf ? "Sobras" : currentName) : "Libre"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Sheet>

      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 transition md:bottom-8 ${
          toast ? "opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {toast && (
          <span className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink px-4 py-2.5 text-sm text-cream shadow-lg">
            {toast}
            <Link href={toast.startsWith("Añadida a la compra") ? "/compra" : "/menu"} className="font-semibold text-brand-200 underline">
              Ver
            </Link>
          </span>
        )}
      </div>
    </>
  );
}
