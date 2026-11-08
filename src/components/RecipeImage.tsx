import Image from "next/image";
import { CATEGORY_BY_ID } from "@/data/categories";
import type { Recipe } from "@/data/types";

interface Props {
  recipe: Pick<Recipe, "name" | "category" | "image">;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Muestra la autoría y licencia sobre la foto (en la ficha). */
  showCredit?: boolean;
}

/**
 * Fotografía de la receta. Si la foto aún no está disponible se muestra un
 * marcador elegante (degradado + emoji de la categoría) identificado como
 * «Foto pendiente».
 */
export function RecipeImage({ recipe, sizes, priority, className = "", showCredit }: Props) {
  if (recipe.image) {
    // Las fotos subidas por la familia (Supabase o, en modo local, data:) ya
    // vienen reducidas: se muestran tal cual.
    const uploaded = /^(https?:|data:|blob:)/.test(recipe.image.src);
    return (
      <div className={`relative overflow-hidden bg-cream-dark ${className}`}>
        {uploaded ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.image.src}
            alt={recipe.image.alt}
            crossOrigin={recipe.image.src.startsWith("http") ? "anonymous" : undefined}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
        <Image
          src={recipe.image.src}
          alt={recipe.image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
        )}
        {showCredit && recipe.image.sourceUrl && (
          <a
            href={recipe.image.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 right-2 max-w-[80%] truncate rounded-full bg-black/45 px-2 py-0.5 text-[10px] text-white/90 backdrop-blur-sm"
          >
            Foto: {recipe.image.author} · {recipe.image.license}
          </a>
        )}
      </div>
    );
  }
  const category = CATEGORY_BY_ID[recipe.category];
  return (
    <div
      role="img"
      aria-label={`${recipe.name} (fotografía pendiente)`}
      data-image-pending="true"
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${category.gradient} ${className}`}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/40" aria-hidden />
      <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/30" aria-hidden />
      <span className="relative text-6xl drop-shadow-sm" aria-hidden>
        {category.emoji}
      </span>
      <span className="absolute bottom-2 left-2 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-600">
        Foto pendiente
      </span>
    </div>
  );
}
