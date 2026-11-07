import Link from "next/link";
import { ChefHat } from "lucide-react";
import { Suspense, type ReactNode } from "react";
import { BottomNav, TopNav } from "./Navigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-brand-900/10 bg-cream/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-brand-700">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-cream">
              <ChefHat className="h-5 w-5" aria-hidden />
            </span>
            <span className="font-serif text-xl font-semibold tracking-tight">Recetario Familiar</span>
          </Link>
          <Suspense fallback={null}>
            <TopNav />
          </Suspense>
        </div>
      </header>
      <main className="pb-nav mx-auto w-full max-w-6xl flex-1 px-4 pt-4">{children}</main>
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
