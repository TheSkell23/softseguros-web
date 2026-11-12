// Uso: node scripts-migracion/home-badge.mjs   (idempotente; ejecutar tras gen-page.mjs inicio)
// Hero de Inicio: se elimina el distintivo «Bienvenido a Softseguros» (era una imagen, btn-welcome.webp, con brillo,
// degradado y estrella). No lo reemplaza nada. El contenedor queda vacío (sin altura) y el título sube a su lugar.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'src/components/pages/inicio/Hero.astro';
const ORIGINAL =
  '<span class="rf" role="img" aria-label={tr("Bienvenido a Softseguros")} style="position:relative;overflow:hidden;display:inline-block;border-radius:999px;vertical-align:top;background:transparent center/100% 100% no-repeat url(/uploads/btn-welcome.webp);width:190px;height:40px"></span>';
// Versión minimalista de texto (intermedia): también se elimina.
const MINIMAL = /<span data-home-badge style="[^"]*">\{tr\("Bienvenido a Softseguros"\)\}<\/span>/;

const before = readFileSync(FILE, 'utf8');
let after = before.replace(ORIGINAL, '').replace(MINIMAL, '');
if (after === before) console.log(`${FILE}: ya aplicado (sin distintivo)`);
else {
  writeFileSync(FILE, after);
  console.log(`${FILE}: distintivo eliminado`);
}
if (/Bienvenido a Softseguros/.test(after))
  throw new Error('Sigue habiendo un distintivo en Hero.astro');
