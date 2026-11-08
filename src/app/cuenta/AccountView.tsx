"use client";

import { Cloud, CloudOff, KeyRound, LogOut, Plus, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth, useSyncStatus } from "@/hooks/useAuth";
import { useRecipeRows } from "@/hooks/useRecipes";
import { changePassword, signOut } from "@/lib/cloud/auth";
import { hiddenRecipes, restoreRecipe } from "@/lib/recipes-store";

const STATUS_TEXT = {
  idle: "Conectando…",
  syncing: "Sincronizando…",
  synced: "Todo sincronizado",
  pending: "Sin conexión: los cambios se subirán al recuperarla",
  offline: "Sin conexión: estás viendo lo último guardado",
  error: "No se ha podido sincronizar. Se reintentará.",
} as const;

export function AccountView() {
  const auth = useAuth();
  const status = useSyncStatus();
  const rows = useRecipeRows();
  const hidden = hiddenRecipes(rows);
  const [error, setError] = useState<string | null>(null);

  async function restore(id: string) {
    setError(null);
    try {
      await restoreRecipe(id);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      {auth.status === "signed-in" ? (
        <section className="space-y-3 rounded-3xl bg-white p-5 ring-1 ring-brand-900/5">
          <p className="text-sm text-stone-500">Has entrado como</p>
          <p className="font-semibold">{auth.family.email}</p>
          <p className="text-sm text-stone-600">
            Familia: <strong>{auth.family.householdName}</strong>. Las recetas, los favoritos, el menú y la lista de la
            compra se comparten con todos los miembros.
          </p>
          <p className="flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-2 text-sm text-brand-800" data-testid="sync-status">
            {status === "synced" ? <Cloud className="h-4 w-4" aria-hidden /> : <CloudOff className="h-4 w-4" aria-hidden />}
            {auth.offline ? STATUS_TEXT.offline : STATUS_TEXT[status]}
          </p>
          <PasswordForm />
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Cerrar sesión
          </button>
        </section>
      ) : (
        <section className="rounded-3xl bg-white p-5 text-sm text-stone-600 ring-1 ring-brand-900/5">
          Modo local: los datos se guardan solo en este navegador. Para compartirlos entre móviles hay que configurar
          Supabase (ver README).
        </section>
      )}

      <Link href="/receta/nueva" className="flex items-center justify-center gap-2 rounded-full bg-brand-700 px-5 py-3 font-medium text-cream">
        <Plus className="h-5 w-5" aria-hidden /> Nueva receta
      </Link>

      {hidden.length > 0 && (
        <section className="space-y-2 rounded-3xl bg-white p-5 ring-1 ring-brand-900/5">
          <h2 className="font-serif text-xl font-semibold text-brand-800">Recetas ocultas</h2>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <ul className="divide-y divide-stone-100">
            {hidden.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                <span>{r.name}</span>
                <button type="button" onClick={() => void restore(r.id)} className="flex items-center gap-1 text-sm font-medium text-brand-700">
                  <RotateCcw className="h-4 w-4" aria-hidden /> Recuperar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function PasswordForm() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const error = await changePassword(password);
    setMessage(error ?? "Contraseña cambiada.");
    if (!error) setPassword("");
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 text-sm font-medium text-brand-700">
        <KeyRound className="h-4 w-4" aria-hidden /> Cambiar contraseña
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Contraseña nueva</span>
        <input
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-stone-200 bg-cream px-4 py-2.5 text-base outline-none focus:border-brand-500"
        />
      </label>
      <button type="submit" className="rounded-full bg-brand-700 px-4 py-2 text-sm font-medium text-cream">
        Guardar contraseña
      </button>
      {message && <p className="text-sm text-stone-600">{message}</p>}
    </form>
  );
}
