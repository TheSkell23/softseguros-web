# Softseguros — sitio en Astro (migración, Fase 1)

Requisitos: Node >= 22.23.4 (Astro 7). Instalación: `npm install`. **No instalar dentro de Google Drive** (la instalación se corrompe): trabajar en una carpeta local y copiar solo el código fuente.

## Comandos

| Comando                         | Qué hace                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `npm run dev`                   | Servidor de desarrollo                                                               |
| `npm run build`                 | `astro check` y `astro build` (salida estática en `dist/`)                           |
| `npm run verify`                | `astro check`, ESLint, Prettier y build                                              |
| `npm run check:seo`             | Canonical, hreflang y sitemap coherentes en `dist/`                                  |
| `npm run test:visual:baseline`  | Captura el sitio actual (`SITE_DIR=ruta a site/`) en `tests/visual/baseline/current` |
| `npm run test:visual:candidate` | Captura `dist/` en `tests/visual/out/candidate`                                      |
| `npm run test:visual:compare`   | Compara píxeles (umbral 0,1 por píxel, 0,1 % máximo) y texto exacto                  |
| `npm run test:legal`            | Huellas de los 14 documentos legales (tolerancia cero)                               |

## Decisiones (ver MIGRACION.md)

- TypeScript fijado en 6.0.3 (la 7.0.2 no es compatible con `@astrojs/check` ni `typescript-eslint`).
- Tailwind v4 **sin Preflight** (solo tema y utilidades); tokens en `src/styles/global.css`.
- Rutas en `src/i18n/routes.ts` (slugs provisionales); `/es/` y `/en/` con `hreflang` y sitemap.
- Los textos legales no se modifican: viven en `src/content/legal/` (Fase 4).
