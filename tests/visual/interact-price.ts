// Uso: SITE_DIR=<site/> node tests/visual/interact-price.ts
// Compara el cotizador de Precios entre el sitio actual y Astro.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { chromium, type Page } from '@playwright/test';
import { serveStatic } from './serve.ts';
import { tr, urlFor } from './lang.ts';

const siteDir = process.env.SITE_DIR;
if (!siteDir) throw new Error('Falta SITE_DIR');
const reactDir = resolve(siteDir, '../harness/artifact-type/compat');
const fontRoot = resolve('node_modules/@fontsource');
const fontCss = (
  await Promise.all(
    [
      'inter-tight/400.css',
      'inter-tight/500.css',
      'inter-tight/600.css',
      'instrument-serif/400-italic.css',
    ].map(async (f) =>
      (await readFile(join(fontRoot, f), 'utf8')).replace(
        /url\(\.\/files\/([^)]+)\)/g,
        'url(https://fonts.gstatic.com/local/$1)',
      ),
    ),
  )
).join('\n');
type Side = 'actual' | 'candidato';
const s1 = await serveStatic(resolve(siteDir), 4173);
const s2 = await serveStatic(resolve('dist'), 4174);
const browser = await chromium.launch();
const results: Record<Side, Record<string, string>> = { actual: {}, candidato: {} };
const dirs = {
  actual: resolve('tests/visual/out/price-interact-base'),
  candidato: resolve('tests/visual/out/price-interact-cand'),
};
await Promise.all(Object.values(dirs).map((dir) => mkdir(dir, { recursive: true })));

async function open(side: Side, width: number): Promise<{ page: Page; errors: string[] }> {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
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
    if (m?.[1])
      for (const pkg of ['inter-tight', 'instrument-serif']) {
        const p = join(fontRoot, pkg, 'files', m[1]);
        if (existsSync(p))
          return route.fulfill({ contentType: 'font/woff2', body: await readFile(p) });
      }
    return route.abort();
  });
  await page.clock.setFixedTime(new Date('2026-11-02T10:00:00-05:00'));
  await page.goto(urlFor(side, 'Precios', '/es/precios/'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2600);
  return { page, errors };
}

const state = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const sw = document.querySelector('[role="switch"]');
    return JSON.stringify({
      checked: sw?.getAttribute('aria-checked'),
      text: document.body.innerText,
    });
  });

for (const side of ['actual', 'candidato'] as Side[])
  for (const width of [375, 820, 1440]) {
    const { page, errors } = await open(side, width);
    const out = results[side];
    out[`inicio ${width}`] = await state(page);
    for (const [i, action] of ['minus', 'plus', 'plus', 'toggle', 'minus', 'toggle'].entries()) {
      const selector =
        action === 'toggle'
          ? '[role="switch"]'
          : action === 'plus'
            ? `button[aria-label="${tr('Agregar un usuario')}"]`
            : `button[aria-label="${tr('Quitar un usuario')}"]`;
      await page.locator(selector).click();
      await page.waitForTimeout(400);
      out[`${i} ${action} ${width}`] = await state(page);
      if (i === 3 || i === 5) {
        await page.evaluate(async () => {
          const total = document.documentElement.scrollHeight;
          for (let y = 0; y < total; y += 400) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 70));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(900);
        const id = `price-state-${i}__${width}`;
        await page.screenshot({
          path: join(dirs[side], `${id}.png`),
          fullPage: true,
          animations: 'disabled',
        });
        await writeFile(
          join(dirs[side], `${id}.json`),
          JSON.stringify({
            id,
            text: await page.evaluate(() => document.body.innerText),
            links: [],
            errors,
            height: 0,
          }),
        );
      }
    }
    out[`errores ${width}`] = errors.join(' | ') || 'ninguno';
    await page.close();
  }
await browser.close();
s1.close();
s2.close();
let bad = 0;
for (const [key, expected] of Object.entries(results.actual)) {
  const actual = results.candidato[key] ?? '';
  if (expected !== actual) {
    bad++;
    console.log(
      `DIFIERE ${key}\n actual: ${expected.slice(0, 700)}\n candidato: ${actual.slice(0, 700)}`,
    );
  }
}
console.log(`comprobaciones: ${Object.keys(results.actual).length}; difieren: ${bad}`);
process.exit(bad ? 1 : 0);
