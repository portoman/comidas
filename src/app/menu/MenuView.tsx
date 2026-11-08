"use client";

import { Archive, CalendarPlus, Copy, Eraser, History, Plus, Repeat, Save, ShoppingCart, Trash2, X } from "lucide-react";
import { recipeHref } from "@/lib/routes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RecipePicker } from "@/components/RecipePicker";
import { ServingsStepper } from "@/components/ServingsStepper";
import { Sheet } from "@/components/Sheet";
import { totalMinutes } from "@/data/recipes";
import { getRecipe } from "@/lib/recipes-store";
import { useRecipes } from "@/hooks/useRecipes";
import { useHydrated } from "@/hooks/useHydrated";
import { useMenu, useShopping } from "@/hooks/useStores";
import {
  DAYS,
  ensureWeek,
  formatWeekStart,
  mondayOf,
  nextSlot,
  preparationsCount,
  restoreWeek,
  saveWeek,
  setSlot,
  shareWith,
  SLOTS,
  startNewWeek,
  unshare,
  type MenuState,
  type SlotId,
} from "@/lib/menu-store";
import { mergeSelections, selectionsFromWeek } from "@/lib/shopping";
import { formatMinutes } from "@/lib/text";

const slotLabel = (id: SlotId) => {
  const s = SLOTS.find((x) => x.id === id)!;
  return `${DAYS.find((d) => d.id === s.day)!.label} · ${s.meal === "comida" ? "Comida" : "Cena"}`;
};

