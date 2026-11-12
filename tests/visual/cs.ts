// Uso: SITE_DIR=<site/> node tests/visual/cs.ts <PáginaActual> <ruta-astro> <ancho> <selector> <prop,prop,...>
// Imprime estilos calculados del primer elemento que coincide, en el sitio actual y en el candidato.
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';
import { serveStatic } from './serve.ts';

const [pageName, astroPath, widthArg, selector, props] = process.argv.slice(2);
const siteDir = process.env.SITE_DIR;
if (!pageName || !astroPath || !widthArg || !selector || !props || !siteDir)
  throw new Error('Faltan argumentos');
const reactDir = resolve(siteDir, '../harness/artifact-type/compat');
const s1 = await serveStatic(resolve(siteDir), 4173);
const s2 = await serveStatic(resolve('dist'), 4174);
const browser = await chromium.launch();
for (const [label, url] of [
  ['actual   ', `http://127.0.0.1:4173/${encodeURIComponent(pageName)}.dc.html?tod=day`],
  ['candidato', `http://127.0.0.1:4174${astroPath}?tod=day`],
] as const) {
  const page = await (
    await browser.newContext({ viewport: { width: Number(widthArg), height: 900 } })
  ).newPage();
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
    return route.abort();
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const out = await page.evaluate(
    ([sel, ps]) => {
      const e = document.querySelector(sel as string);
      if (!e) return 'sin elemento';
      const cs = getComputedStyle(e);
      return (ps as string)
        .split(',')
        .map((p) => `${p}=${cs.getPropertyValue(p)}`)
        .join(' | ');
    },
    [selector, props],
  );
  console.log(label, out);
}
await browser.close();
s1.close();
s2.close();
