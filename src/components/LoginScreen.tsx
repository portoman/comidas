"use client";

import { ChefHat, LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { signIn } from "@/lib/cloud/auth";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const message = await signIn(email, password);
    setBusy(false);
    if (message) setError(message);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-brand-900/5">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 text-cream">
            <ChefHat className="h-8 w-8" aria-hidden />
          </span>
          <h1 className="font-serif text-2xl font-semibold text-brand-800">Recetario Familiar</h1>
          <p className="text-sm text-stone-600">Entra con la cuenta de la familia.</p>
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-cream px-4 py-3 text-base outline-none focus:border-brand-500"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Contraseña</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-cream px-4 py-3 text-base outline-none focus:border-brand-500"
          />
        </label>
        {error && (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-700 px-5 py-3 font-medium text-cream disabled:opacity-60"
        >
          {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />} Entrar
        </button>
        <p className="text-center text-xs text-stone-500">
          ¿Sin cuenta? Pídesela a quien administra el recetario.
        </p>
      </form>
    </main>
  );
}
