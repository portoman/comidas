import { RECIPES } from "@/data/recipes";

/** Páginas que el service worker guarda para usarlas sin conexión. */
export function GET() {
  // Las fichas y el editor son una sola página (/receta?id=…) que lee la
  // receta en el navegador: basta con guardarla una vez.
  const pages = ["/", "/menu", "/compra", "/favoritos", "/receta", "/receta/editar", "/receta/nueva", "/cuenta", "/creditos"];
  const images = RECIPES.flatMap((r) => (r.image ? [r.image.src] : []));
  return Response.json({ pages, images });
}
