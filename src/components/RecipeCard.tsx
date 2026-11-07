import Link from "next/link";
import { Clock, Gauge } from "lucide-react";
import { CATEGORY_BY_ID } from "@/data/categories";
import { totalMinutes } from "@/data/recipes";
import type { Recipe } from "@/data/types";
import { formatMinutes } from "@/lib/text";
import { FavoriteButton } from "./FavoriteButton";
import { RecipeImage } from "./RecipeImage";

export function RecipeCard({ recipe, priority }: { recipe: Recipe; priority?: boolean }) {
  const category = CATEGORY_BY_ID[recipe.category];
  return (
    <article
      data-testid="recipe-card"
      className="group relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-brand-900/5 transition hover:shadow-md"
    >
      <Link href={`/recetas/${recipe.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
        <RecipeImage
          recipe={recipe}
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="aspect-[16/10] w-full"
        />
        <div className="space-y-2 p-4">
          <span className="inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
            {category.label}
          </span>
          <h2 className="font-serif text-lg font-semibold leading-snug text-ink">{recipe.name}</h2>
          <p className="flex items-center gap-3 text-sm text-stone-500">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden />
              {formatMinutes(totalMinutes(recipe))}
            </span>
            {recipe.pressureCooker && (
              <span className="flex items-center gap-1 text-brand-700">
                <Gauge className="h-4 w-4" aria-hidden /> Olla rápida
              </span>
            )}
          </p>
        </div>
      </Link>
      <FavoriteButton recipeId={recipe.id} recipeName={recipe.name} className="absolute right-3 top-3" />
    </article>
  );
}
