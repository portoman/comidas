/* Service worker del Recetario Familiar.
 * - Al instalarse guarda todas las páginas (inicio, menú, compra, favoritos,
 *   la ficha /receta y el editor) y los archivos JS/CSS que usan.
 * - Las fotos subidas por la familia (Supabase Storage) se guardan al verlas.
 * - Navegación: primero red; sin conexión, la copia guardada.
 * - Archivos estáticos de Next (/_next/static) e imágenes: primero caché.
 */
const VERSION = "v3";
const PAGES = `recetario-paginas-${VERSION}`;
const ASSETS = `recetario-estaticos-${VERSION}`;

async function precache() {
  const res = await fetch("/offline-manifest.json", { cache: "no-store" });
  const { pages, images } = await res.json();
  const pageCache = await caches.open(PAGES);
  const assetCache = await caches.open(ASSETS);
  const assetUrls = new Set(["/manifest.webmanifest", "/icons/icon-192.png", "/icons/apple-touch-icon.png", ...images]);
  for (const url of pages) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) continue;
      const html = await r.clone().text();
      await pageCache.put(url, r);
      for (const m of html.matchAll(/\/_next\/static\/[^"'\s)]+/g)) assetUrls.add(m[0].replace(/\\u0026/g, "&"));
    } catch {
      /* se reintentará al navegar */
    }
  }
  await Promise.all(
    [...assetUrls].map(async (url) => {
      try {
        if (!(await assetCache.match(url))) await assetCache.add(url);
      } catch {
        /* ignorar */
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = [PAGES, ASSETS];
      for (const key of await caches.keys()) if (!keep.includes(key)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = (await cache.match(request, { ignoreSearch: true })) || (fallbackUrl && (await cache.match(fallbackUrl)));
    if (cached) return cached;
    throw new Error("Sin conexión");
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    // Sin conexión: para una imagen optimizada (/_next/image?url=…) sirve el
    // original guardado durante la instalación.
    const url = new URL(request.url);
    const original = url.pathname === "/_next/image" && url.searchParams.get("url");
    const fallback = original && (await cache.match(original));
    if (fallback) return fallback;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Fotos subidas por la familia: primero caché (cada foto tiene URL única).
  if (url.pathname.startsWith("/storage/v1/object/public/fotos/")) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/images/") || url.pathname.startsWith("/_next/image")) {
    event.respondWith(cacheFirst(request));
    return;
  }
  // Navegación completa: HTML. Las peticiones RSC de Next (navegación interna)
  // van siempre a la red; si fallan, Next recarga la página y se sirve el HTML guardado.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGES, "/"));
  }
});
