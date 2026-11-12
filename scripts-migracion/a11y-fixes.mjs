// Uso: node scripts-migracion/a11y-fixes.mjs   (idempotente; ejecutar tras gen-shared, gen-header y gen-page)
// Fase 6: correcciones de accesibilidad que no cambian el aspecto ni añaden textos nuevos al catálogo.
//  - Enlaces del footer sin destino con aria-label: `role="img"` (aria-label no es válido en un <a> sin href).
//  - Botón de idioma: el nombre accesible incluye el texto visible («EN: Switch to English»).
//  - Botón de reproducir de Conoce: el nombre accesible pasa a ser su texto visible («Ver el video»).
//  - Conoce: el primer h3 (tras el h1, sin h2) lleva aria-level=2 para no saltar de nivel.
//  - Un único landmark `main` (role="main") en el contenedor de contenido de las páginas internas.
import { readFileSync, writeFileSync } from 'node:fs';

const edits = [
  [
    'src/components/layout/Footer.astro',
    [
      [
        '            aria-label="Red social"\n',
        '            role="img"\n            aria-label="Red social"\n',
      ],
    ],
  ],
  [
    'src/components/layout/Header.astro',
    [['aria-label={lbLabel}', 'aria-label={`${otherLang.toUpperCase()}: ${lbLabel}`}']],
  ],
  [
    'src/components/pages/conoce/Body.astro',
    [
      [' aria-label={t("Reproducir el video: Conoce Softseguros")}', ''],
      ['<h3>', '<h3 role="heading" aria-level="2">', 'first'],
    ],
  ],
  [
    'src/layouts/PageLayout.astro',
    [['<div style={wrapStyle}>', '<div style={wrapStyle} role="main">']],
  ],
];

for (const [file, pairs] of edits) {
  let s = readFileSync(file, 'utf8');
  const notes = [];
  for (const [from, to, mode] of pairs) {
    // Si la cadena destino contiene a la origen (p. ej. se añade un atributo), se detecta por la destino.
    const applied = mode === 'first' || to.includes(from) ? s.includes(to) : !s.includes(from);
    if (applied) {
      notes.push('ya aplicado');
      continue;
    }
    s = mode === 'first' ? s.replace(from, to) : s.split(from).join(to);
    notes.push('aplicado');
  }
  writeFileSync(file, s);
  console.log(`${file}: ${notes.join(', ')}`);
}
