# Fase 3 — Migración de páginas (informe)

Probado en local el 3 de noviembre de 2026. Las 12 páginas están migradas y verificadas. No se ha iniciado la Fase 4 ni se ha desplegado nada.

## Páginas migradas

- Producto: pestañas, tarjetas del hero, hashes y animación del panel. 24 comprobaciones de comportamiento coincidentes (375, 820 y 1440 px).
- Soluciones: pestañas, tarjetas del hero, hashes y CTA externo. 19 comprobaciones coincidentes.
- Inicio: hero propio, secciones, pestañas de equipo y calculadora. 30 comprobaciones coincidentes.
- Precios: cotizador de usuarios y Módulo Comercial. 24 comprobaciones coincidentes.
- Contacto: tema, tamaño, campos y enlace de WhatsApp. 18 comprobaciones coincidentes.
- FAQ: categorías, preguntas sugeridas, búsqueda escrita, respuesta de respaldo y acordeones. 24 comprobaciones coincidentes.
- Prueba: validación y confirmación local, más acordeón. 18 comprobaciones coincidentes; no se envían datos.
- Blog: filtros, búsqueda y suscripción con confirmación local. 24 comprobaciones coincidentes; no se envían datos.
- Ayuda: acordeón. 15 comprobaciones coincidentes.
- **Conoce** (nueva): reproductor de video, preguntas frecuentes, anclas del hero, enlaces y consola, en 375, 820 y 1440 px. 36 comprobaciones: 34 coinciden y 2 son diferencias esperadas (ver "Diferencias esperadas"). Captura completa dentro del umbral: 0,0004 % (1440 px), 0,0014 % (820 px) y 0,0033 % (375 px). Texto visible idéntico. Tres capturas con las preguntas abiertas, también dentro del umbral (máximo 0,0032 %).
- **Términos** (nueva): acordeones, índice lateral, anclas `#d-N` con corrección de scroll, marca del documento actual, enlaces y consola. 51 comprobaciones coincidentes, incluido el texto completo de los 8 documentos con todos abiertos. Captura completa: 0,0005 % (1440 px), 0,0030 % (820 px), 0,0052 % (375 px). Capturas con todos los documentos abiertos: máximo 0,0003 %.
- **Privacidad** (nueva): mismas interacciones, 6 documentos. 45 comprobaciones coincidentes. Captura completa: 0,0006 % (1440 px), 0,0029 % (820 px), 0,0065 % (375 px). Capturas con todos los documentos abiertos: máximo 0,0041 %.

## Textos legales

- Los nodos con `data-no-i18n` se emiten tal cual, sin envolver en `t()` ni traducir atributos (`scripts-migracion/xdc-to-astro.mjs`).
- Comprobación de huellas: `node tests/visual/legal-dist.ts` extrae los 14 documentos del HTML generado (`dist/es/` y `dist/en/`) y los compara con `tests/visual/fixtures/legal.json` mediante `tests/visual/legal.ts`: **14 de 14 documentos sin diferencias de texto, en español y en inglés** (20.659 palabras, huellas por bloques de 50 palabras). Las huellas coinciden con las de `tools/cmp.py` (comprobado en la Fase 1).
- Comparación estricta adicional, carácter por carácter: texto idéntico en los 14 documentos. En 9 documentos los bytes difieren de `tools/legal/d*.html` solo porque la página original añade `target="_blank" rel="noopener"` a los enlaces de los PDF de Drive; el texto no cambia.
- Enlaces externos de los documentos: los mismos que tiene el sitio actual (Drive y la referencia a AWS del texto legal). No se añadió ninguno.

## Regresión final (12 páginas, español)

- **Páginas completas, 375 / 820 / 1440 px (36 capturas):** 36 dentro del umbral (`--threshold=0.2`, razón máxima 0,001) y texto visible idéntico en las 36. Mayor diferencia: 0,0150 % (Inicio, 375 px).
- **Hero en día, atardecer y noche de Inicio, Producto y Conoce, 375 / 820 / 1440 px (27 capturas):** 27 dentro del umbral y texto idéntico. Máximo 0,0024 % (Inicio: 0,0000 %).
- **Comportamiento (12 suites):** `interact.ts` (menú y footer, 17), pestañas de Producto (24) y de Soluciones (19), Inicio (30), Precios (24), Contacto (18), FAQ (24), Prueba (18), Blog (24), Ayuda (15), Conoce (36), Términos (51) y Privacidad (45): 0 diferencias no esperadas.
- **Efectos `:hover` (nuevo):** 679 enlaces, botones y resúmenes recorridos en las 12 páginas a 1440 px; 389 tienen efecto y los 679 coinciden con el sitio actual.
- `npm run verify`: Astro Check con 0 errores, avisos y sugerencias; ESLint, Prettier y build de 26 rutas. `npm run check:seo`: 24 páginas, 0 problemas.
- `site/` y `site-respaldo/` siguen idénticos (75 archivos). `tools/` no se tocó.

