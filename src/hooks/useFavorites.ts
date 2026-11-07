"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { createLocalStore } from "@/lib/storage";

const EMPTY: string[] = [];

export const favoritesStore = createLocalStore<string[]>(
  "recetario:favoritos:v1",
  EMPTY,
  (raw) => (Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : null),
);

export function useFavorites() {
  const ids = useSyncExternalStore(
    favoritesStore.subscribe,
    favoritesStore.get,
    favoritesStore.getServer,
  );
  const set = useMemo(() => new Set(ids), [ids]);

  const toggle = useCallback((id: string) => {
    favoritesStore.set((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const isFavorite = useCallback((id: string) => set.has(id), [set]);

  return { ids: set, isFavorite, toggle };
}
