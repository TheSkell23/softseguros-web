// Uso: node scripts-migracion/copy-uploads.mjs <ruta a site/>
// Copia a public/uploads solo las imágenes que referencian los estilos, componentes y fragmentos generados.
// Provisional: en la Fase 5 pasan por astro:assets.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const site = process.argv[2];
if (!site) throw new Error('Falta la ruta a site/');
const used = new Set();
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(css|astro|ts|html)$/.test(e.name)) {
      for (const m of readFileSync(p, 'utf8').matchAll(/\/uploads\/([\w.-]+)/g)) used.add(m[1]);
      for (const m of readFileSync(p, 'utf8').matchAll(
        /footer-tf\.\$\{ext\}|footer-u\.\$\{ext\}/g,
      )) {
        used.add(m[0].replace('${ext}', 'webp'));
        used.add(m[0].replace('${ext}', 'png'));
      }
    }
  }
};
walk('src');
mkdirSync('public/uploads', { recursive: true });
const missing = [];
for (const f of [...used].sort()) {
  const src = join(site, 'uploads', f);
  if (existsSync(src) && statSync(src).isFile()) copyFileSync(src, join('public/uploads', f));
  else missing.push(f);
}
console.log(
  `copiadas: ${used.size - missing.length} | referenciadas pero inexistentes en site/uploads: ${missing.join(', ') || 'ninguna'}`,
);
