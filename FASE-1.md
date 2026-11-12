# Fase 1 — Base del proyecto (informe)

Todo "probado en local" el 2 de noviembre de 2026. `site/` no se modificó; antes de escribir se creó `site-respaldo/` (75 archivos, idéntico a `site/`).

## Criterio de aprobación (MIGRACION.md, sección 8)

| Criterio                | Resultado                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------- |
| `astro check`           | 0 errores, 0 avisos, 0 sugerencias (20 archivos)                                        |
| ESLint                  | sin errores (se ejecutó en Node 24.15.0; ver "No verificado")                           |
| Prettier                | todos los archivos conformes                                                            |
| `astro build`           | 26 páginas (12 × 2 idiomas, raíz y 404)                                                 |
| Línea base reproducible | 138 capturas del sitio actual, 0 fallos; 40 repeticiones: 36 idénticas, máximo 0,0127 % |

`npm run verify` encadena `astro check`, ESLint, Prettier y el build.

## Qué se creó

- **Proyecto:** Astro 7.4.5, TypeScript 6.0.3 (`astro/tsconfigs/strict`), Tailwind 4.3.4 sin Preflight, `@astrojs/sitemap` 3.7.4, ESLint 10.14.0 + `eslint-plugin-astro` 3.2.1 + `typescript-eslint` 8.72.1, Prettier 3.9.10 con `prettier-plugin-astro` y `prettier-plugin-tailwindcss` (el último, como exige su README). Versiones fijadas (`--save-exact`).
- **Estilos:** `src/styles/global.css` (tokens `@theme` extraídos del CSS actual, base mínima en `@layer base`), `keyframes.css` (27 `@keyframes` extraídos por script; sin conflictos entre páginas) y `fonts.css` (Fontsource, licencia OFL-1.1 según el registro de npm).
- **Rutas e i18n:** `src/i18n/routes.ts` (tabla tipada con slugs provisionales, `pathFor`, `alternates`), `static-paths.ts` y páginas `src/pages/es|en/[...slug].astro` de andamiaje (solo título).
- **SEO:** `SeoHead.astro` (title, description, robots, canonical absoluto, `hreflang` con `x-default`, Open Graph, Twitter, JSON-LD), `BaseLayout.astro`, `PageLayout.astro` y `src/data/seo.ts` (metadatos en español extraídos de las 12 páginas por `scripts-migracion/extract-seo.mjs`).
- **Calidad y verificación:** `scripts-migracion/check-seo.mjs` (canonical y `hreflang` contra el sitemap, autorreferencia, reciprocidad y `x-default`: 24 de 24 páginas, 0 problemas).
- **Pruebas visuales (`tests/visual/`):** `matrix.ts` (138 combinaciones), `capture.ts` (sitio actual o `dist/`), `compare.ts` (pixelmatch + texto exacto + informe), `legal.ts` (huellas de los 14 documentos legales), `serve.ts`.

## Mediciones

- **Puntos de corte de Tailwind:** `max-tablet` genera `@media not all and (width>=641px)` (es decir, hasta 640 px) y `tablet:max-desktop` genera el rango 641–1000 px. Verificado en el CSS compilado.
- **Sin Preflight:** el CSS compilado no contiene reglas de Preflight (0 coincidencias).
- **Línea base visual:** 138 capturas (72 páginas completas, 54 del hero en día, atardecer y noche, 12 extras). 42 contienen errores de consola ya existentes: 36 por recursos que no existen (los logos `ag-*.webp` de Inicio, las imágenes de 404/Offline y las de Producto v1) y 30 por `<path d="{{ ... }}">`.
- **Ruido:** 40 capturas repetidas del mismo sitio; 36 idénticas (0 píxeles) y el máximo fue 0,0127 % (`faq`, 1440 px, 707 píxeles). Umbral propuesto: 0,1 por píxel y 0,1 % por captura (unas 8 veces el ruido máximo medido). Texto: idéntico en las 40.
- **Legal:** 14 documentos, 20.659 palabras. Las huellas de `legal.ts` coinciden bloque por bloque con las de `tools/cmp.py` (forzando UTF-8: en Windows `cmp.py` falla por la codificación por defecto de Python).
- **Dependencias:** `npm audit` sin vulnerabilidades en producción; 12 moderadas en herramientas de desarrollo (cadena de ESLint, `minimatch`).
- **Lighthouse antes y después:** no aplica todavía (aún no hay páginas reales). La línea base está en MIGRACION.md, sección 1.

## Hallazgos

1. **Texto dentro de imágenes:** en inglés, "Bienvenido a Softseguros", "Ingresa" y "Agenda una demo" del hero siguen en español porque son texto incluido en las imágenes de botón (`btn-welcome`, `btn-login`, `btn-demo`). Mi auditoría anterior no lo detectó. Se migra igual; para traducirlos hay que regenerar esas imágenes o pasarlas a texto real (decisión tuya).
2. **Redirección de la raíz:** Astro genera `/` como página con meta-refresh de 2 s hacia `/es/`. Conviene una redirección 301 en el hosting (`_redirects`); se trata en la Fase 4.
3. **JSON-LD:** hereda las URLs actuales (por ejemplo `https://www.softseguros.com/producto`), que no coinciden con las nuevas (`/es/producto/`). Se corrige con los metadatos por idioma de la Fase 4.
4. **Fuentes:** el build copia todas las variantes de Fontsource (cirílico, griego, vietnamita…, en WOFF y WOFF2). Los navegadores solo descargan las necesarias por `unicode-range`, pero la carpeta pesa más de lo debido; se recorta en la Fase 5.
5. **Barra final:** salida en carpetas (`producto/index.html`), así que las URLs canónicas y las del sitemap llevan barra final (`trailingSlash: 'always'`).

## No verificado

- ESLint corrió en Node 24.15.0, por debajo del mínimo documentado de `eslint-plugin-astro` (24.16.0 o superior, o 22.22.3 o superior). Funcionó sin errores, pero es una configuración no soportada por la documentación; conviene actualizar Node (pregunta 11).
- Que las fuentes de Fontsource se vean idénticas a las que sirve Google Fonts: ambos lados de la comparación usan los mismos archivos locales, así que la diferencia con producción actual no está medida.
- Comportamiento de `compressHTML: true` frente al valor por defecto `'jsx'` de Astro 7: se compara en la Fase 2 con páginas reales.
- Estado estable o experimental de la API de fuentes de Astro (no se usa; se eligió Fontsource).

## Supuestos que tomé (confirmar)

Tras tu "puedes seguir trabajando" apliqué mis recomendaciones: Fase 1; TypeScript 6.0.3; npm; fuentes propias; umbral 0,1 %; construcción fuera de Google Drive en `C:\Users\LENOVO\dev\site-astro` y copia del código (sin `node_modules`, `dist` ni capturas) a `site-astro\` del proyecto.
