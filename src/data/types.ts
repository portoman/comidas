/**
 * Modelo de datos del recetario.
 *
 * Las recetas son datos puros (sin JSX) para poder reutilizarlos en la
 * interfaz, en la lista de la compra y en las pruebas.
 */

/** Secciones del supermercado, en el orden en que se recorren. */
export type Aisle =
  | "fruta-verdura"
  | "carne"
  | "pescado"
  | "huevos-lacteos"
  | "despensa"
  | "conservas"
  | "congelados"
  | "especias-aceites";

/**
 * Unidades admitidas.
 * - g / kg y ml / l son convertibles entre sí (se normalizan a g y ml).
 * - "ud" (unidad), "diente", "hoja", "ramita"... no se convierten.
 * - "cda" (cucharada ≈ 15 ml) y "cdta" (cucharadita ≈ 5 ml) se tratan
 *   como medidas de cocina; no se suman con gramos.
 * - "al-gusto" no lleva cantidad y no se suma.
 */
export type Unit =
  | "g"
  | "kg"
  | "ml"
  | "l"
  | "ud"
  | "diente"
  | "hoja"
  | "ramita"
  | "cda"
  | "cdta"
  | "pizca"
  | "al-gusto";

export interface IngredientDef {
  /** Identificador normalizado (kebab-case, singular). */
  id: string;
  /** Nombre en singular, p. ej. «Patata». */
  name: string;
  /** Nombre en plural para listas, p. ej. «Patatas». */
  plural?: string;
  aisle: Aisle;
  /** Sinónimos para la búsqueda (p. ej. «papa»). */
  synonyms?: string[];
}

export interface RecipeIngredient {
  /** Debe existir en el catálogo de ingredientes. */
  id: string;
  quantity?: number;
  unit: Unit;
  /** Indicación de preparación o equivalencia: «en dados de 2 cm». */
  note?: string;
  /** Ingrediente opcional (no se añade por defecto a la compra). */
  optional?: boolean;
}

export type Appliance = "vitro" | "horno" | "olla-rapida" | "microondas";

export interface RecipeStep {
  text: string;
  /** Minutos orientativos del paso, si aplica. */
  minutes?: number;
  appliance?: Appliance;
}

/**
 * Datos de la olla rápida cuando la receta se cocina con ella. Los pasos
 * principales de la receta ya están escritos para la olla (appliance
 * "olla-rapida") y los tiempos de la receta lo tienen en cuenta.
 */
export interface PressureCookerInfo {
  /** Minutos desde que la olla alcanza la presión. */
  minutesAtPressure: number;
  /** Nivel de presión recomendado. */
  pressure: "alta" | "baja";
  release: "natural" | "rápida" | "mixta";
}

export type CategoryId =
  | "aves"
  | "carne"
  | "pescado"
  | "legumbres"
  | "huevos"
  | "arroz-pasta"
  | "cremas-verduras";

export interface BabyAdaptation {
  /** Textura recomendada para un bebé de ~9 meses. */
  texture: string;
  /** Cómo preparar su ración. */
  howTo: string[];
  /** Precauciones específicas (espinas, huesos, cocción...). */
  warnings: string[];
}

export interface RecipeImage {
  src: string;
  alt: string;
  /** Autoría y licencia, obligatoria si la imagen no es propia. */
  credit?: string;
  license?: string;
}

export interface Recipe {
  id: string;
  /** Número correlativo del catálogo original (1-25). */
  number: number;
  name: string;
  category: CategoryId;
  summary: string;
  /** null = fotografía pendiente: se muestra un marcador visual. */
  image: RecipeImage | null;
  /** Minutos de preparación (cortar, pelar…). */
  prepMinutes: number;
  /** Minutos de cocción, incluidos subir y bajar la presión de la olla. */
  cookMinutes: number;
  /** Raciones base: 2 adultos + 1 ración de bebé = 3. */
  servings: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  pressureCooker?: PressureCookerInfo;
  /** Cómo hacerla sin olla rápida (u otra variante), en pocas frases. */
  alternative?: string;
  baby: BabyAdaptation;
  freezable: boolean;
  freezingNotes: string;
  storage: string[];
  tags?: string[];
}

export const BASE_SERVINGS = 3;
