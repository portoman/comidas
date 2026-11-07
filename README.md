# Recetario Familiar

Aplicación web (Next.js + TypeScript + Tailwind) para organizar recetas caseras
para dos adultos y un bebé, planificar el menú semanal y generar la lista de la
compra. Pensada para usarse desde el iPhone.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # ESLint + TypeScript + pruebas + build de producción
```

## Estructura

```
src/
  app/               Rutas (App Router): /, /recetas/[id], /menu, /compra, /favoritos
  components/        Componentes visuales reutilizables
  data/
    types.ts         Modelo de datos (Recipe, RecipeIngredient, Unit…)
    ingredients.ts   Catálogo de ingredientes con IDs normalizados y sección del súper
    categories.ts    Categorías de recetas
    recipes/         Recetas por categoría (datos puros, sin JSX)
  hooks/             Estado en el cliente (favoritos, menú, compra) sobre localStorage
  lib/               Lógica pura: búsqueda, formato, almacenamiento
tests/unit/          Pruebas con Vitest + Testing Library
public/images/recipes/  Fotografías de los platos
```

## Añadir una receta

1. Añade los ingredientes nuevos a `src/data/ingredients.ts` (ID en kebab-case, singular).
2. Añade la receta al archivo de su categoría en `src/data/recipes/`.
3. Ejecuta `npm test`: las pruebas validan que los ingredientes existen y que la
   receta tiene todos los campos (incluida la adaptación para el bebé).

> La adaptación de las recetas para el bebé es orientativa y no sustituye las
> recomendaciones del pediatra.
