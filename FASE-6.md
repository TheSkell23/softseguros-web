# Fase 6 — Calidad (informe)

Probado en local el 3 de noviembre de 2026. No se ha desplegado nada.

## Accesibilidad

Lighthouse (reglas axe) en las 27 páginas del build (12 en español, 12 en inglés, 404 y Offline en ambos idiomas): puntuación 96 a 100 en las 24 indexables (la línea base tenía 88 a 95). Correcciones sin cambiar aspecto ni textos nuevos (`scripts-migracion/a11y-fixes.mjs`, idempotente):

- Enlaces de redes sociales del footer sin destino: `role="img"` (`aria-label` no es válido en un `<a>` sin `href`).
- Botón de idioma: el nombre accesible incluye el texto visible («EN: Switch to English»).
- Botón de reproducir de Conoce: el nombre accesible es su texto visible («Ver el video»).
- Conoce: el primer `h3` tras el `h1` lleva `aria-level="2"` (sin cambiar la etiqueta ni el estilo).
- Un único landmark `main` (`role="main"`) en el contenedor de contenido de las páginas internas.

**Pendiente (necesita tu aprobación, cambia colores):** `color-contrast` en Producto, Conoce y Prueba (ES y EN). Todos los casos son dos tonos sobre `#e6effb`:

| Color actual | Contraste | Texto                                                                                     | Propuesta mínima | Contraste |
| ------------ | --------- | ----------------------------------------------------------------------------------------- | ---------------- | --------- |
| `#6f82a3`    | 3,35:1    | 13 px, notas bajo botones y pie (p. ej. «Sin tarjeta de crédito · un asesor te acompaña») | `#5a6d87`        | 4,56:1    |
| `#4f78ad`    | 3,91:1    | 12 px, etiquetas en mayúsculas (p. ej. «SOUND FAMILIAR?»)                                 | `#466f9b`        | 4,52:1    |

Fallos de Lighthouse que no son errores: `is-crawlable` en 404 y Offline (son `noindex` a propósito) y `errors-in-console` por las imágenes que no existen (abajo).

## Enlaces

`npm run check:links` recorre los 29 HTML del build: 1.636 referencias, 0 rotas. Los anclajes de pestañas (`#crm`, `#comercial`…) se validan con `data-hashes`. Externos permitidos: demo, WhatsApp, API docs, login, YouTube en Conoce y los PDF de Drive (más la referencia a AWS y a `informacion-legal` que ya están dentro del texto legal). Ningún otro externo.

Faltan imágenes en `site/uploads` (también faltan en el sitio actual): `ag-allianz`, `ag-axa`, `ag-bolivar`, `ag-hdi`, `ag-qualitas` y `ag-sura` (`.webp`), `cero-404.png` e `icono-offline.png`; además se piden desde estilos `panorama-prado.png`, `btn-404-inicio.png`, `btn-404-producto.png` y `btn-reintentar.png`.

## Matriz final de pruebas (build final)

- **Capturas** (12 páginas + 404 y Offline, 375/820/1440 px, español e inglés, hero en 3 horarios en Inicio, Producto y Conoce): 138 de 138 dentro del umbral (`--threshold=0.2`, razón máxima 0,001) y con texto visible idéntico. Máximo 0,0451 %.
- **Comportamiento:** 30 de 30 suites (15 en español y 15 en inglés: compartida, pestañas de Producto y Soluciones, Inicio, Precios, Contacto, FAQ, Prueba, Blog, Ayuda, Conoce, Términos, Privacidad, `:hover` de 679 elementos y 404/Offline), 0 diferencias no esperadas.
- **Textos legales:** 14 de 14 documentos sin diferencias (huellas por bloques de 50 palabras, ES y EN).
- `npm run verify`: Astro Check 0 errores, avisos y sugerencias; ESLint y Prettier limpios; build de 29 rutas. `check:seo`: 24 páginas indexables, 0 problemas. `check:links`: 0 problemas.

## Informe de diferencias respecto al sitio actual

Esperadas y aceptadas: hero de Inicio en teléfono con arte vertical nuevo y altura mínima mayor (ver FASE-5.md; las capturas de Inicio a 375 px difieren a propósito) y distintivo «Bienvenido a Softseguros» del hero de Inicio eliminado (las capturas del hero de Inicio difieren a propósito en todos los anchos; el texto es idéntico); `<head>` real (título, descripción, canonical, hreflang, Open Graph) y `lang` correcto; selector de idioma como enlace real; HTML con el texto completo sin JavaScript; una sola imagen de hero descargada; catálogo en inglés cargado solo en inglés; favicon; roles y nombres accesibles descritos arriba; anclas directas (`Conoce#faq`) que saltan al cargar; menús y textos dinámicos ya traducidos al cargar en inglés (el original traduce un instante después). Metadatos en inglés y títulos del 404/Offline en inglés: redacción nueva, sin revisar por un hablante nativo.

## Límites pendientes

- Contraste de color (arriba), a la espera de tu decisión.
- Rendimiento móvil: con las imágenes optimizadas Producto móvil queda en 77 (corridas 69 a 83), igual a la línea base de 77 y dentro del ruido; Inicio 61 (54 a 74) y Conoce 78 (ver FASE-5.md). La dispersión entre corridas es grande.
- Imágenes inexistentes (diseño), redirecciones antiguas (pregunta 3 de MIGRACION.md), hreflang, slugs y regla de la raíz provisionales, y el aviso de build «Could not render `` from route `/`».
- Tailwind: los estilos en línea siguen sin traducirse a utilidades (decisión tuya pendiente). Node 24.15.0 por debajo del mínimo de `eslint-plugin-astro` (funciona).
- Todo es de laboratorio y local: nada medido ni comprobado en el sitio publicado.
