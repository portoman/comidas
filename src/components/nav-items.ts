import { BookOpen, CalendarDays, Heart, ShoppingCart, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Rutas que también activan la pestaña. */
  match: (pathname: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Recetas", icon: BookOpen, match: (p) => p === "/" || p.startsWith("/recetas") },
  { href: "/menu", label: "Menú semanal", icon: CalendarDays, match: (p) => p.startsWith("/menu") },
  { href: "/compra", label: "Compra", icon: ShoppingCart, match: (p) => p.startsWith("/compra") },
  { href: "/favoritos", label: "Favoritos", icon: Heart, match: (p) => p.startsWith("/favoritos") },
];
