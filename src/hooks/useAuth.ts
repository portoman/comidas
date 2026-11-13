"use client";

import { useSyncExternalStore } from "react";
import { authStore } from "@/lib/cloud/auth";
import { syncStatusStore } from "@/lib/cloud/sync";

export function useAuth() {
  return useSyncExternalStore(authStore.subscribe, authStore.get, authStore.getServer);
}

export function useSyncStatus() {
  return useSyncExternalStore(syncStatusStore.subscribe, syncStatusStore.get, syncStatusStore.getServer);
}
