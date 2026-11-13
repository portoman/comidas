"use client";

import { ChefHat, LoaderCircle } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { initAuth } from "@/lib/cloud/auth";
import { getSupabase } from "@/lib/cloud/client";
import { startSync } from "@/lib/cloud/sync";
import { LoginScreen } from "./LoginScreen";

/**
 * Con la base de datos configurada, la app solo se muestra tras iniciar
 * sesión. Sin configurar (desarrollo, pruebas) funciona en modo local.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();

  useEffect(() => {
    initAuth();
  }, []);

  const householdId = auth.status === "signed-in" ? auth.family.householdId : null;
  const offline = auth.status === "signed-in" && auth.offline;
  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !householdId || offline) return;
    return startSync(sb, householdId);
  }, [householdId, offline]);

  if (auth.status === "local") return children;
  if (auth.status === "loading") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 text-brand-700" aria-busy="true">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 text-cream">
          <ChefHat className="h-8 w-8" aria-hidden />
        </span>
        <LoaderCircle className="h-6 w-6 animate-spin" aria-label="Cargando" />
      </div>
    );
  }
  if (auth.status === "signed-out") return <LoginScreen />;
  if (!auth.family.householdId) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-3 p-6 text-center">
        <h1 className="font-serif text-2xl font-semibold text-brand-800">Cuenta sin familia</h1>
        <p className="text-stone-600">
          La cuenta {auth.family.email} no pertenece a ninguna familia. Ejecuta de nuevo el script
          <code className="mx-1 rounded bg-cream-dark px-1">supabase/schema.sql</code> en Supabase y vuelve a entrar.
        </p>
        <button type="button" onClick={() => window.location.reload()} className="rounded-full bg-brand-700 px-5 py-3 font-medium text-cream">
          Reintentar
        </button>
      </div>
    );
  }
  return children;
}
