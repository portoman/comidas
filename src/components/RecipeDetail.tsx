"use client";

import Link from "next/link";
import { ArrowLeft, Baby, Clock, Flame, Gauge, Lightbulb, Microwave, Pencil, Snowflake, Refrigerator, CookingPot, ShieldAlert } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { RecipeImage } from "@/components/RecipeImage";
import { CATEGORY_BY_ID } from "@/data/categories";
import { totalMinutes } from "@/data/recipes";
import { RecipeInteractive } from "@/components/RecipeInteractive";
import { PRESSURE_SAFETY } from "@/data/recipes/helpers";
import type { Appliance, Recipe } from "@/data/types";
import { formatMinutes } from "@/lib/text";

const APPLIANCE_LABEL: Record<Appliance, string> = {
  vitro: "Vitro",
  horno: "Horno",
  "olla-rapida": "Olla rápida",
  microondas: "Microondas",
};
const APPLIANCE_ICON = { vitro: Flame, horno: CookingPot, "olla-rapida": Gauge, microondas: Microwave } as const;

/** Ficha completa de una receta. */
export function RecipeDetail({ recipe, edited }: { recipe: Recipe; edited?: boolean }) {
  const category = CATEGORY_BY_ID[recipe.category];

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Recetas
        </Link>
        <Link
          href={`/receta/editar?id=${encodeURIComponent(recipe.id)}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-900/10"
        >
          <Pencil className="h-4 w-4" aria-hidden /> Editar
        </Link>
      </div>

      <div className="relative">
        <RecipeImage recipe={recipe} priority showCredit sizes="(min-width: 768px) 768px, 100vw" className="aspect-[4/3] w-full rounded-3xl sm:aspect-[16/9]" />
        <FavoriteButton recipeId={recipe.id} recipeName={recipe.name} className="absolute right-3 top-3" />
      </div>

      <header className="space-y-3">
        <span className="inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{category.label}</span>
        {edited && (
          <span className="ml-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Editada por la familia</span>
        )}
        <h1 className="font-serif text-3xl font-semibold leading-tight text-brand-800">{recipe.name}</h1>
        <p className="text-stone-600">{recipe.summary}</p>
        <dl className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-2xl bg-white p-3 ring-1 ring-brand-900/5">
            <dt className="text-stone-500">Preparación</dt>
            <dd className="font-semibold">{formatMinutes(recipe.prepMinutes)}</dd>
          </div>
          <div className="rounded-2xl bg-white p-3 ring-1 ring-brand-900/5">
            <dt className="text-stone-500">Cocción</dt>
            <dd className="font-semibold">{formatMinutes(recipe.cookMinutes)}</dd>
          </div>
          <div className="rounded-2xl bg-brand-700 p-3 text-cream">
            <dt className="flex items-center justify-center gap-1 opacity-80"><Clock className="h-3.5 w-3.5" aria-hidden /> Total</dt>
            <dd className="font-semibold">{formatMinutes(totalMinutes(recipe))}</dd>
          </div>
        </dl>
        {recipe.pressureCooker && (
          <p className="flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
            <Gauge className="h-5 w-5 shrink-0" aria-hidden />
            <span>
              <strong>Olla rápida:</strong> {recipe.pressureCooker.minutesAtPressure} min desde que sube la presión ({recipe.pressureCooker.pressure}) · liberación {recipe.pressureCooker.release}. Los tiempos ya lo incluyen.
            </span>
          </p>
        )}
      </header>

      <RecipeInteractive recipe={recipe} />

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-brand-800">Preparación</h2>
        <ol className="space-y-3">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-3 rounded-3xl bg-white p-4 ring-1 ring-brand-900/5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-cream">{i + 1}</span>
              <div className="space-y-1">
                <p className="leading-relaxed">{step.text}</p>
                {(step.minutes || step.appliance) && (
                  <p className="flex items-center gap-3 text-xs text-stone-500">
                    {step.appliance && (() => {
                      const Icon = APPLIANCE_ICON[step.appliance];
                      return <span className="flex items-center gap-1"><Icon className="h-3.5 w-3.5" aria-hidden /> {APPLIANCE_LABEL[step.appliance]}</span>;
                    })()}
                    {step.minutes && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden /> {formatMinutes(step.minutes)}</span>}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {recipe.pressureCooker && (
        <section className="flex gap-3 rounded-3xl bg-brand-50 p-5 text-sm text-brand-900">
          <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden />
          <p><strong>Seguridad con la olla rápida.</strong> {PRESSURE_SAFETY}</p>
        </section>
      )}

      {recipe.alternative && (
        <section className="flex gap-3 rounded-3xl bg-white p-5 text-sm ring-1 ring-brand-900/5">
          <Lightbulb className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />
          <p>{recipe.alternative}</p>
        </section>
      )}

      {(recipe.baby.texture || recipe.baby.howTo.length > 0 || recipe.baby.warnings.length > 0) && (
      <section className="rounded-3xl bg-amber-50 p-5 ring-1 ring-amber-200/60">
        <h2 className="mb-2 flex items-center gap-2 font-serif text-xl font-semibold text-amber-900">
          <Baby className="h-5 w-5" aria-hidden /> Para el bebé
        </h2>
        {recipe.baby.texture && <p className="mb-3"><strong>Textura:</strong> {recipe.baby.texture}</p>}
        {recipe.baby.howTo.length > 0 && (
          <ul className="mb-3 list-disc space-y-1 pl-5">
            {recipe.baby.howTo.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        )}
        {recipe.baby.warnings.length > 0 && (
          <>
            <h3 className="mb-1 font-semibold text-amber-900">Precauciones</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {recipe.baby.warnings.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </>
        )}
      </section>
      )}

      <section className="rounded-3xl bg-white p-5 ring-1 ring-brand-900/5">
        <h2 className="mb-2 flex items-center gap-2 font-serif text-xl font-semibold text-brand-800">
          <Refrigerator className="h-5 w-5" aria-hidden /> Conservación
        </h2>
        <p className="mb-3 flex items-start gap-2">
          <Snowflake className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
          <span><strong>{recipe.freezable ? "Se puede congelar." : "No se recomienda congelar."}</strong> {recipe.freezingNotes}</span>
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {recipe.storage.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </section>
    </article>
  );
}
