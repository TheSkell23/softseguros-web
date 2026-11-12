// Uso: SITE_DIR=<site/> node tests/visual/interact-faq.ts
// Compara categorías, chat, búsqueda y acordeones de FAQ.
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

const CAT_LABELS = [
  'General',
  'Precio y prueba',
  'Funciones',
  'Implementación y soporte',
  'Datos y seguridad',
  'Contrato y renovación',
].map(tr);

const state = (page: Page): Promise<string> =>
  page.evaluate(
    ([catLabels, lang]) => {
      const cats = (catLabels as string[]).map((label) => {
        const b = [...document.querySelectorAll<HTMLButtonElement>('#chat button')].find(
          (x) => x.textContent?.trim() === label,
        );
        return b ? getComputedStyle(b).color : '';
      });
      const log = document.getElementById('fq-log');
      const basics = [...document.querySelectorAll<HTMLButtonElement>('#basicas button')].map((b) =>
        b.getAttribute('aria-expanded'),
      );
      const chips = [...document.querySelectorAll<HTMLButtonElement>('#chat button')]
        .filter((b) => {
          const text = b.textContent?.trim() ?? '';
          // En español las sugerencias empiezan por «¿»; en inglés son los botones que no son categorías.
          return lang === 'es' ? text.startsWith('¿') : !(catLabels as string[]).includes(text);
        })
        .map((b) => b.textContent?.trim());
      return JSON.stringify({
        cats,
        chips,
        log: log?.innerText,
        basics,
        text: document.querySelector<HTMLElement>('#sl-root > div')?.innerText,
      });
    },
    [CAT_LABELS, TLANG],
  );

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
    await page.goto(urlFor(side, 'FAQ', '/es/preguntas-frecuentes/'), { waitUntil: 'load' });
    await page.waitForTimeout(1800);
    const out = results[side];
    out[`inicio ${width}`] = await state(page);
    await page.getByRole('button', { name: tr('Precio y prueba') }).click();
    out[`categoría ${width}`] = await state(page);
    await page
      .getByRole('button', { name: tr('¿Cuánto cuesta Softseguros?') })
      .first()
      .click();
    await page.waitForTimeout(2000);
    out[`pregunta ${width}`] = await state(page);
    await page.locator('#fq-in').fill('cuanto cuesta');
    await page.locator('#fq-in').press('Enter');
    await page.waitForTimeout(2000);
    out[`búsqueda ${width}`] = await state(page);
    await page.locator('#fq-in').fill('zzzxxyy');
    await page.locator('#fq-in').press('Enter');
    await page.waitForTimeout(2000);
    out[`sin respuesta ${width}`] = await state(page);
    await page.locator('#basicas button').nth(1).click();
    out[`acordeón abierto ${width}`] = await state(page);
    await page.locator('#basicas button').nth(1).click();
    out[`acordeón cerrado ${width}`] = await state(page);
    out[`errores ${width}`] = errors.join(' | ') || 'ninguno';
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
    console.log(
      `DIFIERE ${key}\n actual: ${expected.slice(0, 800)}\n candidato: ${actual.slice(0, 800)}`,
    );
  }
}
console.log(`comprobaciones: ${Object.keys(results.actual).length}; difieren: ${bad}`);
process.exit(bad ? 1 : 0);
