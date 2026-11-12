// Uso: node scripts-migracion/optimize-hero.mjs   (idempotente: siempre parte de assets-src/hero/)
// Fase 5: versiones más livianas de las imágenes de hero de teléfono y tablet. Los originales entregados
// (assets-src/hero/) no se modifican; el resultado se escribe en public/uploads/.
//  - Hero de Inicio, teléfono (-m): arte vertical nuevo (852x1846 y 969x1623, sin cambio de tamaño); si una fuente supera 1.290 px de ancho se reduce a 1.290. WebP calidad 74.
//  - Hero de Inicio, tablet (-t): se conserva 2048x1536 (tablet de hasta 1.000 px a 2x), WebP calidad 74.
//  - Hero de páginas internas (hero-int*): se conserva el tamaño, WebP calidad 74.
// Las de escritorio (3840x2160) no se tocan.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const SRC = 'assets-src/hero';
const OUT = 'public/uploads';
const QUALITY = 74;
const mobileHomeWidth = 1290;

let before = 0;
let after = 0;
for (const name of readdirSync(SRC).filter((n) => n.endsWith('.webp'))) {
  const source = readFileSync(`${SRC}/${name}`);
  const meta = await sharp(source).metadata();
  const isHomeMobile = /^hero-(day|sunset|night)-m\.webp$/.test(name);
  let pipeline = sharp(source);
  if (isHomeMobile && meta.width > mobileHomeWidth)
    pipeline = pipeline.resize({ width: mobileHomeWidth });
  const out = await pipeline.webp({ quality: QUALITY, effort: 6, smartSubsample: true }).toBuffer();
  writeFileSync(`${OUT}/${name}`, out);
  before += source.length;
  after += out.length;
  const m = await sharp(out).metadata();
  console.log(
    `${name.padEnd(22)} ${meta.width}x${meta.height} -> ${m.width}x${m.height}  ${Math.round(source.length / 1024)} -> ${Math.round(out.length / 1024)} KB`,
  );
}
console.log(
  `total: ${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB (${Math.round((1 - after / before) * 100)}% menos)`,
);
