# Recetario Familiar

Aplicación web (Next.js + TypeScript + Tailwind) para organizar recetas caseras
para dos adultos y un bebé, planificar el menú semanal y generar la lista de la
compra. Pensada para usarse desde el iPhone; se puede instalar en la pantalla de
inicio y funciona sin conexión.

## Funcionalidades

- **25 recetas** de 25-45 minutos (la olla rápida es el método principal cuando
  acorta), con pasos detallados, adaptación para el bebé, congelación y
  conservación.
- **Buscador** por nombre o ingrediente y **filtros** por categoría.
- **Ficha** con selector de raciones, ingredientes que se recalculan y se pueden
  marcar mientras cocinas, y botones para añadir a la compra o al menú.
- **Lista de la compra automática**: suma ingredientes repetidos (g/kg, ml/l,
  cucharadas), no mezcla unidades incompatibles, agrupa por secciones del súper,
  permite marcar, eliminar y añadir productos y compartir por WhatsApp.
- **Menú semanal**: cenas de lunes a viernes y comidas y cenas el fin de semana;
  «cocinar doble» para usar una preparación dos días sin duplicar la compra;
  guardar, limpiar, nueva semana y recuperar menús anteriores.
- **Editar recetas y añadir nuevas**: nombre, tiempos, ingredientes (del
  catálogo o propios, con su sección del súper), pasos, olla rápida,
  adaptación para el bebé, conservación y foto hecha con el móvil. Las recetas
  incluidas se pueden ocultar o volver a su versión original.
- **Cuenta familiar (Supabase)**: login con email y contraseña; recetas,
  favoritos, menú y compra compartidos entre los móviles de la familia en tiempo
  real. Sin conexión se consulta lo último guardado y los cambios de menú,
  compra y favoritos se suben al volver la conexión.
- Sin Supabase configurado, la app funciona en **modo local** (todo en el
  navegador).
- **PWA**: manifest, iconos y service worker que guarda todas las recetas para
  usarlas sin conexión.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # ESLint + TypeScript + pruebas unitarias + build de producción
npm run test:e2e   # Pruebas de extremo a extremo con viewport de iPhone (Playwright)
```

Para las pruebas de extremo a extremo en tu ordenador, instala una vez el
navegador de Playwright: `npx playwright install chromium`.

## Base de datos y login (Supabase, gratis)

1. Crea una cuenta en [supabase.com](https://supabase.com) → **New project**
   (región: West EU / Frankfurt o Irlanda). Guarda la contraseña de la base de datos.
2. **SQL Editor → New query**: pega el contenido de
   [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**.
3. **Authentication → Sign In / Providers → Email**: deja activado Email y
   desactiva **Allow new users to sign up** (solo entra quien invitéis) y
   **Confirm email**.
4. **Authentication → Users → Add user → Create new user**: crea una cuenta por
   persona (email + contraseña, marca *Auto Confirm User*). Todas entran en la
   misma familia.
5. **Project Settings → API Keys** (o botón **Connect**): copia la *Project
   URL* y la *Publishable key*.
6. En Vercel → **Settings → Environment Variables** añade
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y vuelve a
   desplegar (**Deployments → ⋯ → Redeploy**). Para desarrollo, cópialas en
   `.env.local` (ver `.env.example`).

> El plan gratuito de Supabase pausa el proyecto tras 7 días sin uso; se
> reactiva desde su panel sin perder datos.

## Despliegue en Vercel

1. En vercel.com → **Add New → Project**, elige este repositorio
   (Framework Preset: **Next.js**).
2. Añade las variables de Supabase del apartado anterior.
3. Abre la URL en Safari del iPhone → **Compartir → Añadir a pantalla de inicio**.

## Estructura

```
src/
  app/               Rutas: /, /receta?id=…, /receta/editar, /receta/nueva,
                     /menu, /compra, /favoritos, /cuenta, /creditos
  components/        Componentes visuales reutilizables
  data/
    types.ts         Modelo de datos (Recipe, RecipeIngredient, Unit…)
    ingredients.ts   Catálogo de ingredientes con IDs normalizados y sección del súper
    categories.ts    Categorías de recetas
    photos.ts        Fotos (Wikimedia Commons) con autoría y licencia
    recipes/         Recetas por categoría (datos puros, sin JSX)
  hooks/             Estado en el cliente sobre localStorage (sin errores de hidratación)
  lib/               Lógica: búsqueda, escalado, lista de la compra, menú,
                     recetas de la familia (recipes-store) y nube (cloud/)
supabase/
  schema.sql         Tablas, seguridad (RLS), tiempo real y almacén de fotos
public/
  images/recipes/    Fotografías de los platos
  icons/             Iconos de la app
  sw.js              Service worker (funcionamiento sin conexión)
tests/
  unit/              Vitest + Testing Library
  e2e/               Playwright (iPhone)
```

## Añadir una receta al código

Desde la app se pueden añadir recetas con **Nueva receta**. Para incluir una
receta de serie en el código:

1. Añade los ingredientes nuevos a `src/data/ingredients.ts` (ID en kebab-case,
   singular, con su sección del súper).
2. Añade la receta al archivo de su categoría en `src/data/recipes/`.
3. Ejecuta `npm test`: las pruebas validan que los ingredientes existen, que la
   receta tiene todos los campos (incluida la adaptación para el bebé) y que no
   pasa de una hora.

> La adaptación de las recetas para el bebé es orientativa y no sustituye las
> recomendaciones del pediatra.
