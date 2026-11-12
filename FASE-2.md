# Fase 2 — Componentes compartidos (informe)

Todo "probado en local" el 2 de noviembre de 2026. `site/` no se modificó (sigue idéntico a `site-respaldo/`).

## Estado frente al plan (MIGRACION.md, sección 8)

| Parte de la Fase 2                                                                      | Estado                                                                                                              |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Menú (`Header`, menú móvil, selector de idioma)                                         | Hecho y verificado                                                                                                  |
| Hero compartido (tres capas por horario, estrellas, motas, barra de progreso)           | Hecho y verificado                                                                                                  |
| Footer (variante WebP del resto y variante PNG de Inicio)                               | Hecho y verificado                                                                                                  |
| Scripts compartidos (`hero`, `mobile-nav`, `glass`, `life`, `fx`) portados a TypeScript | Hecho                                                                                                               |
| Hero de Inicio (`#stage`, tarjetas flotantes, citas)                                    | No: es contenido de la página de Inicio (Fase 3)                                                                    |
| Traducción de los estilos en línea de estos componentes a utilidades de Tailwind        | **No hecha** (ver abajo)                                                                                            |
| Componentes sueltos de tarjeta glass, botones y acordeón                                | **No extraídos todavía**: viven dentro de las páginas y se extraen en la Fase 3, junto con las páginas que los usan |
| Imágenes con `astro:assets`                                                             | No: es la Fase 5 (las imágenes se copian tal cual a `public/uploads/`)                                              |

**Qué significa lo del CSS:** los componentes conservan el marcado y los estilos en línea originales, y el CSS común de las 11 páginas internas (236 reglas, en su orden original) va en `src/styles/inner.css`. Así el resultado es idéntico píxel a píxel. Convertir esos estilos a utilidades de Tailwind (criterio de la sección 5 de MIGRACION.md) sigue pendiente y requiere tu decisión: hacerlo ahora, componente por componente con la misma comparación, o hacerlo en la Fase 3 página por página.

## Verificación

`npm run verify` (`astro check`, ESLint, Prettier y build): 0 errores, 0 avisos, 0 sugerencias; 26 páginas. `npm run check:seo`: 24 de 24 páginas coherentes.

### Comparación visual de elementos (81 comparaciones, 375 / 820 / 1440 px, español)

- **Hero de las 11 páginas internas** (45: 33 de día y 12 de atardecer/noche): **todas dentro del umbral**, incluso con el umbral por píxel de 0,1. En 1440 px salen **idénticas píxel a píxel (0,000 %)**; en 375 y 820 px, máximo 0,045 %.
- **Footer de las 12 páginas** (36): con umbral por píxel 0,1 pasan 51 de 81 comparaciones en total (los heros y 6 footers); con **0,2 (el valor por defecto de Playwright) pasan las 81**, con un máximo de 0,084 %. Las diferencias a 0,1 son antialiasing de texto: la posición vertical relativa de todos los elementos del footer es idéntica (desplazamiento constante en cada elemento) y el texto es idéntico en las 81. Detalle en "Decisión".
- **Texto visible**: idéntico en las 81 comparaciones.

### Comportamiento (`npm run test:interact`, 17 comprobaciones)

16 coinciden con el sitio actual: menú compacto al hacer scroll y al volver arriba, desplegable de "Producto" al pasar el ratón, enlaces del menú y del footer, menú móvil (abrir, contenido, cerrar con Escape), horario del hero a las 10:00, 17:30, 22:00, 06:59 y 19:00, y cero errores de consola. La diferencia restante es por diseño: el selector ES/EN pasa de `span` a enlaces reales a la misma página en el otro idioma.

## Hallazgos y correcciones durante la fase

