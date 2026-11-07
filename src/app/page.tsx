import { RecipeBrowser } from "@/components/RecipeBrowser";
import { RECIPES } from "@/data/recipes";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <section>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-brand-800">Recetas</h1>
        <p className="mt-1 text-stone-600">Platos caseros para dos adultos y un bebé.</p>
      </section>
      <RecipeBrowser recipes={RECIPES} />
    </div>
  );
}
