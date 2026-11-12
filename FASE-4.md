# Fase 4 — i18n y URLs (informe)

Probado en local el 3 de noviembre de 2026. No se ha desplegado nada. La Fase 5 no se inició.

## Qué hay

- Catálogo `es`/`en` tipado (`src/i18n/es.ts`, `en.ts`, `rules.ts`, `index.ts`), generado desde `site/i18n.js` con `scripts-migracion/gen-i18n.mjs`. Trabajo previo de Codex, revisado.
- Rutas `/es/` y `/en/` con slugs en `src/i18n/routes.ts`; `canonical`, `hreflang` (`es`, `en`, `x-default`) y `og:locale` por idioma.
- Metadatos en inglés: `src/data/seo-en.ts` (nuevo). Es una propuesta de traducción de 12 páginas x 4 textos y de los textos del JSON-LD, porque el sitio actual no publica metadatos en inglés. El tipo obliga a traducir cada página; si falta una, `astro check` falla. **Pendiente de revisión por un hablante nativo.**
- Sitemap: `astro.config.mjs` añade `serialize` con las alternativas de cada página (los slugs difieren, p. ej. `/es/precios/` y `/en/pricing/`). Antes solo Inicio y Blog tenían alternativas; ahora las 24 URLs.
- `llms.txt` con títulos en el idioma de cada sección; `public/robots.txt` y `public/_redirects` (solo `/ -> /es/`).

## Páginas Error 404 y Offline (nuevas)

- Migradas con `scripts-migracion/gen-standalone.mjs` a `src/components/pages/standalone/`, con `StandaloneLayout` (sin menú, hero ni footer) y la isla `src/scripts/standalone.ts` (paralaje del puntero; en Offline, reintento y recarga al volver la conexión).
- Rutas: `/404.html` y `/en/404/`; `/es/sin-conexion/` y `/en/offline/`. Son `noindex`, quedan fuera del sitemap y `SeoHead` acepta ruta canónica y alternativas propias (`src/data/extra-pages.ts`). Los títulos en inglés son propuesta mía.
- Capturas (3 anchos, ES y EN): 12 de 12 dentro del umbral, texto idéntico. Máximo 0,0458 %.
- Comportamiento (`interact-extras.ts`, ES y EN): enlaces, `:hover`, reintento (animación y recarga), mensaje y recarga al volver la conexión; 23 comprobaciones, 0 diferencias.
- `main.ts` ya no ejecuta menú, hero ni efectos globales cuando la página es autónoma.

## Correcciones de esta ronda

- Regresión de Codex en Prueba y Blog: el conversor pasó a emitir `{t(expr)}` y el generador ya no encontraba `{p.name}`/`{b.name}`, de modo que el nombre y el correo del mensaje de confirmación salían vacíos («¡Solicitud lista, !»), también en español. Corregido en `gen-page.mjs` y regenerados `prueba/Body.astro` y `blog/Body.astro` (el resto de archivos y `hover.css` quedaron idénticos). Las pruebas en español lo habrían detectado: no se habían vuelto a correr tras el cambio de Codex.
- Línea base inglesa de `conoce__820__en__hero__night`: se tomó antes de que el sitio original aplicara la traducción (texto en español). Recapturada tres veces; el original y Astro dan el mismo texto y 0 píxeles de diferencia.

## Pruebas en inglés (nuevo)

`TEST_LANG=en` repite cada suite de interacción: el original con `?lang=en`, el candidato en `/en/...`, y los textos fijos de las pruebas pasan por el mismo catálogo (`tests/visual/lang.ts`).

- Capturas (layout y hero, 3 anchos, incluidas 404 y Offline): español 69 de 69 e inglés 69 de 69 dentro del umbral (`--threshold=0.2`, razón máxima 0,001), con texto visible idéntico. Máximo 0,0451 %.
- Interacción: 15 suites en español y 15 en inglés (compartida, Producto, Soluciones, Inicio, Precios, Contacto, FAQ, Prueba, Blog, Ayuda, Conoce, Términos, Privacidad, `:hover` y 404/Offline): 30 de 30 sin diferencias no esperadas. Blog y Prueba en inglés dieron diferencias intermitentes por el traductor asíncrono del original; se espera 500 ms antes de leer y quedaron estables.
- `npm run verify`: Astro Check 0 errores, avisos y sugerencias; ESLint y Prettier limpios; build de 29 rutas. `check:seo`: 24 páginas indexables, 0 problemas (las 3 `noindex` se omiten). Legales: 14 de 14 documentos sin diferencias de texto.

## Límites pendientes

- Los metadatos en inglés (`seo-en.ts`) son redacción nueva, no copiada del sitio actual.
- El original no traduce algunos textos dinámicos hasta un instante después; Astro los entrega ya traducidos (mejora, no pérdida).
- Los documentos legales siguen en español en ambos idiomas, a propósito.
- Las imágenes `cero-404.png`, `icono-offline.png`, `panorama-prado.png`, `btn-404-inicio.png`, `btn-404-producto.png` y `btn-reintentar.png` no existen en `site/uploads`: el sitio actual tampoco las tiene (también falla con 404), así que 404 y Offline se ven igual sin ellas. Hay que pedirlas al diseño. Las peticiones 404 de esos recursos se excluyen de la comparación de consola.
- El aviso de build «Could not render `` from route `/`» (raíz con redirección de i18n y `index.astro`) es previo y no afecta a las 29 rutas; no verificado qué efecto tiene en el hosting final.
- `_redirects` solo cubre `/`; el mapa de unas 290 redirecciones depende de la pregunta 3 de MIGRACION.md (sin respuesta).
- Criterio de idioma de la raíz (`/` siempre a `/es/`), códigos hreflang y slugs siguen siendo provisionales (preguntas 1, 2, 7 y 15).
- Sin desplegar ni comprobar el sitio publicado.