## Incidencia encontrada y corregida

Al regenerar las páginas nuevas detecté que el generador reiniciaba la numeración de las reglas `:hover`/`:active` cuando `src/styles/hover.css` ya estaba formateado por Prettier: la semilla solo entendía reglas de una línea. `hover.css` quedó con 2 reglas mientras los componentes usaban `hv1` a `hv8`, `ac3` y `ac5`, de modo que varios efectos de pasar el ratón (menú, botones, tarjetas del hero y footer) estaban mal asignados. **Las capturas no cubren estados `:hover`, así que la regresión visual no lo detectó.**

Corrección: la semilla ahora lee el archivo completo y normaliza las declaraciones; `src/styles/hover.css` está en `.prettierignore`; se reconstruyeron desde cero y de forma coherente el menú, el footer y las 12 páginas (9 reglas hover); y se añadió `tests/visual/interact-hover.ts`, que habría detectado el problema (lo comprobé ejecutándolo antes de la corrección sobre Producto y Conoce: 52 de 106 elementos con efecto distinto, entre ellos todos los enlaces del menú). Salvo la numeración de clases, el contenido regenerado es idéntico al anterior.

## Archivos tocados en esta entrega (solo `site-astro/`)

- Generador: `scripts-migracion/xdc-to-astro.mjs` (texto sin `t()` en `data-no-i18n`, semilla de reglas hover) y `scripts-migracion/gen-page.mjs` (configuración de Conoce, Términos y Privacidad, lectura de `hover.css`).
- Islas: `src/scripts/video.ts` (reproductor de Conoce) y `src/scripts/legal.ts` (documentos legales), cargadas bajo demanda desde `src/scripts/main.ts`.
- Páginas nuevas: `src/components/pages/{conoce,terminos,privacidad}/` (`Hero`, `Body`, `Cta`, `page.css`, `text-keys.json`).
- Regenerados por la numeración hover: los `Hero`/`Body` de las otras páginas, `src/styles/hover.css` y `src/content/hero-fragments/*.html`.
- Pruebas: `tests/visual/{lib,interact-conoce,interact-legal,interact-hover,legal-dist}.ts`.
- Configuración: `.prettierignore`. `public/uploads/`: copias de `site/uploads/` (43 archivos).

## Diferencias esperadas (no son fallos)

- **Anclas al cargar:** al abrir `Conoce#video` o `Conoce#faq` directamente, Astro salta al ancla (es HTML estático); el sitio actual no lo hacía porque renderiza después de la carga. Es una mejora de comportamiento, no una pérdida.
- **Selector de idioma:** pasa de `span` a enlaces reales a la misma página en el otro idioma (ya registrado en la Fase 2).

## Límites pendientes

- Solo se comparó el español. La traducción tipada y la comparación ES/EN (incluidos los títulos de tarjetas legales, que hoy siguen en español en el sitio actual) pertenecen a la Fase 4.
- El reproductor de Conoce se probó sin red: se comparó el iframe creado (URL de `youtube-nocookie`, `title`, `allow`, `referrerPolicy`) y la petición de red, pero no la reproducción real del video.
- Los efectos `:hover` se verificaron en escritorio (1440 px); los estados táctiles no tienen equivalente.
- La traducción de los estilos en línea a utilidades de Tailwind sigue pendiente desde la Fase 2, a la espera de tu decisión; no se cambió el aspecto para anticiparla.
- `src/content/hero-fragments/` ya no se usa (las 12 páginas tienen componente) y puede borrarse; no lo hice porque no lo pediste.
- El sitio actual no incluye los logos `ag-*.webp` de Inicio (seis peticiones 404 en la línea base); Astro reproduce las mismas seis. Las líneas base de Blog e Inicio también registran errores de `path d` del runtime original; en Astro no aparecen.
- ESLint corre en Node 24.15.0, por debajo del mínimo documentado de `eslint-plugin-astro` (ya registrado en las Fases 1 y 2).
- No se ha desplegado ni comprobado el sitio publicado.
