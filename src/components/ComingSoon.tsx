import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  title,
  description,
  phase,
  icon: Icon,
}: {
  title: string;
  description: string;
  phase: number;
  icon: LucideIcon;
}) {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-brand-800">{title}</h1>
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-white p-10 text-center ring-1 ring-brand-900/5">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Icon className="h-7 w-7" aria-hidden />
        </span>
        <p className="max-w-sm text-stone-600">{description}</p>
        <span className="rounded-full bg-cream-dark px-3 py-1 text-xs font-medium text-stone-600">
          Disponible en la fase {phase}
        </span>
      </div>
    </div>
  );
}
