import Link from "next/link";
import { Plus } from "lucide-react";
import { RecipeBrowser } from "@/components/RecipeBrowser";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <section className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-brand-800">Recetas</h1>
          <p className="mt-1 text-stone-600">Platos caseros para dos adultos y un bebé.</p>
        </div>
        <Link
          href="/receta/nueva"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-medium text-cream shadow-sm"
        >
          <Plus className="h-4 w-4" aria-hidden /> Nueva
        </Link>
      </section>
      <RecipeBrowser />
    </div>
  );
}
