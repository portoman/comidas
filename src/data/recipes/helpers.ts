import type { RecipeIngredient, Unit } from "../types";

/** Atajo para declarar ingredientes de forma compacta. */
export function ing(
  id: string,
  quantity: number | undefined,
  unit: Unit,
  note?: string,
  optional?: boolean,
): RecipeIngredient {
  return { id, quantity, unit, note, optional };
}

/** Avisos comunes para la ración del bebé (orientativos). */
export const BABY = {
  noSalt:
    "Separa su ración ANTES de añadir sal. No uses pastillas ni caldos comerciales: tienen mucha sal.",
  temp: "Comprueba la temperatura en tu muñeca o labio antes de ofrecerla; remueve bien si la has calentado en el microondas para evitar puntos muy calientes.",
  pediatra:
    "Orientación general: sigue siempre las indicaciones de vuestro pediatra.",
  bones:
    "Retira piel, cartílagos y huesos y revisa con los dedos que no queda ningún fragmento.",
  spines:
    "Desmenuza el pescado con los dedos, nunca solo con tenedor: así notas y retiras cualquier espina.",
  legumes:
    "Aplasta cada legumbre con el tenedor (o tritura un momento): enteras pueden atragantar.",
  peas: "Aplasta los guisantes uno a uno: enteros son pequeños, redondos y pueden atragantar.",
  eggs: "El huevo debe quedar completamente cuajado, sin partes líquidas.",
  meatDone:
    "La carne debe quedar hecha por completo, sin zonas rosadas y con jugos transparentes (75 °C en el centro si tienes termómetro).",
  fridge:
    "Su ración sobrante no se reaprovecha si ya ha estado en contacto con su cuchara o sus manos.",
};

/** Consejos de conservación comunes. */
export const STORAGE = {
  cool: "Deja templar como máximo 2 horas a temperatura ambiente y guarda en la nevera en recipiente hermético.",
  fridge2: "En la nevera (≤ 4 °C) se conserva 2 días.",
  fridge3: "En la nevera (≤ 4 °C) se conserva hasta 3 días.",
  fishFridge: "El pescado cocinado se conserva como máximo 1-2 días en la nevera.",
  reheat: "Recalienta una sola vez y hasta que humee en el centro (más de 70 °C).",
  rice: "El arroz cocinado debe enfriarse rápido (menos de 1 hora) y consumirse en 24 horas; no lo dejes a temperatura ambiente.",
  thaw: "Descongela en la nevera la noche anterior, nunca a temperatura ambiente.",
  portions: "Congela en raciones individuales (incluida una pequeña para el bebé) y etiqueta con la fecha.",
};

/** Texto común de seguridad para olla rápida. */
export const PRESSURE_SAFETY =
  "No llenes la olla por encima de 2/3 de su capacidad (1/2 con legumbres, que hacen espuma). No abras nunca la olla hasta que la válvula haya bajado por completo; si haces liberación rápida, gira la válvula con un trapo y aparta cara y manos del chorro de vapor. Sigue las instrucciones del fabricante de tu modelo.";
