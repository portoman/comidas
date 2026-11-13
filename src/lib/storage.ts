/**
 * Pequeño almacén reactivo sobre localStorage, pensado para
 * `useSyncExternalStore`: en el servidor (y durante la hidratación) se usa
 * siempre el valor inicial, y en el cliente se lee el valor guardado. Así no
 * hay diferencias entre el HTML del servidor y el primer render del cliente.
 */
export interface LocalStore<T> {
  get(): T;
  getServer(): T;
  set(value: T | ((prev: T) => T)): void;
  subscribe(listener: () => void): () => void;
  /** Sustituye el valor con uno llegado de la nube (no avisa a la sincronización). */
  setRemote(value: T): void;
  /** Escucha los cambios hechos en este dispositivo (para subirlos a la nube). */
  onLocalChange(listener: (value: T) => void): () => void;
  /** Valida un valor recibido de fuera (nube, importación). */
  validate(raw: unknown): T | null;
}

export function createLocalStore<T>(
  key: string,
  initial: T,
  validate: (raw: unknown) => T | null = (raw) => raw as T,
): LocalStore<T> {
  let cache: T | undefined;
  const listeners = new Set<() => void>();
  const localListeners = new Set<(value: T) => void>();

  function read(): T {
    if (cache !== undefined) return cache;
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw === null ? null : validate(JSON.parse(raw));
      cache = parsed ?? initial;
    } catch {
      cache = initial;
    }
    return cache;
  }

  function emit() {
    listeners.forEach((l) => l());
  }

  function write(next: T) {
    cache = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Modo privado o almacenamiento lleno: se mantiene en memoria.
    }
    emit();
  }

  return {
    get: read,
    getServer: () => initial,
    validate,
    set(value) {
      const next = typeof value === "function" ? (value as (p: T) => T)(read()) : value;
      write(next);
      localListeners.forEach((l) => l(next));
    },
    setRemote(value) {
      write(value);
    },
    onLocalChange(listener) {
      localListeners.add(listener);
      return () => localListeners.delete(listener);
    },
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) {
          cache = undefined;
          listener();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}
