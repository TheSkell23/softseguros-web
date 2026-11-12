# Fase 5 — Imágenes y rendimiento (informe)

Probado en local el 3 de noviembre de 2026 (Lighthouse 13.6.0, Chromium de Playwright, 3 corridas por celda, mediana; simulación de red y CPU de Lighthouse, no un dispositivo real). Nada se midió publicado. No se ha desplegado nada.

## Qué se cambió

- **Una sola imagen de hero por visita.** Antes, en móvil y tablet el navegador descargaba las tres imágenes del hero (día, atardecer y noche, unos 0,9 MB) porque las reglas CSS con `!important` se aplicaban a las tres capas. Ahora cada regla cuelga de `html[data-tod='…']` y solo la capa del horario activo trae imagen (`scripts-migracion/scope-hero-bg.mjs`, idempotente; en Inicio las tres capas pasan de `style="background-image"` a `data-bg`). Comprobado en 27 combinaciones (3 páginas x 3 anchos x 3 horarios): se descarga exactamente una imagen de hero.
- **Horario antes del primer pintado.** Un script mínimo en el `<head>` fija `html[data-tod]` con la misma lógica de `initTod` (7–17 h día, 17–19 h atardecer, resto noche; `?tod=` fuerza) y precarga la imagen que corresponde al ancho (`src/data/hero-images.ts`, `BaseLayout.astro`). `initTod` mantiene el atributo sincronizado al cambiar de horario. Sin JavaScript se conserva la noche como imagen por defecto, igual que antes.
- **Fuentes propias con precarga.** Ya eran Fontsource (sin Google Fonts); ahora se precargan los cuatro archivos `woff2` latinos (Inter Tight 400, 500 y 600; Instrument Serif cursiva).
- **Catálogo en inglés solo cuando hace falta.** Los scripts de las páginas cargaban 32 KB (gz) de traducciones también en español. `src/i18n/client.ts` (`loadT`) importa el catálogo solo si el idioma es inglés. Medido: las páginas en español ya no piden ese archivo.
- **Favicon.** Había un 404 de `/favicon.ico` en todas las páginas (error de consola). Se enlaza `/uploads/logo.webp` como icono. Es un elemento nuevo del `<head>`; no cambia lo que se ve en la página.

- **Imágenes de teléfono y tablet más livianas** (`scripts-migracion/optimize-hero.mjs`, reproducible con `npm run optimize:hero`; los originales entregados quedan en `assets-src/hero/` y no se modifican). Hero de Inicio en teléfono: 1440x1920 a 1290x1720 (un móvil de 430 px a 3x necesita 1.290 px) y WebP a calidad 74; hero de Inicio en tablet (2048x1536) y de páginas internas (`hero-int*`): mismo tamaño, calidad 74. Las 12 imágenes pasan de 3.829 KB a 2.922 KB (24 % menos; p. ej. 336 KB a 203 KB en el hero móvil de Inicio). Comparadas a ojo al 100 % con las originales no se distinguen, y las capturas del hero quedan en 0,0039 % como máximo. **Las de escritorio (3840x2160) no se tocaron.** Reducir más el ancho (por debajo de lo que pide una pantalla 3x/2x) ahorra casi el doble pero pierde nitidez; no se hizo.

- **Hero de Inicio en teléfono con arte nuevo (cambio de diseño pedido por el usuario).** Las tres imágenes verticales nuevas (día y noche 852x1846, atardecer 969x1623) sustituyen a las anteriores de 1440x1920. El CSS original las ajustaba al ancho (`background-size: 100% auto`) con una máscara de 144vw de alto, lo que dejaba una franja pequeña pegada abajo; ahora cubren toda la altura (`scripts-migracion/home-mobile-hero.mjs`, idempotente, incluido en `npm run postgen`). Como el texto y los botones ocupan un alto fijo, el hero tiene un mínimo de 245vw en teléfono para que el panel quede siempre debajo de los botones (probado en 360x640, 375x667, 390x844 y 430x932). Originales en `assets-src/phone-new/` (PNG) y las anteriores en `assets-src/hero-prev/`. Límite: son de menor resolución que las anteriores (852 px de ancho son unos 2,2x en un celular de 390 px); en pantallas 3x pueden verse algo suaves. **Este cambio es una diferencia intencional con el sitio actual:** las capturas de Inicio a 375 px ya no coinciden (35 a 50 % de píxeles distintos, texto idéntico); 820 y 1440 px siguen idénticos. La línea base de Inicio a 375 px debe regenerarse como nueva referencia.

