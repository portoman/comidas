import { RECIPES } from "@/data/recipes";

/** Páginas que el service worker guarda para usarlas sin conexión. */
export function GET() {
  const pages = ["/", "/menu", "/compra", "/favoritos", ...RECIPES.map((r) => `/recetas/${r.id}`)];
  const images = RECIPES.flatMap((r) => (r.image ? [r.image.src] : []));
  return Response.json({ pages, images });
}
