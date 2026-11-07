import type { Metadata } from "next";
import { FavoritesView } from "./FavoritesView";

export const metadata: Metadata = { title: "Favoritos" };

export default function FavoritesPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-brand-800">Favoritos</h1>
      <FavoritesView />
    </div>
  );
}
