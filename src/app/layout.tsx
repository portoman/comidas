import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Recetario Familiar",
    template: "%s · Recetario Familiar",
  },
  description:
    "Recetas caseras para dos adultos y un bebé, menú semanal y lista de la compra automática.",
  applicationName: "Recetario Familiar",
  appleWebApp: {
    capable: true,
    title: "Recetario",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#1d4f35",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
