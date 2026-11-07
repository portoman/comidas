import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Menú semanal" };

export default function MenuPage() {
  return (
    <ComingSoon
      title="Menú semanal"
      icon={CalendarDays}
      phase={4}
      description="Planifica las cenas de lunes a viernes y las comidas y cenas del fin de semana."
    />
  );
}
