"use client";

import { useSyncExternalStore } from "react";
import { menuStore } from "@/lib/menu-store";
import { shoppingStore } from "@/lib/shopping-store";

export function useShopping() {
  const state = useSyncExternalStore(shoppingStore.subscribe, shoppingStore.get, shoppingStore.getServer);
  return [state, shoppingStore.set] as const;
}

export function useMenu() {
  const state = useSyncExternalStore(menuStore.subscribe, menuStore.get, menuStore.getServer);
  return [state, menuStore.set] as const;
}
