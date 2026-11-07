import type { Metadata } from "next";
import { ShoppingView } from "./ShoppingView";

export const metadata: Metadata = { title: "Lista de la compra" };

export default function ShoppingPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-brand-800">Lista de la compra</h1>
        <p className="mt-1 text-stone-600">Elige recetas y la lista suma los ingredientes por secciones del súper.</p>
      </div>
      <ShoppingView />
    </div>
  );
}
