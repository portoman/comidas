"use client";

import { CalendarDays, Check, ClipboardCopy, MessageCircle, Plus, RotateCcw, Share2, Trash2, X } from "lucide-react";
import { recipeHref } from "@/lib/routes";
import Link from "next/link";
import { useMemo, useState } from "react";
import { RecipePicker } from "@/components/RecipePicker";
import { ServingsStepper } from "@/components/ServingsStepper";
import { Sheet } from "@/components/Sheet";
import { getRecipe } from "@/lib/recipes-store";
import { useRecipes } from "@/hooks/useRecipes";
import { useHydrated } from "@/hooks/useHydrated";
import { useMenu, useShopping } from "@/hooks/useStores";
import {
  buildShoppingList,
  formatItemQuantity,
  groupByAisle,
  guessAisle,
  manualToItem,
  mergeSelections,
  selectionsFromWeek,
  shoppingText,
} from "@/lib/shopping";
import { EMPTY_SHOPPING, type ShoppingState } from "@/lib/shopping-store";

export function ShoppingView() {
  const hydrated = useHydrated();
  const recipes = useRecipes();
  const [state, setState] = useShopping();
  const [menu] = useMenu();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualQty, setManualQty] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const checked = useMemo(() => new Set(state.checked), [state.checked]);
  const removed = useMemo(() => new Set(state.removed), [state.removed]);
  const items = useMemo(
    () => [...buildShoppingList(state.selections), ...state.manual.map(manualToItem)].filter((i) => !removed.has(i.key)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recipes: recalcular si se edita una receta
    [state.selections, state.manual, removed, recipes],
  );
  const groups = groupByAisle(items);
  const pendingCount = items.filter((i) => !checked.has(i.key)).length;
  const weekSelections = selectionsFromWeek(menu.current);

  if (!hydrated) {
    return <div className="h-40 animate-pulse rounded-3xl bg-white/60" aria-busy="true" />;
  }

  const update = (fn: (s: ShoppingState) => ShoppingState) => setState(fn);
  function notify(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }

  function setSelection(index: number, patch: Partial<{ servings: number; times: number }>) {
    update((s) => ({ ...s, selections: s.selections.map((x, i) => (i === index ? { ...x, ...patch } : x)) }));
  }

  function toggleItem(key: string) {
    update((s) => ({ ...s, checked: s.checked.includes(key) ? s.checked.filter((k) => k !== key) : [...s.checked, key] }));
  }

  function removeItem(key: string) {
    if (key.startsWith("manual:")) {
      const id = key.slice("manual:".length);
      update((s) => ({ ...s, manual: s.manual.filter((m) => m.id !== id) }));
    } else {
      update((s) => ({ ...s, removed: [...s.removed, key] }));
    }
  }

  function addManual(e: React.FormEvent) {
    e.preventDefault();
    const name = manualName.trim();
    if (!name) return;
    update((s) => ({
      ...s,
      manual: [...s.manual, { id: Math.random().toString(36).slice(2, 9), name, quantity: manualQty.trim() || undefined, aisle: guessAisle(name) }],
    }));
    setManualName("");
    setManualQty("");
  }

  const text = shoppingText(items, checked);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      notify("Lista copiada");
    } catch {
      notify("No se pudo copiar");
    }
  }
  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Lista de la compra", text });
      } catch {
        /* cancelado */
      }
    } else copy();
  }

  return (
    <div className="space-y-5">
      {/* Recetas seleccionadas */}
      <section className="space-y-3 rounded-3xl bg-white p-5 ring-1 ring-brand-900/5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl font-semibold text-brand-800">Recetas</h2>
          <span className="text-sm text-stone-500">{state.selections.length} seleccionadas</span>
        </div>
        {state.selections.length === 0 && (
          <p className="text-sm text-stone-500">Añade recetas para calcular la compra automáticamente.</p>
        )}
        <ul className="divide-y divide-stone-100" data-testid="shopping-selections">
          {state.selections.map((sel, i) => {
            const recipe = getRecipe(sel.recipeId);
            if (!recipe) return null;
            return (
              <li key={`${sel.recipeId}-${i}`} className="space-y-2 py-3">
                <div className="flex items-start justify-between gap-2">
                  <Link href={recipeHref(recipe.id)} className="font-medium leading-snug">
                    {recipe.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => update((s) => ({ ...s, selections: s.selections.filter((_, j) => j !== i) }))}
                    aria-label={`Quitar ${recipe.name}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stone-600">
                  <div className="flex items-center gap-2">
                    <span>Raciones</span>
                    <ServingsStepper value={sel.servings} onChange={(v) => setSelection(i, { servings: v })} label={`Raciones de ${recipe.name}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Veces</span>
                    <ServingsStepper value={sel.times} onChange={(v) => setSelection(i, { times: v })} max={7} label={`Veces que se cocina ${recipe.name}`} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-700 px-4 text-sm font-medium text-cream"
          >
            <Plus className="h-4 w-4" aria-hidden /> Añadir recetas
          </button>
          <button
            type="button"
            disabled={weekSelections.length === 0}
            onClick={() => {
              update((s) => ({ ...s, selections: mergeSelections([...s.selections, ...weekSelections]) }));
              notify("Menú de la semana añadido");
            }}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-50 px-4 text-sm font-medium text-brand-800 ring-1 ring-brand-700/20 disabled:opacity-40"
          >
            <CalendarDays className="h-4 w-4" aria-hidden /> Añadir el menú de la semana
          </button>
        </div>
      </section>

      {/* Lista consolidada */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-xl font-semibold text-brand-800">
            Lista <span className="text-base font-normal text-stone-500">· {pendingCount} pendientes</span>
          </h2>
          <div className="flex gap-2">
            <button type="button" onClick={copy} disabled={items.length === 0} aria-label="Copiar lista" className="flex h-10 items-center gap-1.5 rounded-full bg-white px-3 text-sm ring-1 ring-brand-900/10 disabled:opacity-40">
              <ClipboardCopy className="h-4 w-4" aria-hidden /> Copiar
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(text)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={items.length === 0}
              className={`flex h-10 items-center gap-1.5 rounded-full bg-[#25D366] px-3 text-sm font-medium text-white ${items.length === 0 ? "pointer-events-none opacity-40" : ""}`}
            >
              <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
            </a>
            <button type="button" onClick={share} disabled={items.length === 0} aria-label="Compartir lista" className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-brand-900/10 disabled:opacity-40">
              <Share2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <form onSubmit={addManual} className="flex gap-2">
          <input
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="Añadir producto…"
            aria-label="Nombre del producto"
            className="h-11 min-w-0 flex-1 rounded-xl border border-brand-900/10 bg-white px-3 text-base outline-none focus:border-brand-500"
          />
          <input
            value={manualQty}
            onChange={(e) => setManualQty(e.target.value)}
            placeholder="Cant."
            aria-label="Cantidad"
            className="h-11 w-20 rounded-xl border border-brand-900/10 bg-white px-3 text-base outline-none focus:border-brand-500"
          />
          <button type="submit" aria-label="Añadir producto" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-cream">
            <Plus className="h-5 w-5" aria-hidden />
          </button>
        </form>

        {groups.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center text-stone-500 ring-1 ring-brand-900/5">La lista está vacía.</div>
        ) : (
          <div className="space-y-4" data-testid="shopping-list">
            {groups.map((g) => (
              <div key={g.id} className="overflow-hidden rounded-3xl bg-white ring-1 ring-brand-900/5">
                <h3 className="bg-brand-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brand-700">{g.label}</h3>
                <ul className="divide-y divide-stone-100">
                  {g.items.map((item) => {
                    const done = checked.has(item.key);
                    const q = formatItemQuantity(item);
                    return (
                      <li key={item.key} className="flex items-center gap-2 pr-2" data-testid="shopping-item" data-key={item.key}>
                        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-4 py-3">
                          <input type="checkbox" className="peer sr-only" checked={done} onChange={() => toggleItem(item.key)} aria-label={`Comprado: ${item.name}`} />
                          <span aria-hidden className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 ${done ? "border-brand-600 bg-brand-600 text-white" : "border-stone-300"}`}>
                            {done && <Check className="h-4 w-4" strokeWidth={3} />}
                          </span>
                          <span className={`min-w-0 ${done ? "text-stone-400 line-through" : ""}`}>
                            <span className="font-medium">{item.name}</span>
                            {q && <span className="ml-1.5 font-semibold tabular-nums text-brand-700" data-testid="item-qty">{q}</span>}
                            {item.recipes.length > 0 && (
                              <span className="block truncate text-xs text-stone-400">{item.recipes.join(" · ")}</span>
                            )}
                          </span>
                        </label>
                        <button type="button" onClick={() => removeItem(item.key)} aria-label={`Eliminar ${item.name}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100">
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap justify-between gap-3 pt-1 text-sm">
          {state.removed.length > 0 ? (
            <button type="button" onClick={() => update((s) => ({ ...s, removed: [] }))} className="flex items-center gap-1.5 text-brand-700">
              <RotateCcw className="h-4 w-4" aria-hidden /> Recuperar {state.removed.length} eliminados
            </button>
          ) : (
            <span />
          )}
          {(state.selections.length > 0 || state.manual.length > 0) && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("¿Vaciar toda la lista de la compra?")) setState(EMPTY_SHOPPING);
              }}
              className="flex items-center gap-1.5 text-rose-600"
            >
              <Trash2 className="h-4 w-4" aria-hidden /> Vaciar lista
            </button>
          )}
        </div>
      </section>

      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Añadir recetas">
        <RecipePicker
          multiple
          onPick={(recipes) => {
            update((s) => ({
              ...s,
              selections: mergeSelections([...s.selections, ...recipes.map((r) => ({ recipeId: r.id, servings: r.servings, times: 1 }))]),
            }));
            setPickerOpen(false);
          }}
        />
      </Sheet>

      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:bottom-8">
        {toast && <span className="rounded-full bg-ink px-4 py-2.5 text-sm text-cream shadow-lg">{toast}</span>}
      </div>
    </div>
  );
}
