import type { Metadata } from "next";
import Link from "next/link";
import { RECIPES } from "@/data/recipes";

export const metadata: Metadata = { title: "Créditos de las fotografías" };

export default function CreditsPage() {
  const withPhoto = RECIPES.filter((r) => r.image);
  const pending = RECIPES.filter((r) => !r.image);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-brand-800">Créditos de las fotografías</h1>
      <p className="text-stone-600">
        Las fotos son ilustrativas y proceden de Wikimedia Commons, con licencias libres. Se muestran redimensionadas, sin
        otras modificaciones.
      </p>
      <ul className="divide-y divide-stone-100 rounded-3xl bg-white ring-1 ring-brand-900/5">
        {withPhoto.map((r) => (
          <li key={r.id} className="space-y-0.5 px-5 py-3 text-sm">
            <Link href={`/recetas/${r.id}`} className="font-medium text-ink">
              {r.name}
            </Link>
            <p className="text-stone-600">
              Autoría: {r.image!.author} ·{" "}
              {r.image!.licenseUrl ? (
                <a href={r.image!.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  {r.image!.license}
                </a>
              ) : (
                r.image!.license
              )}{" "}
              ·{" "}
              <a href={r.image!.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline">
                Ver original
              </a>
            </p>
          </li>
        ))}
      </ul>
      {pending.length > 0 && (
        <section className="rounded-3xl bg-cream-dark p-5 text-sm">
          <h2 className="mb-2 font-semibold">Fotografías pendientes ({pending.length})</h2>
          <p className="text-stone-600">{pending.map((r) => r.name).join(" · ")}</p>
        </section>
      )}
    </div>
  );
}
