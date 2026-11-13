import type { Metadata } from "next";
import { Suspense } from "react";
import { EditRoute } from "./EditRoute";

export const metadata: Metadata = { title: "Editar receta" };

export default function EditRecipePage() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-3xl animate-pulse rounded-3xl bg-cream-dark" />}>
      <EditRoute />
    </Suspense>
  );
}
