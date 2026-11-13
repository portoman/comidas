import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/*
 * Conexión con Supabase (base de datos, login y fotos). Las variables
 * NEXT_PUBLIC_* se incrustan al compilar: tras cambiarlas en Vercel hay que
 * volver a desplegar. Sin ellas la app funciona en modo local (todo se
 * guarda solo en este navegador), que es lo que usan las pruebas.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const cloudConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!cloudConfigured || typeof window === "undefined") return null;
  client ??= createClient(url!, key!, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "recetario-sesion" },
  });
  return client;
}
