"use client";

import { ArrowDown, ArrowLeft, ArrowUp, Camera, Gauge, ImageOff, LoaderCircle, Plus, RotateCcw, Save, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, type ReactNode } from "react";
import { CATEGORIES } from "@/data/categories";
import { AISLE_LABELS, AISLE_ORDER, allIngredients, customIngredientId } from "@/data/ingredients";
import type { Aisle, Appliance, IngredientDef, Recipe, Unit } from "@/data/types";
import { useAuth } from "@/hooks/useAuth";
import { uploadRecipePhoto } from "@/lib/photo";
import {
  draftKey,
  draftToRecipe,
  emptyDraft,
  recipeToDraft,
  type DraftIngredient,
  type DraftStep,
  type RecipeDraft,
} from "@/lib/recipe-draft";
import { deleteRecipe, isBaseRecipe, newRecipeId, nextRecipeNumber, restoreRecipe, saveRecipe } from "@/lib/recipes-store";
import { recipeHref } from "@/lib/routes";
import { guessAisle } from "@/lib/shopping";
import { normalizeText } from "@/lib/text";
import { RecipeImage } from "./RecipeImage";

const UNITS: { id: Unit; label: string }[] = [
  { id: "g", label: "g" },
  { id: "kg", label: "kg" },
  { id: "ml", label: "ml" },
  { id: "l", label: "l" },
  { id: "ud", label: "unidad(es)" },
  { id: "diente", label: "diente(s)" },
  { id: "hoja", label: "hoja(s)" },
  { id: "ramita", label: "ramita(s)" },
  { id: "cda", label: "cucharada(s)" },
  { id: "cdta", label: "cucharadita(s)" },
  { id: "pizca", label: "pizca(s)" },
  { id: "al-gusto", label: "al gusto" },
];

const APPLIANCES: { id: Appliance | ""; label: string }[] = [
  { id: "", label: "—" },
  { id: "vitro", label: "Vitro" },
  { id: "olla-rapida", label: "Olla rápida" },
  { id: "horno", label: "Horno" },
  { id: "microondas", label: "Microondas" },
];

const input =
  "w-full rounded-2xl border border-stone-200 bg-cream px-3.5 py-2.5 text-base outline-none focus:border-brand-500";

function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

interface Props {
  /** Receta a editar; sin ella, receta nueva. */
  recipe?: Recipe;
  edited?: boolean;
}

