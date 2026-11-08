import { createLocalStore } from "./storage";

const EMPTY: string[] = [];

export const favoritesStore = createLocalStore<string[]>(
  "recetario:favoritos:v1",
  EMPTY,
  (raw) => (Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : null),
);
