"use client";

import { Cloud, CloudOff, LoaderCircle, UserRound } from "lucide-react";
import Link from "next/link";
import { useAuth, useSyncStatus } from "@/hooks/useAuth";

/** Acceso a la cuenta con el estado de la sincronización. */
export function AccountButton() {
  const auth = useAuth();
  const status = useSyncStatus();
  if (auth.status !== "signed-in") {
    return (
      <Link href="/cuenta" aria-label="Ajustes" className="flex h-9 w-9 items-center justify-center rounded-full text-brand-700 hover:bg-brand-50">
        <UserRound className="h-5 w-5" aria-hidden />
      </Link>
    );
  }
  const Icon =
    auth.offline || status === "offline" || status === "pending" || status === "error"
      ? CloudOff
      : status === "syncing"
        ? LoaderCircle
        : Cloud;
  const label =
    status === "pending" ? "Cambios pendientes de subir" : status === "error" ? "Error al sincronizar" : "Cuenta y sincronización";
  return (
    <Link href="/cuenta" aria-label={label} title={label} className="relative flex h-9 w-9 items-center justify-center rounded-full text-brand-700 hover:bg-brand-50">
      <Icon className={`h-5 w-5 ${status === "syncing" ? "animate-spin" : ""}`} aria-hidden />
      {(status === "pending" || status === "error") && (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500" aria-hidden />
      )}
    </Link>
  );
}
