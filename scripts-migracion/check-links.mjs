// Uso: node scripts-migracion/check-links.mjs   (después de `astro build`)
// Revisa todos los href/src del build: internos (existe el archivo y, si hay #hash, el id en esa página) y
// externos (solo los permitidos: demo, WhatsApp, API docs, login, YouTube, redes del footer y PDFs de Drive en los textos legales).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

const DIST = 'dist';
const ALLOWED_EXTERNAL = [
  /^https:\/\/softseguros\.com\/demo-softseguros-vsl\/?/,
  /^https:\/\/(api\.)?whatsapp\.com\//,
  /^https:\/\/wa\.me\//,
  /^https:\/\/app\.softseguros\.com\/srv1\/login\/?/,
  /^https:\/\/www\.youtube(-nocookie)?\.com\//,
  /^https:\/\/drive\.google\.com\//,
  /^https:\/\/www\.instagram\.com\/softseguroslatam\/?$/, // redes del footer
  /^https:\/\/www\.linkedin\.com\/company\/softseguros\/?$/,
  /^https:\/\/app\.softseguros\.com\/docs\//, // documentación de la API
  /^https:\/\/softseguros\.com\/informacion-legal\/?/, // referencia dentro del texto legal
  /^https:\/\/aws\.amazon\.com\//, // referencia dentro del texto legal
  /^https:\/\/www\.softseguros\.com\//, // canonical, hreflang y og
  /^https:\/\/schema\.org/,
  /^https:\/\/www\.w3\.org\//,
];
const files = [];
const walk = (dir) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.html')) files.push(p);
  }
};
walk(DIST);
const ids = new Map();
const htmlOf = (f) => readFileSync(f, 'utf8');
const idsOf = (f) => {
  if (!ids.has(f)) {
    const html = htmlOf(f);
    const set = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    // Pestañas: los hashes (#crm, #comercial…) los resuelve el JavaScript y se declaran en data-hashes.
    for (const m of html.matchAll(/data-hashes="([^"]*)"/g)) {
      try {
        for (const h of Object.keys(JSON.parse(m[1].replace(/&quot;/g, '"'))))
          set.add(String(h).replace(/^#/, ''));
      } catch {
        /* atributo que no es JSON */
      }
    }
    ids.set(f, set);
  }
  return ids.get(f);
};
const toFile = (urlPath) => {
  const clean = decodeURI(urlPath.split('#')[0].split('?')[0]);
  const direct = join(DIST, clean);
  if (existsSync(direct) && statSync(direct).isFile()) return direct;
  const index = join(DIST, clean, 'index.html');
  return existsSync(index) ? index : null;
};
// Imágenes que no existen en site/uploads (tampoco en el sitio actual): pendientes de diseño.
const KNOWN_MISSING =
  /^\/uploads\/(ag-[a-z]+\.webp|cero-404\.png|icono-offline\.png|panorama-prado\.png|btn-404-inicio\.png|btn-404-producto\.png|btn-reintentar\.png)$/;
const missingAssets = new Set();
const problems = [];
const external = new Map();
let checked = 0;
for (const file of files) {
  const page = file
    .split(sep)
    .join('/')
    .replace(/^dist/, '')
    .replace(/index\.html$/, '');
  const html = htmlOf(file);
  const refs = [...html.matchAll(/\s(?:href|src|data-href)="([^"]*)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (!ref || ref.startsWith('data:') || ref.startsWith('mailto:') || ref.startsWith('tel:'))
      continue;
    checked++;
    if (/^https?:\/\//.test(ref)) {
      const ok = ALLOWED_EXTERNAL.some((re) => re.test(ref));
      external.set(ref, (external.get(ref) ?? 0) + 1);
      if (!ok) problems.push(`${page}: enlace externo no permitido ${ref}`);
      continue;
    }
    if (ref.startsWith('#')) {
      if (ref.length > 1 && !idsOf(file).has(ref.slice(1)))
        problems.push(`${page}: ancla inexistente ${ref}`);
      continue;
    }
    if (ref.startsWith('//')) continue;
    const target = toFile(ref.startsWith('/') ? ref : new URL(ref, `http://x${page}`).pathname);
    if (!target) {
      if (KNOWN_MISSING.test(ref)) missingAssets.add(ref);
      else problems.push(`${page}: enlace roto ${ref}`);
      continue;
    }
    const hash = ref.includes('#') ? ref.split('#')[1] : '';
    if (hash && target.endsWith('.html') && !idsOf(target).has(hash))
      problems.push(`${page}: ancla inexistente ${ref}`);
  }
}
const unique = [...new Set(problems)];
console.log(
  `archivos HTML: ${files.length} | referencias revisadas: ${checked} | externas distintas: ${external.size}`,
);
for (const [url, n] of [...external.entries()]
  .filter(([u]) => !/softseguros\.com\/(es|en|uploads|$)/.test(u))
  .slice(0, 40))
  console.log(`  externo (${n}x): ${url}`);
for (const p of unique.slice(0, 60)) console.log('PROBLEMA:', p);
console.log(
  `imágenes que faltan en site/uploads (también en el sitio actual; pendientes de diseño): ${[...missingAssets].join(', ') || 'ninguna'}`,
);
console.log(
  `problemas: ${unique.length}${problems.length !== unique.length ? ` (${problems.length} con repetidos)` : ''}`,
);
process.exit(unique.length ? 1 : 0);
