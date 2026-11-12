// Uso: node scripts-migracion/scope-hero-bg.mjs   (idempotente; ejecutar tras gen-shared.mjs y gen-page.mjs)
// Fase 5: las reglas `#hero-bg > i#bg-X { background-image: url(...) !important }` de móvil y tablet hacían que
// el navegador descargara las TRES imágenes del hero (día, atardecer y noche) aunque solo se vea una. Aquí cada
// regla se limita al horario activo (`html[data-tod='X']`, que fija un script del <head>) y, en Inicio, las tres
// capas pasan de `style="background-image"` a `data-bg` (initTod ya asigna la imagen de la capa activa).
import { readFileSync, writeFileSync } from 'node:fs';

const CSS_FILES = [
  'src/styles/inner.css',
  'src/components/pages/inicio/home.css',
  'src/components/pages/inicio/page.css',
];
const MARK = '/* Fase 5: imágenes del hero solo del horario activo */';

// Bloque @media con una sola regla sobre una capa del hero.
const RULE = /@media ([^{]+)\{\s*#hero-bg > i#bg-(night|day|sunset) \{([^}]*)\}\s*\}/g;
const IMAGE_DECL = /\s*background-image: url\(([^)]+)\) !important;/;

export function scopeCss(css) {
  if (css.includes(MARK)) return css;
  let touched = false;
  const out = css.replace(RULE, (block, media, layer, body) => {
    const m = body.match(IMAGE_DECL);
    if (!m) return block;
    touched = true;
    const rest = body.replace(IMAGE_DECL, '').trim();
    const selectors =
      layer === 'night'
        ? `html[data-tod='night'] #hero-bg > i#bg-night,\n  html:not([data-tod]) #hero-bg > i#bg-night`
        : `html[data-tod='${layer}'] #hero-bg > i#bg-${layer}`;
    const kept = rest
      ? `@media ${media.trim()} {\n  #hero-bg > i#bg-${layer} {\n    ${rest}\n  }\n}\n`
      : '';
    return `${kept}@media ${media.trim()} {\n  ${selectors} {\n    background-image: url(${m[1]}) !important;\n  }\n}`;
  });
  return touched ? `${MARK}\n${out}` : css;
}

export function scopeDecor(astro) {
  return astro.replace(
    /<i id="(bg-(?:night|day|sunset))" style="background-image:url\(([^)]+)\)"><\/i>/g,
    '<i id="$1" data-bg="$2"></i>',
  );
}

if (
  import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` ||
  process.argv[1]?.endsWith('scope-hero-bg.mjs')
) {
  for (const file of CSS_FILES) {
    const before = readFileSync(file, 'utf8');
    const after = scopeCss(before);
    if (after !== before) writeFileSync(file, after);
    console.log(
      `${file}: ${after !== before ? 'reglas limitadas al horario activo' : 'sin cambios'}`,
    );
  }
  const decor = 'src/components/pages/inicio/Decor.astro';
  const d0 = readFileSync(decor, 'utf8');
  const d1 = scopeDecor(d0);
  if (d1 !== d0) writeFileSync(decor, d1);
  console.log(`${decor}: ${d1 !== d0 ? 'capas con data-bg' : 'sin cambios'}`);
}