1. **Corrección de lo que te dije:** el zoom del hero es mayor de lo que reporté. `fx.js` añade `scale(1,1)` a cada capa, además del contenedor al 108 % y la animación de 1,02 a 1,1: la imagen se amplía entre 1,21 y 1,31 veces el ancho de la pantalla. Corregido en `MIGRACION.md`.
2. **CSS con `href` literal:** dos reglas apuntaban al enlace "7 días gratis" por `[href='Prueba.dc.html']`. Con las rutas nuevas dejaban de aplicarse y el botón salía ancho en móvil. Ahora usa `[data-cta="trial"]`.
3. **`style-hover` y `style-active`:** el runtime actual los convierte en reglas `:hover`/`:active` con `!important` (`createPseudoSheet`). Se reproducen igual en `src/styles/hover.css` (9 reglas generadas).
4. **El menú mide el ancho de sus textos** antes de que la fuente cargue en el sitio actual (valor dependiente de la carrera de carga: `--wn` 94 px frente a 88 px ya cargada). Se hace determinista forzando un nuevo cálculo tras cargar las fuentes y el candidato recalcula al terminar la carga (`loadingdone`).
5. **El runtime envuelve cada interpolación en `<span class="sc-interp">`**: el DOM del candidato es más limpio; el texto es idéntico.
6. **Selector de idioma:** ahora son enlaces reales con `hreflang`; el botón móvil navega a la página equivalente. El contenido en inglés llega en la Fase 4.
7. **Footer de Inicio:** usa PNG en las dos primeras capas del fondo (el resto, WebP). Solo difiere el estilo de la raíz; se resuelve con el parámetro `ext`.
8. **Línea base:** se recapturó (138 + 81 capturas) con el nuevo cálculo del menú, de modo que ambos lados se comparan en el mismo estado asentado.

## Decisión que necesito

**Umbral por píxel de 0,2 en lugar de 0,1** para comparar texto antialiasado. Con 0,1 aparecen diferencias de 0,2 a 0,49 % en footers sin ningún cambio de layout; con 0,2 todo pasa con un máximo de 0,084 %. Mantengo el 0,1 % de píxeles distintos como razón máxima. Si prefieres seguir con 0,1, los footers quedan marcados como fuera de umbral por antialiasing.

## Provisional (se reemplaza en la Fase 3)

- `src/content/hero-fragments/*.html`: contenido del hero de cada página, extraído tal cual de `site/` (enlaces ya con las rutas nuevas) para poder verificar el hero completo. La Fase 3 lo sustituye por un componente de hero tipado.
- Las páginas `src/pages/es|en/[...slug].astro` siguen siendo de andamiaje (hero real, espaciador, footer real). El inglés reutiliza el texto en español hasta la Fase 4.
- `public/uploads/`: 30 imágenes copiadas de `site/uploads` (Fase 5: `astro:assets`).

## No verificado

- ESLint sigue corriendo en Node 24.15.0, por debajo del mínimo documentado de `eslint-plugin-astro`.
- Interacciones de la Fase 3 (pestañas, cotizador, formularios, chat, filtros, video, acordeones legales).
- Hero de Inicio y su footer en el contexto de su página.
- Comparación en inglés (Fase 4).
- Que `compressHTML: true` sea el valor correcto para todas las páginas de la Fase 3 (en estos componentes no produjo diferencias).

## Archivos nuevos (sin contar el andamiaje de la Fase 1)

`src/components/layout/{Header,Hero,Footer}.astro`, `src/layouts/PageLayout.astro` (reescrito), `src/scripts/{hero,mobile-nav,glass,life,fx,main}.ts`, `src/styles/{inner,inner-bundle,hover,fx,runtime}.css`, `src/data/{menu,hero-decor}.ts`, `src/content/hero-fragments/*.html`, `scripts-migracion/{gen-shared,gen-header,copy-uploads}.mjs`, `tests/visual/{interact,geom,navdebug,diffgrid,crop}.ts` y la ampliación de `capture.ts`/`matrix.ts`/`compare.ts` (modos `heroel` y `footerel`, alineación subpíxel, `--matrix=shared`).
