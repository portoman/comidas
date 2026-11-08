import type { RecipeImage } from "@/data/types";
import { getSupabase } from "./cloud/client";

/** Reduce una foto del móvil a JPEG de 1200 px como máximo (≈150-300 KB). */
export async function compressPhoto(file: File, maxSize = 1200, quality = 0.8): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se ha podido procesar la foto."))), "image/jpeg", quality),
  );
  return { blob, width, height };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Sube la foto de una receta. Con la nube, al almacén «fotos» de Supabase
 * (carpeta de la familia); en modo local, se guarda dentro de la receta.
 */
export async function uploadRecipePhoto(file: File, recipeName: string, householdId: string | null): Promise<RecipeImage> {
  const { blob, width, height } = await compressPhoto(file, householdId ? 1200 : 800, householdId ? 0.8 : 0.7);
  let src: string;
  const sb = getSupabase();
  if (sb && householdId) {
    const path = `${householdId}/${crypto.randomUUID()}.jpg`;
    const { error } = await sb.storage.from("fotos").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
    if (error) throw new Error(navigator.onLine ? `No se ha podido subir la foto: ${error.message}` : "Sin conexión: no se puede subir la foto.");
    src = sb.storage.from("fotos").getPublicUrl(path).data.publicUrl;
  } else {
    src = await blobToDataUrl(blob);
  }
  return { src, alt: recipeName, width, height, author: "Foto de la familia", license: "Propia", sourceUrl: "" };
}
