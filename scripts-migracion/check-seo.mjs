// Comprueba en dist/: canonical y hreflang de cada página existen en el sitemap, y cada hreflang es recíproco.
// Uso: node scripts-migracion/check-seo.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import process from 'node:process';

const locs = new Set(
  [...readFileSync('dist/sitemap-0.xml', 'utf8').matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]),
);
const pages = new Map();
let noindex = 0;
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'index.html' && /^dist\/(es|en)\//.test(full.split(sep).join('/'))) {
      const html = readFileSync(full, 'utf8');
      // Las páginas noindex (404, Offline) no van en el sitemap: no se exige reciprocidad.
      if (/<meta name="robots" content="noindex/.test(html)) {
        noindex++;
        continue;
      }
      const canonical = html.match(/rel="canonical" href="([^"]*)"/)?.[1];
      const alts = new Map(
        [...html.matchAll(/rel="alternate" hreflang="([^"]*)" href="([^"]*)"/g)].map((m) => [
          m[1],
          m[2],
        ]),
      );
      if (canonical) pages.set(canonical, alts);
    }
  }
};
walk('dist');

let problems = 0;
const fail = (msg) => {
  problems++;
  console.log('FALLA:', msg);
};
for (const [canonical, alts] of pages) {
  if (!locs.has(canonical)) fail(`canonical fuera del sitemap: ${canonical}`);
  if (alts.get(canonical.includes('/en/') ? 'en' : 'es') !== canonical)
    fail(`sin autorreferencia hreflang: ${canonical}`);
  if (!alts.has('x-default')) fail(`sin x-default: ${canonical}`);
  for (const [lang, url] of alts) {
    if (lang === 'x-default') continue;
    if (!locs.has(url)) fail(`hreflang ${lang} fuera del sitemap: ${url}`);
    const back = pages.get(url);
    if (!back || ![...back.values()].includes(canonical))
      fail(`hreflang no recíproco: ${canonical} -> ${url}`);
  }
}
console.log(
  `páginas revisadas: ${pages.size} (noindex omitidas: ${noindex}) | URLs en sitemap: ${locs.size} | problemas: ${problems}`,
);
process.exit(problems === 0 && pages.size === locs.size ? 0 : 1);
