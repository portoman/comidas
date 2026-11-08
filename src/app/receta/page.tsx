import type { Metadata } from "next";
import { Suspense } from "react";
import { RecipeRoute } from "./RecipeRoute";

export const metadata: Metadata = { title: "Receta" };

export default function RecipePage() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-3xl animate-pulse rounded-3xl bg-cream-dark" />}>
      <RecipeRoute />
    </Suspense>
  );
}
