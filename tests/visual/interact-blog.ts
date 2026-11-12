// Uso: SITE_DIR=<site/> node tests/visual/interact-blog.ts
// Compara filtros, búsqueda y suscripción local del Blog.
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { chromium, type Page } from '@playwright/test';
import { serveStatic } from './serve.ts';
import { TLANG, tr, urlFor } from './lang.ts';

const siteDir = process.env.SITE_DIR;
if (!siteDir) throw new Error('Falta SITE_DIR');
const reactDir = resolve(siteDir, '../harness/artifact-type/compat');
const s1 = await serveStatic(resolve(siteDir), 4173);
const s2 = await serveStatic(resolve('dist'), 4174);
const browser = await chromium.launch();
type Side = 'actual' | 'candidato';
const results: Record<Side, Record<string, string>> = { actual: {}, candidato: {} };
const INPUT_SEL = ['Tu nombre', 'tu@correo.com']
  .map((p) => `input[placeholder="${tr(p)}"]`)
  .join(',');
const CATEGORIES = [
  'Todos los artículos',
  'Ventas',
  'Crecimiento',
  'Actualizaciones Softseguros',
  'Tendencias Tecnología',
  'Liderazgo',
].map(tr);

const state = async (page: Page): Promise<string> => {
  // El traductor del sitio actual corre de forma asíncrona tras cada cambio: se espera antes de leer en inglés.
  if (TLANG === 'en') await page.waitForTimeout(500);
  return page.evaluate(
    ([inputSel, categoryLabels]) => {
      const root = document.querySelector<HTMLElement>('#sl-root > div');
      const cards = [...document.querySelectorAll<HTMLElement>('article')]
        .filter((x) => x.getClientRects().length > 0)
        .map((x) => x.querySelector('h3')?.innerText || x.innerText.slice(0, 60));
      const inputs = [...document.querySelectorAll<HTMLInputElement>(inputSel as string)];
      const categories = (categoryLabels as string[]).map((label) => {
        const b = [...document.querySelectorAll<HTMLButtonElement>('button')].find(
          (x) => x.textContent?.trim() === label,
        );
        return b ? getComputedStyle(b).color : '';
      });
      return JSON.stringify({
        text: root?.innerText,
        cards,
        inputs: inputs.map((x) => ({
          border: getComputedStyle(x).borderColor,
          visible: x.getClientRects().length > 0,
        })),
        categories,
      });
    },
    [INPUT_SEL, CATEGORIES],
  );
};

for (const side of ['actual', 'candidato'] as Side[])
  for (const width of [375, 820, 1440]) {
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
      return route.abort();
    });
    await page.goto(urlFor(side, 'Blog', '/es/blog/'), { waitUntil: 'load' });
    await page.waitForTimeout(1700);
    const out = results[side];
    out[`inicio ${width}`] = await state(page);
    await page.getByRole('button', { name: tr('Ventas'), exact: true }).click();
    out[`ventas ${width}`] = await state(page);
    await page.locator('input[type="search"]').fill('renovaciones');
    out[`búsqueda ${width}`] = await state(page);
    await page.locator('input[type="search"]').fill('zzzxxyy');
    out[`vacío ${width}`] = await state(page);
    await page.locator('input[type="search"]').fill('');
    await page.getByRole('button', { name: tr('Todos los artículos') }).click();
    out[`todos ${width}`] = await state(page);
    await page.getByRole('button', { name: tr('Suscribirme →'), exact: true }).click();
    out[`errores ${width}`] = await state(page);
    await page.locator(`input[placeholder="${tr('Tu nombre')}"]`).fill('Laura');
    await page.locator(`input[placeholder="${tr('tu@correo.com')}"]`).fill('laura@example.com');
    await page.getByRole('button', { name: tr('Suscribirme →'), exact: true }).click();
    out[`éxito ${width}`] = await state(page);
    out[`consola ${width}`] = errors.join(' | ') || 'ninguno';
    await page.close();
  }
await browser.close();
s1.close();
s2.close();
let bad = 0;
for (const [key, expected] of Object.entries(results.actual)) {
  const actual = results.candidato[key] ?? '';
  if (actual !== expected) {
    bad++;
    const a = JSON.parse(expected),
      b = JSON.parse(actual);
    const at = [...a.text].findIndex((c, i) => c !== [...b.text][i]);
    console.log(
      `DIFIERE ${key} texto@${at}: ${a.text.slice(Math.max(0, at - 60), at + 130)} | ${b.text.slice(Math.max(0, at - 60), at + 130)}; cards ${JSON.stringify(a.cards)} / ${JSON.stringify(b.cards)}; inputs ${JSON.stringify(a.inputs)} / ${JSON.stringify(b.inputs)}`,
    );
  }
}
console.log(`comprobaciones: ${Object.keys(results.actual).length}; difieren: ${bad}`);
process.exit(bad ? 1 : 0);
