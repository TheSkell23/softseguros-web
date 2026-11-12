// Uso: node scripts-migracion/extract-seo.mjs <ruta a site/> > src/data/seo.ts
// Extrae los metadatos de <helmet> de cada .dc.html (solo lectura de site/).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const site = process.argv[2];
if (!site) throw new Error('Falta la ruta a site/');
const pages = {
  inicio: 'Softseguros',
  producto: 'Producto',
  soluciones: 'Soluciones',
  precios: 'Precios',
  contacto: 'Contacto',
  faq: 'FAQ',
  prueba: 'Prueba',
  blog: 'Blog',
  ayuda: 'Ayuda',
  conoce: 'Conoce',
  terminos: 'Terminos',
  privacidad: 'Privacidad',
};
const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
const out = {};
for (const [key, file] of Object.entries(pages)) {
  const html = readFileSync(join(site, `${file}.dc.html`), 'utf8');
  const helmet = (html.match(/<helmet>[\s\S]*?<\/helmet>/) ?? [''])[0];
  const pick = (re) => {
    const m = helmet.match(re);
    if (!m?.[1]) throw new Error(`${file}: falta ${re}`);
    return decode(m[1]);
  };
  out[key] = {
    title: pick(/<title>([^<]*)<\/title>/),
    description: pick(/<meta name="description" content="([^"]*)"/),
    robots: pick(/<meta name="robots" content="([^"]*)"/),
    ogTitle: pick(/<meta property="og:title" content="([^"]*)"/),
    ogDescription: pick(/<meta property="og:description" content="([^"]*)"/),
    ogImage: pick(/<meta property="og:image" content="([^"]*)"/),
    jsonLd: JSON.parse(pick(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)),
  };
}
const header = `// GENERADO por scripts-migracion/extract-seo.mjs desde site/*.dc.html. Solo español (el inglés se genera en la Fase 4).
import type { PageKey } from '../i18n/routes.ts';

export interface PageSeo {
  title: string;
  description: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  jsonLd: Record<string, unknown>;
}

export const seoEs: Record<PageKey, PageSeo> = `;
process.stdout.write(header + JSON.stringify(out, null, 2) + ';\n');
