import type { Session } from "@supabase/supabase-js";
import { cloudConfigured, getSupabase } from "./client";

export interface Family {
  userId: string;
  email: string;
  householdId: string | null;
  householdName: string;
}

export type AuthState =
  | { status: "local" }
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; family: Family; offline?: boolean };

const FAMILY_KEY = "recetario:familia:v1";

const SERVER_STATE: AuthState = cloudConfigured ? { status: "loading" } : { status: "local" };
let state: AuthState = SERVER_STATE;
const listeners = new Set<() => void>();

function emit(next: AuthState) {
  state = next;
  listeners.forEach((l) => l());
}

export const authStore = {
  get: () => state,
  getServer: () => SERVER_STATE,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

function cachedFamily(): Family | null {
  try {
    const raw = window.localStorage.getItem(FAMILY_KEY);
    return raw ? (JSON.parse(raw) as Family) : null;
  } catch {
    return null;
  }
}

async function loadFamily(session: Session): Promise<Family> {
  const sb = getSupabase()!;
  const cached = cachedFamily();
  const base: Family = {
    userId: session.user.id,
    email: session.user.email ?? "",
    householdId: cached?.userId === session.user.id ? cached.householdId : null,
    householdName: cached?.userId === session.user.id ? cached.householdName : "Familia",
  };
  const { data, error } = await sb
    .from("household_members")
    .select("household_id, households(name)")
    .eq("user_id", session.user.id)
    .limit(1)
    .maybeSingle();
  if (error) return base; // sin conexión: se usa lo último conocido
  const households = data?.households as { name?: string } | { name?: string }[] | null | undefined;
  const name = Array.isArray(households) ? households[0]?.name : households?.name;
  const family: Family = { ...base, householdId: data?.household_id ?? null, householdName: name ?? "Familia" };
  try {
    window.localStorage.setItem(FAMILY_KEY, JSON.stringify(family));
  } catch {
    /* ignorar */
  }
  return family;
}

let started = false;

/** Arranca el login (una vez). Lee la sesión guardada en el dispositivo. */
export function initAuth() {
  const sb = getSupabase();
  if (!sb || started) return;
  started = true;
  let currentUser: string | null = null;

  async function apply(session: Session | null) {
    if (!session) {
      currentUser = null;
      const cached = cachedFamily();
      // Sin conexión y con una sesión anterior: se deja consultar lo guardado.
      if (cached && !navigator.onLine) emit({ status: "signed-in", family: cached, offline: true });
      else emit({ status: "signed-out" });
      return;
    }
    if (currentUser === session.user.id && state.status === "signed-in") return;
    currentUser = session.user.id;
    emit({ status: "signed-in", family: await loadFamily(session) });
  }

  sb.auth.onAuthStateChange((event, session) => {
    // Las llamadas a Supabase dentro de este callback deben ir fuera del ciclo actual.
    window.setTimeout(() => void apply(session), 0);
  });
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return "La conexión con la base de datos no está configurada.";
  const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (!error) return null;
  if (/invalid login credentials/i.test(error.message)) return "Email o contraseña incorrectos.";
  if (/email not confirmed/i.test(error.message)) return "Falta confirmar el email de esta cuenta.";
  if (/fetch|network/i.test(error.message)) return "No hay conexión. Inténtalo de nuevo.";
  return error.message;
}

export async function changePassword(password: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return "La conexión con la base de datos no está configurada.";
  const { error } = await sb.auth.updateUser({ password });
  if (!error) return null;
  if (/should be different/i.test(error.message)) return "La contraseña nueva debe ser distinta de la actual.";
  if (/at least/i.test(error.message)) return "La contraseña es demasiado corta (mínimo 6 caracteres).";
  return error.message;
}

/** Cierra la sesión y borra la copia local de los datos de la familia. */
export async function signOut() {
  const sb = getSupabase();
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("recetario:")) window.localStorage.removeItem(key);
    }
  } catch {
    /* ignorar */
  }
  await sb?.auth.signOut({ scope: "local" });
  window.location.replace(new URL("/", window.location.origin).href);
}