export function RecipeEditor({ recipe, edited }: Props) {
  const router = useRouter();
  const auth = useAuth();
  const householdId = auth.status === "signed-in" ? auth.family.householdId : null;
  const [draft, setDraft] = useState<RecipeDraft>(() => (recipe ? recipeToDraft(recipe) : emptyDraft()));
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState<null | "save" | "photo" | "delete">(null);

  const update = <K extends keyof RecipeDraft>(key: K, value: RecipeDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setIngredient = (key: string, patch: Partial<DraftIngredient>) =>
    setDraft((d) => ({ ...d, ingredients: d.ingredients.map((i) => (i.key === key ? { ...i, ...patch } : i)) }));
  const setStep = (key: string, patch: Partial<DraftStep>) =>
    setDraft((d) => ({ ...d, steps: d.steps.map((s) => (s.key === key ? { ...s, ...patch } : s)) }));

  async function save() {
    const result = draftToRecipe(draft, {
      id: recipe?.id ?? newRecipeId(draft.name),
      number: recipe?.number ?? nextRecipeNumber(),
      tags: recipe?.tags,
    });
    if (!result.ok) {
      setErrors(result.errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setBusy("save");
    setErrors([]);
    try {
      await saveRecipe(result.recipe);
      router.push(recipeHref(result.recipe.id));
      // La página anterior puede quedar guardada (navegación instantánea):
      // se deja lista para la próxima receta.
      if (!recipe) setDraft(emptyDraft());
    } catch (e) {
      setErrors([(e as Error).message]);
    }
    setBusy(null);
  }

  async function remove() {
    if (!recipe) return;
    const base = isBaseRecipe(recipe.id);
    const question = base
      ? `¿Ocultar «${recipe.name}»? Podrás recuperarla desde Cuenta → Recetas ocultas.`
      : `¿Borrar «${recipe.name}»? No se puede deshacer.`;
    if (!window.confirm(question)) return;
    setBusy("delete");
    try {
      await deleteRecipe(recipe.id);
      router.push("/");
    } catch (e) {
      setErrors([(e as Error).message]);
    }
    setBusy(null);
  }

  async function restore() {
    if (!recipe || !window.confirm("¿Descartar los cambios y volver a la receta original?")) return;
    setBusy("save");
    try {
      await restoreRecipe(recipe.id);
      router.push(recipeHref(recipe.id));
    } catch (e) {
      setErrors([(e as Error).message]);
    }
    setBusy(null);
  }

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setBusy("photo");
    try {
      update("image", await uploadRecipePhoto(file, draft.name || "Foto de la receta", householdId));
    } catch (e) {
      setErrors([(e as Error).message]);
    }
    setBusy(null);
  }

  return (
    <form
      className="mx-auto max-w-3xl space-y-5 pb-24"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <Link href={recipe ? recipeHref(recipe.id) : "/"} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {recipe ? "Volver a la receta" : "Recetas"}
      </Link>
      <h1 className="font-serif text-3xl font-semibold text-brand-800">{recipe ? "Editar receta" : "Nueva receta"}</h1>
      {recipe && isBaseRecipe(recipe.id) && (
        <p className="text-sm text-stone-600">
          Es una de las recetas incluidas en la app: siempre podrás volver a la versión original.
        </p>
      )}

      {errors.length > 0 && (
        <div role="alert" className="rounded-3xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
          <p className="mb-1 font-semibold">Revisa estos datos:</p>
          <ul className="list-disc space-y-0.5 pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <Card title="Datos básicos">
        <Field label="Nombre">
          <input className={input} value={draft.name} onChange={(e) => update("name", e.target.value)} required />
        </Field>
        <Field label="Categoría">
          <select className={input} value={draft.category} onChange={(e) => update("category", e.target.value as RecipeDraft["category"])}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Descripción corta">
          <textarea className={input} rows={2} value={draft.summary} onChange={(e) => update("summary", e.target.value)} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Preparación (min)">
            <input className={input} inputMode="numeric" value={draft.prepMinutes} onChange={(e) => update("prepMinutes", e.target.value)} />
          </Field>
          <Field label="Cocción (min)">
            <input className={input} inputMode="numeric" value={draft.cookMinutes} onChange={(e) => update("cookMinutes", e.target.value)} />
          </Field>
          <Field label="Raciones">
            <input className={input} inputMode="numeric" value={draft.servings} onChange={(e) => update("servings", e.target.value)} />
          </Field>
        </div>
        <p className="text-xs text-stone-500">Raciones de la receta tal y como la escribes (2 adultos + bebé = 3).</p>
      </Card>

      <Card title="Foto">
        {draft.image ? (
          <div className="relative">
            <RecipeImage recipe={{ name: draft.name, category: draft.category, image: draft.image }} sizes="(min-width: 768px) 768px, 100vw" className="aspect-[16/10] w-full rounded-2xl" />
            <button
              type="button"
              onClick={() => update("image", null)}
              className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-red-700"
            >
              <ImageOff className="h-4 w-4" aria-hidden /> Quitar
            </button>
          </div>
        ) : (
          <p className="text-sm text-stone-500">Sin foto: se mostrará un dibujo de la categoría.</p>
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800">
          {busy === "photo" ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Camera className="h-4 w-4" aria-hidden />}
          {draft.image ? "Cambiar foto" : "Hacer o elegir foto"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy !== null}
            onChange={(e) => {
              void pickPhoto(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </Card>

      <Card title="Ingredientes">
        <ul className="space-y-3">
          {draft.ingredients.map((ing, i) => (
            <li key={ing.key} className="space-y-2 rounded-2xl bg-cream p-3" data-testid="editor-ingredient">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">
                  {ing.name}
                  {ing.custom && <span className="ml-2 text-xs font-normal text-stone-500">({AISLE_LABELS[ing.custom.aisle]})</span>}
                </p>
                <RowActions
                  label={ing.name}
                  onUp={i > 0 ? () => update("ingredients", move(draft.ingredients, i, -1)) : undefined}
                  onDown={i < draft.ingredients.length - 1 ? () => update("ingredients", move(draft.ingredients, i, 1)) : undefined}
                  onRemove={() => update("ingredients", draft.ingredients.filter((x) => x.key !== ing.key))}
                />
              </div>
              <div className="grid grid-cols-[6rem_1fr] gap-2">
                <input
                  aria-label={`Cantidad de ${ing.name}`}
                  className={input}
                  inputMode="decimal"
                  placeholder="Cant."
                  disabled={ing.unit === "al-gusto"}
                  value={ing.unit === "al-gusto" ? "" : ing.quantity}
                  onChange={(e) => setIngredient(ing.key, { quantity: e.target.value })}
                />
                <select
                  aria-label={`Unidad de ${ing.name}`}
                  className={input}
                  value={ing.unit}
                  onChange={(e) => setIngredient(ing.key, { unit: e.target.value as Unit })}
                >
                  {UNITS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
              <input
                aria-label={`Nota de ${ing.name}`}
                className={input}
                placeholder="Nota (opcional): en dados, sin piel…"
                value={ing.note}
                onChange={(e) => setIngredient(ing.key, { note: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm text-stone-600">
                <input type="checkbox" checked={ing.optional} onChange={(e) => setIngredient(ing.key, { optional: e.target.checked })} />
                Opcional (no se añade a la compra)
              </label>
            </li>
          ))}
        </ul>
        <IngredientAdder
          excluded={new Set(draft.ingredients.map((i) => i.id))}
          onAdd={(ing) => update("ingredients", [...draft.ingredients, ing])}
        />
      </Card>

      <Card title="Preparación">
        <ol className="space-y-3">
          {draft.steps.map((step, i) => (
            <li key={step.key} className="space-y-2 rounded-2xl bg-cream p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-cream">{i + 1}</span>
                <RowActions
                  label={`paso ${i + 1}`}
                  onUp={i > 0 ? () => update("steps", move(draft.steps, i, -1)) : undefined}
                  onDown={i < draft.steps.length - 1 ? () => update("steps", move(draft.steps, i, 1)) : undefined}
                  onRemove={() => update("steps", draft.steps.filter((x) => x.key !== step.key))}
                />
              </div>
              <textarea
                aria-label={`Paso ${i + 1}`}
                className={input}
                rows={3}
                value={step.text}
                onChange={(e) => setStep(step.key, { text: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  aria-label={`Minutos del paso ${i + 1}`}
                  className={input}
                  inputMode="numeric"
                  placeholder="Minutos"
                  value={step.minutes}
                  onChange={(e) => setStep(step.key, { minutes: e.target.value })}
                />
                <select
                  aria-label={`Aparato del paso ${i + 1}`}
                  className={input}
                  value={step.appliance}
                  onChange={(e) => setStep(step.key, { appliance: e.target.value as Appliance | "" })}
                >
                  {APPLIANCES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => update("steps", [...draft.steps, { key: draftKey(), text: "", minutes: "", appliance: "" }])}
          className="flex items-center gap-1.5 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800"
        >
          <Plus className="h-4 w-4" aria-hidden /> Añadir paso
        </button>
      </Card>

      <Card title="Olla rápida">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft.usePressureCooker} onChange={(e) => update("usePressureCooker", e.target.checked)} />
          <Gauge className="h-4 w-4 text-brand-700" aria-hidden /> Se cocina en olla rápida
        </label>
        {draft.usePressureCooker && (
          <div className="grid grid-cols-3 gap-2">
            <Field label="Min. con presión">
              <input
                className={input}
                inputMode="numeric"
                value={draft.pressure.minutesAtPressure}
                onChange={(e) => update("pressure", { ...draft.pressure, minutesAtPressure: e.target.value })}
              />
            </Field>
            <Field label="Presión">
              <select
                className={input}
                value={draft.pressure.pressure}
                onChange={(e) => update("pressure", { ...draft.pressure, pressure: e.target.value as "alta" | "baja" })}
              >
                <option value="alta">Alta</option>
                <option value="baja">Baja</option>
              </select>
            </Field>
            <Field label="Liberación">
              <select
                className={input}
                value={draft.pressure.release}
                onChange={(e) => update("pressure", { ...draft.pressure, release: e.target.value as RecipeDraft["pressure"]["release"] })}
              >
                <option value="natural">Natural</option>
                <option value="rápida">Rápida</option>
                <option value="mixta">Mixta</option>
              </select>
            </Field>
          </div>
        )}
        <Field label="Alternativa o consejo (opcional)">
          <textarea className={input} rows={2} value={draft.alternative} onChange={(e) => update("alternative", e.target.value)} />
        </Field>
      </Card>

      <Card title="Para el bebé">
        <Field label="Textura">
          <input className={input} value={draft.babyTexture} onChange={(e) => update("babyTexture", e.target.value)} placeholder="Chafado con tenedor, trocitos blandos…" />
        </Field>
        <Field label="Cómo preparar su ración (una indicación por línea)">
          <textarea className={input} rows={3} value={draft.babyHowTo} onChange={(e) => update("babyHowTo", e.target.value)} />
        </Field>
        <Field label="Precauciones (una por línea)">
          <textarea className={input} rows={4} value={draft.babyWarnings} onChange={(e) => update("babyWarnings", e.target.value)} />
        </Field>
      </Card>

      <Card title="Conservación">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft.freezable} onChange={(e) => update("freezable", e.target.checked)} /> Se puede congelar
        </label>
        <Field label="Notas de congelación">
          <textarea className={input} rows={2} value={draft.freezingNotes} onChange={(e) => update("freezingNotes", e.target.value)} />
        </Field>
        <Field label="Conservación en nevera (una indicación por línea)">
          <textarea className={input} rows={3} value={draft.storage} onChange={(e) => update("storage", e.target.value)} />
        </Field>
      </Card>

      {recipe && (
        <div className="flex flex-wrap gap-2">
          {edited && (
            <button type="button" onClick={() => void restore()} disabled={busy !== null} className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-brand-800 ring-1 ring-brand-900/15">
              <RotateCcw className="h-4 w-4" aria-hidden /> Volver a la original
            </button>
          )}
          <button type="button" onClick={() => void remove()} disabled={busy !== null} className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200">
            <Trash2 className="h-4 w-4" aria-hidden /> {isBaseRecipe(recipe.id) ? "Ocultar receta" : "Borrar receta"}
          </button>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-brand-900/10 bg-cream/95 px-4 py-3 backdrop-blur-md md:bottom-0">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Link href={recipe ? recipeHref(recipe.id) : "/"} className="flex-1 rounded-full px-4 py-3 text-center font-medium text-brand-800 ring-1 ring-brand-900/15">
            Cancelar
          </Link>
          <button type="submit" disabled={busy !== null} className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-brand-700 px-4 py-3 font-medium text-cream disabled:opacity-60">
            {busy === "save" ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> : <Save className="h-5 w-5" aria-hidden />}
            Guardar receta
          </button>
        </div>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-3xl bg-white p-5 ring-1 ring-brand-900/5">
      <h2 className="font-serif text-xl font-semibold text-brand-800">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}

function RowActions({ label, onUp, onDown, onRemove }: { label: string; onUp?: () => void; onDown?: () => void; onRemove: () => void }) {
  const btn = "flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-white disabled:opacity-30";
  return (
    <div className="flex shrink-0 items-center">
      <button type="button" className={btn} onClick={onUp} disabled={!onUp} aria-label={`Subir ${label}`}>
        <ArrowUp className="h-4 w-4" aria-hidden />
      </button>
      <button type="button" className={btn} onClick={onDown} disabled={!onDown} aria-label={`Bajar ${label}`}>
        <ArrowDown className="h-4 w-4" aria-hidden />
      </button>
      <button type="button" className={`${btn} text-red-600`} onClick={onRemove} aria-label={`Quitar ${label}`}>
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function defaultUnit(def: IngredientDef): Unit {
  if (def.aisle === "especias-aceites") return def.id === "sal" ? "al-gusto" : "cda";
  if (def.id === "huevo") return "ud";
  return "g";
}

/** Buscador para añadir un ingrediente del catálogo o uno nuevo. */
function IngredientAdder({ excluded, onAdd }: { excluded: ReadonlySet<string>; onAdd: (ing: DraftIngredient) => void }) {
  const [query, setQuery] = useState("");
  const [aisle, setAisle] = useState<Aisle | null>(null);
  const listId = useId();
  const q = normalizeText(query.trim());
  const matches = useMemo(() => {
    if (!q) return [];
    return allIngredients()
      .filter((d) => !excluded.has(d.id))
      .filter((d) => [d.name, d.plural ?? "", ...(d.synonyms ?? [])].some((n) => normalizeText(n).includes(q)))
      .slice(0, 8);
  }, [q, excluded]);
  const exact = matches.some((d) => normalizeText(d.name) === q || normalizeText(d.plural ?? "") === q);

  function add(def: IngredientDef, custom?: DraftIngredient["custom"]) {
    onAdd({ key: draftKey(), id: def.id, name: def.name, custom, quantity: "", unit: defaultUnit(def), note: "", optional: false });
    setQuery("");
    setAisle(null);
  }

  function addCustom() {
    const name = query.trim();
    const guessed = guessAisle(name);
    const chosen: Aisle = aisle ?? (guessed === "otros" ? "despensa" : guessed);
    const custom = { name: name.charAt(0).toUpperCase() + name.slice(1), aisle: chosen };
    add({ id: customIngredientId(name), ...custom }, custom);
  }

  return (
    <div className="space-y-2 rounded-2xl border border-dashed border-brand-200 p-3">
      <label htmlFor={listId} className="flex items-center gap-2 text-sm font-medium text-brand-800">
        <Plus className="h-4 w-4" aria-hidden /> Añadir ingrediente
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
        <input
          id={listId}
          type="search"
          className={`${input} pl-9`}
          placeholder="Busca: pollo, calabacín, arroz…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (matches[0]) add(matches[0]);
              else if (query.trim()) addCustom();
            }
          }}
        />
      </div>
      {q && (
        <ul className="divide-y divide-stone-100 rounded-2xl bg-white ring-1 ring-stone-200">
          {matches.map((d) => (
            <li key={d.id}>
              <button type="button" onClick={() => add(d)} className="flex w-full items-center justify-between px-4 py-2.5 text-left">
                <span>{d.name}</span>
                <span className="text-xs text-stone-500">{AISLE_LABELS[d.aisle]}</span>
              </button>
            </li>
          ))}
          {!exact && (
            <li className="space-y-2 px-4 py-3">
              <p className="text-sm">
                Ingrediente nuevo: <strong>{query.trim()}</strong>
              </p>
              <div className="flex gap-2">
                <select
                  aria-label="Sección del súper"
                  className={`${input} py-2 text-sm`}
                  value={aisle ?? (guessAisle(query) === "otros" ? "despensa" : guessAisle(query))}
                  onChange={(e) => setAisle(e.target.value as Aisle)}
                >
                  {AISLE_ORDER.map((a) => (
                    <option key={a} value={a}>
                      {AISLE_LABELS[a]}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={addCustom} className="shrink-0 rounded-full bg-brand-700 px-4 text-sm font-medium text-cream">
                  Añadir
                </button>
              </div>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