export function MenuView() {
  const hydrated = useHydrated();
  const router = useRouter();
  useRecipes(); // vuelve a pintar si cambian las recetas
  const [menu, setMenu] = useMenu();
  const [, setShopping] = useShopping();
  const [picking, setPicking] = useState<SlotId | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!hydrated) return <div className="h-40 animate-pulse rounded-3xl bg-white/60" aria-busy="true" />;

  const week = menu.current;
  const update = (fn: (m: MenuState) => MenuState) => setMenu((m) => fn(ensureWeek(m)));
  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };
  const preparations = preparationsCount(week);
  const filled = Object.keys(week.slots).length;

  function generateShopping() {
    const sel = selectionsFromWeek(week);
    setShopping((s) => ({ ...s, selections: mergeSelections([...s.selections, ...sel]) }));
    router.push("/compra");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-stone-500">Semana del {formatWeekStart(week.start || mondayOf(new Date()))}</p>
          <p className="text-sm text-stone-600" data-testid="menu-summary">
            {filled} {filled === 1 ? "comida planificada" : "comidas planificadas"} ·{" "}
            <strong>{preparations} {preparations === 1 ? "preparación" : "preparaciones"}</strong>
          </p>
        </div>
        <button type="button" onClick={() => setHistoryOpen(true)} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-3 text-sm ring-1 ring-brand-900/10">
          <History className="h-4 w-4" aria-hidden /> Menús guardados ({menu.archive.length})
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" data-testid="week">
        {DAYS.map((day) => (
          <section key={day.id} className="rounded-3xl bg-white p-4 ring-1 ring-brand-900/5">
            <h2 className="mb-2 font-serif text-lg font-semibold text-brand-800">{day.label}</h2>
            <div className="space-y-2">
              {SLOTS.filter((s) => s.day === day.id).map((slot) => {
                const value = week.slots[slot.id];
                const recipe = value ? getRecipe(value.recipeId) : undefined;
                const next = nextSlot(slot.id);
                return (
                  <div key={slot.id} data-testid={`slot-${slot.id}`} className="rounded-2xl bg-cream p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">{slot.meal === "comida" ? "Comida" : "Cena"}</p>
                    {!value || !recipe ? (
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setPicking(slot.id)} aria-label={`Elegir receta para ${slotLabel(slot.id)}`} className="flex h-10 items-center gap-1.5 rounded-xl bg-white px-3 text-sm font-medium text-brand-700 ring-1 ring-brand-700/20">
                          <Plus className="h-4 w-4" aria-hidden /> Elegir receta
                        </button>
                      </div>
                    ) : value.leftoverOf ? (
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link href={recipeHref(recipe.id)} className="font-medium leading-snug">{recipe.name}</Link>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-700">
                            <Repeat className="h-3.5 w-3.5" aria-hidden /> Sobras de {slotLabel(value.leftoverOf).toLowerCase()} · no se cocina
                          </p>
                        </div>
                        <button type="button" onClick={() => update((m) => unshare(m, slot.id))} aria-label={`Quitar sobras de ${slotLabel(slot.id)}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-white">
                          <X className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={recipeHref(recipe.id)} className="font-medium leading-snug">{recipe.name}</Link>
                            <p className="text-xs text-stone-500">{formatMinutes(totalMinutes(recipe))}</p>
                          </div>
                          <button type="button" onClick={() => update((m) => setSlot(m, slot.id, null))} aria-label={`Quitar receta de ${slotLabel(slot.id)}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-white">
                            <X className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-sm text-stone-600">
                            <span>Raciones</span>
                            <ServingsStepper
                              value={value.servings}
                              onChange={(v) => update((m) => setSlot(m, slot.id, { ...value, servings: v }))}
                              label={`Raciones de ${slotLabel(slot.id)}`}
                            />
                          </div>
                          <button type="button" onClick={() => setPicking(slot.id)} className="text-sm font-medium text-brand-700">Cambiar</button>
                        </div>
                        {next && !week.slots[next] && (
                          <button
                            type="button"
                            onClick={() => update((m) => shareWith(m, slot.id, next))}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2 text-sm text-brand-800 ring-1 ring-brand-700/15"
                          >
                            <Copy className="h-4 w-4" aria-hidden /> Cocinar doble para {slotLabel(next).toLowerCase()}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button type="button" disabled={filled === 0} onClick={() => { update((m) => saveWeek(m)); notify("Menú guardado"); }} className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-white text-sm font-medium text-brand-800 ring-1 ring-brand-900/10 disabled:opacity-40">
          <Save className="h-4 w-4" aria-hidden /> Guardar
        </button>
        <button type="button" onClick={() => { update((m) => startNewWeek(m)); notify(filled ? "Semana anterior guardada" : "Nueva semana"); }} className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-white text-sm font-medium text-brand-800 ring-1 ring-brand-900/10">
          <CalendarPlus className="h-4 w-4" aria-hidden /> Nueva semana
        </button>
        <button
          type="button"
          disabled={filled === 0}
          onClick={() => {
            if (window.confirm("¿Vaciar el menú de esta semana?")) update((m) => ({ ...m, current: { ...m.current, slots: {} } }));
          }}
          className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-white text-sm font-medium text-rose-600 ring-1 ring-brand-900/10 disabled:opacity-40"
        >
          <Eraser className="h-4 w-4" aria-hidden /> Limpiar
        </button>
      </div>

      <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 md:static">
        <button type="button" onClick={generateShopping} disabled={preparations === 0} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 font-medium text-cream shadow-lg disabled:opacity-40 md:shadow-none">
          <ShoppingCart className="h-5 w-5" aria-hidden /> Generar compra{preparations > 0 ? ` (${preparations} ${preparations === 1 ? "preparación" : "preparaciones"})` : ""}
        </button>
      </div>

      <Sheet open={picking !== null} onClose={() => setPicking(null)} title={picking ? slotLabel(picking) : "Elegir receta"}>
        {picking && (
          <RecipePicker
            onPick={([r]) => {
              const current = menu.current.slots[picking];
              update((m) => setSlot(m, picking, { recipeId: r.id, servings: current && !current.leftoverOf ? current.servings : r.servings }));
              setPicking(null);
            }}
          />
        )}
      </Sheet>

      <Sheet open={historyOpen} onClose={() => setHistoryOpen(false)} title="Menús guardados">
        {menu.archive.length === 0 ? (
          <p className="text-sm text-stone-500">Aún no hay menús guardados. Pulsa «Guardar» o «Nueva semana» para guardar el actual.</p>
        ) : (
          <ul className="space-y-2">
            {menu.archive.map((w) => {
              const names = Object.values(w.slots).filter((s) => s && !s.leftoverOf).map((s) => getRecipe(s!.recipeId)?.name).filter(Boolean);
              return (
                <li key={w.id} className="rounded-2xl bg-white p-3 ring-1 ring-brand-900/5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">Semana del {formatWeekStart(w.start)}</p>
                      <p className="line-clamp-2 text-xs text-stone-500">{names.join(" · ") || "Vacío"}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (Object.keys(week.slots).length === 0 || window.confirm("Se sustituirá el menú actual. ¿Continuar?")) {
                            setMenu((m) => restoreWeek(m, w.id));
                            setHistoryOpen(false);
                            notify("Menú recuperado");
                          }
                        }}
                        aria-label={`Recuperar semana del ${formatWeekStart(w.start)}`}
                        className="flex h-9 items-center gap-1 rounded-full bg-brand-50 px-3 text-sm text-brand-800"
                      >
                        <Archive className="h-4 w-4" aria-hidden /> Usar
                      </button>
                      <button
                        type="button"
                        onClick={() => setMenu((m) => ({ ...m, archive: m.archive.filter((x) => x.id !== w.id) }))}
                        aria-label={`Borrar semana del ${formatWeekStart(w.start)}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Sheet>

      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(9rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:bottom-8">
        {toast && <span className="rounded-full bg-ink px-4 py-2.5 text-sm text-cream shadow-lg">{toast}</span>}
      </div>
    </div>
  );
}
