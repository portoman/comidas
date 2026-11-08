"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { favoritesStore } from "@/lib/favorites-store";

export { favoritesStore };

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
