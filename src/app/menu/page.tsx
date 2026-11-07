import type { Metadata } from "next";
import { MenuView } from "./MenuView";

export const metadata: Metadata = { title: "Menú semanal" };

export default function MenuPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-brand-800">Menú semanal</h1>
        <p className="mt-1 text-stone-600">Cenas de lunes a viernes; comidas y cenas el fin de semana.</p>
      </div>
      <MenuView />
    </div>
  );
}
