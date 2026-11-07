import { ShoppingCart } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Lista de la compra" };

export default function ShoppingPage() {
  return (
    <ComingSoon
      title="Lista de la compra"
      icon={ShoppingCart}
      phase={3}
      description="Selecciona recetas y genera una lista consolidada, agrupada por secciones del supermercado."
    />
  );
}
