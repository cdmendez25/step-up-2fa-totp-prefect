# ⚠️ Galería de diseño (temporal)

Esta carpeta **no es parte de la app**. Muestra cada pantalla con **datos falsos** (`mocks.ts`) para revisar el diseño antes de que exista la lógica. Se reconoce por la barra flotante con franjas amarillas que dice *"Galería de diseño · datos falsos"*.

Uso: `npm run dev` y abre `http://localhost:5173/#verify/replay` (formato `#pantalla/estado`).

## Cuándo y cómo borrarla

En cuanto tengas **tu primer container conectado al backend** (por ejemplo, el login llamando a `POST /auth/login`), elimina la galería:

1. Borra la carpeta `src/design-preview/` completa.
2. En `src/App.tsx`, quita el import de `DesignPreview` y pon tus rutas.
3. Comprueba que en la app ya no aparece la barra amarilla.

Desde ese momento, todo lo que se vea en pantalla saldrá de tu lógica real.
