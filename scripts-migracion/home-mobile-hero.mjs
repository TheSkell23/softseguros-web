// Uso: node scripts-migracion/home-mobile-hero.mjs   (idempotente; ejecutar tras gen-page.mjs inicio)
// Hero de Inicio en teléfono (hasta 640 px): las imágenes nuevas (hero-*-m) son verticales, con la proporción de un
// celular (≈9:19,5). El CSS original las ajustaba al ANCHO (`background-size: 100% auto`) y las desvanecía con una
// máscara de 144vw de alto, lo que dejaba una franja pequeña pegada abajo. Aquí se quitan ese ajuste y la máscara:
// la imagen cubre toda la altura del hero (`cover`, anclada abajo, que ya declara la regla anterior).
import { readFileSync, writeFileSync } from 'node:fs';

const FILES = ['src/components/pages/inicio/home.css', 'src/components/pages/inicio/page.css'];
// Regla de teléfono sobre una capa del hero con el ajuste al ancho y la máscara.
const RULE =
  /(@media \(max-width: 640px\) \{\s*#hero-bg > i#bg-(?:night|day|sunset) \{)\s*background-size: 100% auto !important;\s*-webkit-mask:[^;]*;\s*mask:[^;]*;\s*(\})/g;

export function fixMobileHero(css) {
  return css.replace(
    RULE,
    '$1\n    /* Fase 5: hero móvil a toda la altura (sin ajuste al ancho ni máscara) */\n  $2',
  );
}

// Altura mínima del hero en teléfono: el texto y los botones ocupan un alto fijo y la imagen (con el panel en la
// mitad inferior) escala con la altura del hero; en celulares cortos se montaban. Con 245vw de mínimo, el panel
// queda siempre debajo de los botones (probado en 360x640, 375x667 y 390x844). En pantallas altas no cambia nada.
const HEIGHT_MARK = '/* Fase 5: altura mínima del hero en teléfono */';
const HEIGHT_RULE = `
${HEIGHT_MARK}
@media (max-width: 640px) {
  #hero {
    height: auto !important;
    min-height: max(calc(100svh + 44px), 245vw) !important;
  }
}
`;

if (process.argv[1]?.endsWith('home-mobile-hero.mjs')) {
  for (const file of FILES) {
    const before = readFileSync(file, 'utf8');
    let after = fixMobileHero(before);
    if (!after.includes(HEIGHT_MARK)) after += HEIGHT_RULE;
    if (after !== before) writeFileSync(file, after);
    const n = (after.match(/hero móvil a toda la altura/g) ?? []).length;
    console.log(`${file}: ${after !== before ? 'actualizado' : 'sin cambios'} (${n} reglas)`);
  }
}
