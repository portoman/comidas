import type { Metadata } from "next";
import { RecipeEditor } from "@/components/RecipeEditor";

export const metadata: Metadata = { title: "Nueva receta" };

export default function NewRecipePage() {
  return <RecipeEditor />;
}