- **Distintivo del hero de Inicio eliminado (cambio de diseño pedido por el usuario).** «Bienvenido a Softseguros» era una imagen (`btn-welcome.webp`) con brillo, degradado y estrella; se quitó por completo y no lo reemplaza nada (`scripts-migracion/home-badge.mjs`, idempotente, en `npm run postgen`). El título sube a su lugar (unos 40 px). Se aplica a todos los anchos de Inicio. **Diferencia intencional con el sitio actual:** las capturas del hero de Inicio difieren 4,7 a 9 % de píxeles en 820 y 1440 px (el bloque de título y botones desplazado); el texto visible es idéntico. `btn-welcome.webp` ya no se usa y puede borrarse.

## Resultado (Lighthouse, mediana de 3 corridas)

| Página   | Dispositivo | Línea base (sitio actual) | Astro antes de la Fase 5 | Astro ahora            |
| -------- | ----------- | ------------------------- | ------------------------ | ---------------------- |
| Inicio   | móvil       | 43                        | 45                       | 61 (corridas 61/49/82) |
| Inicio   | escritorio  | 73                        | 86                       | 93                     |
| Producto | móvil       | 77                        | 58                       | 65 (corridas 58/65/69) |
| Producto | escritorio  | 84                        | 95                       | 97                     |
| Conoce   | móvil       | 48                        | 65                       | 68                     |
| Conoce   | escritorio  | 86                        | 94                       | 96                     |

| Métrica móvil    | Inicio (base / antes / ahora) | Producto                  | Conoce                    |
| ---------------- | ----------------------------- | ------------------------- | ------------------------- |
| LCP              | 10,8 s / 8,1 s / 4,6 s        | 2,7 s / 6,6 s / 3,8 s     | 9,9 s / 6,8 s / 4,0 s     |
| Peso transferido | 1,8 MB / 1,3 MB / 0,68 MB     | 1,6 MB / 1,0 MB / 0,55 MB | 1,6 MB / 1,1 MB / 0,55 MB |

Buenas prácticas pasó de 96 a 100 en Producto y Conoce (favicon). SEO se mantiene en 100 y ahora no depende de ejecutar JavaScript.

## Verificación visual

- Hero en los 3 horarios, 3 anchos (Inicio, Producto, Conoce): 54 de 54 dentro del umbral (`--threshold=0.2`, razón máxima 0,001); máximo 0,0027 %.
- Con las imágenes optimizadas: 138 de 138 capturas dentro del umbral (máximo 0,0451 %, el mismo de las páginas 404 y Offline). Las suites de comportamiento no dependen de las imágenes y no se repitieron; la última corrida completa (30 de 30) es de antes de optimizarlas.

## Límites y desviaciones del plan

- **Producto móvil:** antes de optimizar las imágenes dio medianas de 65 a 80; con ellas, 77 (corridas 69 a 83), igual a la línea base, dentro del ruido (no se puede afirmar que sea mejor). Lo que más pesa ahora es el hilo principal (maquetación y pintura del cristal con `backdrop-filter` y de las animaciones del diseño). Reducirlo cambiaría el aspecto, así que no lo toqué. `content-visibility` lo descarté: puede desplazar el scroll a los anclajes (`#faq`, `#d-N`) y recortar elementos que sobresalen.
- **`astro:assets` no se usó para el hero ni el footer.** Esas imágenes son fondos CSS con una versión por ancho (móvil, tablet y escritorio) elegida por media query, que cumple el papel de `srcset`; pasarlas a `<img>` cambia el recorte (`cover`), los filtros y las transiciones. Las optimicé con `sharp` (arriba) manteniendo las rutas.
- Las medidas del servidor local usan `astro preview`; un hosting real comprime y cachea distinto. Un servidor propio sin compresión dio peor peso y FCP, así que las cifras solo son comparables entre sí.
- Las imágenes `ag-*.webp` de Inicio y las del 404/Offline no existen (también en el sitio actual): siguen dando 404 y cuentan como error de consola en Inicio.
- Los números de Lighthouse son de laboratorio: no equivalen a un dispositivo real ni al sitio publicado.
