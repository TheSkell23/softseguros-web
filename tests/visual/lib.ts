// Utilidades comunes de las pruebas de interacción: servidores, sitio actual frente a candidato, ruteo sin red.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { chromium, type Browser, type Page } from '@playwright/test';
import { pathFor, type PageKey } from '../../src/i18n/routes.ts';
import { localPath, TLANG, tr } from './lang.ts';
import { serveStatic } from './serve.ts';

export type Side = 'actual' | 'candidato';
export const SIDES: Side[] = ['actual', 'candidato'];

const siteDir = process.env.SITE_DIR;
if (!siteDir) throw new Error('Define SITE_DIR con la ruta a site/');
const reactDir = resolve(siteDir, '../harness/artifact-type/compat');
const fontRoot = resolve('node_modules/@fontsource');
const FONT_FILES = [
  'inter-tight/400.css',
  'inter-tight/500.css',
  'inter-tight/600.css',
  'instrument-serif/400-italic.css',
];
const fontCss = (
  await Promise.all(
    FONT_FILES.map(async (f) =>
      (await readFile(join(fontRoot, f), 'utf8')).replace(
        /url\(\.\/files\/([^)]+)\)/g,
        'url(https://fonts.gstatic.com/local/$1)',
      ),
    ),
  )
).join('\n');

const FILE_TO_KEY: Record<string, PageKey> = {
  'Softseguros.dc.html': 'inicio',
  'Producto.dc.html': 'producto',
  'Soluciones.dc.html': 'soluciones',
  'Precios.dc.html': 'precios',
  'Contacto.dc.html': 'contacto',
  'FAQ.dc.html': 'faq',
  'Prueba.dc.html': 'prueba',
  'Blog.dc.html': 'blog',
  'Ayuda.dc.html': 'ayuda',
  'Conoce.dc.html': 'conoce',
  'Terminos.dc.html': 'terminos',
  'Privacidad.dc.html': 'privacidad',
};
export { TLANG, tr, localPath };

/** Normaliza un enlace del sitio actual (Pagina.dc.html#x) a su ruta equivalente en el candidato. */
export const normalizeHref = (href: string): string => {
  const m = href.match(/^([A-Za-z]+\.dc\.html)(#.*)?$/);
  const key = m?.[1] ? FILE_TO_KEY[m[1]] : undefined;
  return key ? pathFor(key, TLANG) + (m?.[2] ?? '') : href;
};

export const siteRoot = resolve(siteDir);
export const startServers = async (): Promise<{ stop: () => void }> => {
  const a = await serveStatic(siteRoot, 4173);
  const b = await serveStatic(resolve('dist'), 4174);
  return {
    stop: () => {
      a.close();
      b.close();
    },
  };
};

export const pageUrl = (
  side: Side,
  current: string,
  astroPath: string,
  hash = '',
  tod = 'day',
): string =>
  side === 'actual'
    ? `http://127.0.0.1:4173/${encodeURIComponent(current)}.dc.html?tod=${tod}${TLANG === 'en' ? '&lang=en' : ''}${hash}`
    : `http://127.0.0.1:4174${localPath(astroPath)}?tod=${tod}${hash}`;

export interface Opened {
  page: Page;
  errors: string[];
  requests: string[];
}

/** Abre una página sin red (React y fuentes locales). Registra errores propios y peticiones externas. */
export async function open(
  browser: Browser,
  url: string,
  opts: { reduced?: boolean; width: number },
): Promise<Opened> {
  const ctx = await browser.newContext({
    viewport: { width: opts.width, height: 900 },
    reducedMotion: opts.reduced === false ? 'no-preference' : 'reduce',
  });
  const page = await ctx.newPage();
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message.slice(0, 120)}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && /127\.0\.0\.1/.test(m.location().url))
      errors.push(`console: ${m.text().slice(0, 120)}`);
  });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, async (route) => {
    const u = route.request().url();
    if (/unpkg\.com\/react@/.test(u))
      return route.fulfill({
        contentType: 'text/javascript',
        body: await readFile(join(reactDir, 'react.production.min.js')),
      });
    if (/unpkg\.com\/react-dom@/.test(u))
      return route.fulfill({
        contentType: 'text/javascript',
        body: await readFile(join(reactDir, 'react-dom.production.min.js')),
      });
    if (/fonts\.googleapis\.com/.test(u))
      return route.fulfill({ contentType: 'text/css', body: fontCss });
    const m = u.match(/fonts\.gstatic\.com\/local\/(.+)$/);
    if (m?.[1]) {
      for (const pkg of ['inter-tight', 'instrument-serif']) {
        const p = join(fontRoot, pkg, 'files', m[1]);
        if (existsSync(p))
          return route.fulfill({ contentType: 'font/woff2', body: await readFile(p) });
      }
    }
    requests.push(u);
    return route.abort();
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2600);
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await page.waitForTimeout(500);
  return { page, errors, requests };
}

/** Compara dos mapas de resultados e imprime el informe; devuelve el número de diferencias. */
export function report(
  out: Record<Side, Record<string, string>>,
  expected: Set<string> = new Set(),
): number {
  let bad = 0;
  for (const k of Object.keys(out.actual)) {
    const a = out.actual[k] ?? '';
    const c = out.candidato[k] ?? '';
    const ok = a === c;
    const exp = !ok && expected.has(k);
    if (!ok && !exp) bad++;
    console.log(
      `${ok ? 'OK       ' : exp ? 'ESPERADO ' : 'DIFIERE  '}${k}${ok ? '' : `\n   actual   : ${a.slice(0, 400)}\n   candidato: ${c.slice(0, 400)}`}`,
    );
  }
  console.log(`\ncomprobaciones: ${Object.keys(out.actual).length} | difieren: ${bad}`);
  return bad;
}

export { chromium };
