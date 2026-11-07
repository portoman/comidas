import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Baby, Clock, Flame, Gauge, Snowflake, Users, Refrigerator } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { RecipeImage } from "@/components/RecipeImage";
import { CATEGORY_BY_ID } from "@/data/categories";
import { getRecipe, RECIPES, totalMinutes } from "@/data/recipes";
import { describeIngredient } from "@/lib/format";
import { formatMinutes } from "@/lib/text";

export function generateStaticParams() {
  return RECIPES.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: PageProps<"/recetas/[id]">): Promise<Metadata> {
  const { id } = await params;
  const recipe = getRecipe(id);
  return { title: recipe?.name ?? "Receta no encontrada" };
}

export default async function RecipePage({ params }: PageProps<"/recetas/[id]">) {
  const { id } = await params;
  const recipe = getRecipe(id);
  if (!recipe) notFound();
  const category = CATEGORY_BY_ID[recipe.category];

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Recetas
      </Link>

      <div className="relative">
        <RecipeImage recipe={recipe} priority sizes="(min-width: 768px) 768px, 100vw" className="aspect-[4/3] w-full rounded-3xl sm:aspect-[16/9]" />
        <FavoriteButton recipeId={recipe.id} recipeName={recipe.name} className="absolute right-3 top-3" />
      </div>

      <header className="space-y-3">
        <span className="inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{category.label}</span>
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
      </header>

      <section className="rounded-3xl bg-white p-5 ring-1 ring-brand-900/5">
        <h2 className="mb-1 font-serif text-xl font-semibold text-brand-800">Ingredientes</h2>
        <p className="mb-3 flex items-center gap-1.5 text-sm text-stone-500">
          <Users className="h-4 w-4" aria-hidden /> {recipe.servings} raciones · 2 adultos y un bebé
          <span className="ml-1 text-xs">(selector de raciones en la fase 2)</span>
        </p>
        <ul className="divide-y divide-stone-100">
          {recipe.ingredients.map((item) => (
            <li key={item.id} className="py-2">
              <span className="first-letter:uppercase">{describeIngredient(item)}</span>
              {item.note && <span className="text-stone-500"> — {item.note}</span>}
              {item.optional && <span className="ml-1 text-xs text-stone-400">(opcional)</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-brand-800">Preparación</h2>
        <ol className="space-y-3">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-3 rounded-3xl bg-white p-4 ring-1 ring-brand-900/5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-cream">{i + 1}</span>
              <div className="space-y-1">
                <p className="leading-relaxed">{step.text}</p>
                {step.minutes && (
                  <p className="flex items-center gap-1 text-xs text-stone-500"><Flame className="h-3.5 w-3.5" aria-hidden /> {formatMinutes(step.minutes)}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {recipe.pressureCooker && (
        <section className="rounded-3xl bg-brand-50 p-5">
          <h2 className="mb-2 flex items-center gap-2 font-serif text-xl font-semibold text-brand-800">
            <Gauge className="h-5 w-5" aria-hidden /> En olla rápida
          </h2>
          <p className="mb-3 text-sm text-brand-800">
            {recipe.pressureCooker.minutesAtPressure} min desde que alcanza presión {recipe.pressureCooker.pressure} · liberación {recipe.pressureCooker.release}
          </p>
          <ol className="list-decimal space-y-2 pl-5">
            {recipe.pressureCooker.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </section>
      )}

      <section className="rounded-3xl bg-amber-50 p-5 ring-1 ring-amber-200/60">
        <h2 className="mb-2 flex items-center gap-2 font-serif text-xl font-semibold text-amber-900">
          <Baby className="h-5 w-5" aria-hidden /> Para el bebé
        </h2>
        <p className="mb-3"><strong>Textura:</strong> {recipe.baby.texture}</p>
        <ul className="mb-3 list-disc space-y-1 pl-5">
          {recipe.baby.howTo.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
        <h3 className="mb-1 font-semibold text-amber-900">Precauciones</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {recipe.baby.warnings.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </section>

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
