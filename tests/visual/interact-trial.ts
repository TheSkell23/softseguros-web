// Uso: SITE_DIR=<site/> node tests/visual/interact-trial.ts
// Compara validación local, éxito y acordeón de Prueba sin enviar datos.
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

const INPUT_SEL = ['Juan', 'Pérez', 'juan.perez@empresa.com', '555 555 5555']
  .map((p) => `input[placeholder="${tr(p)}"]`)
  .join(',');

const state = async (page: Page): Promise<string> => {
  // El traductor del sitio actual corre de forma asíncrona tras cada cambio: se espera antes de leer en inglés.
  if (TLANG === 'en') await page.waitForTimeout(500);
  return page.evaluate((inputSel) => {
    const root = document.querySelector<HTMLElement>('#sl-root > div');
    const inputs = [...document.querySelectorAll<HTMLInputElement>(inputSel)];
    const basics = [
      ...document.querySelectorAll<HTMLButtonElement>('button[aria-expanded]'),
    ].filter((b) => b.closest('#sl-root > div'));
    return JSON.stringify({
      text: root?.innerText,
      inputs: inputs.map((i) => ({
        visible: i.getClientRects().length > 0,
        border: getComputedStyle(i).borderColor,
      })),
      basics: basics.map((b) => b.getAttribute('aria-expanded')),
    });
  }, INPUT_SEL);
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
    await page.goto(urlFor(side, 'Prueba', '/es/prueba-gratis/'), { waitUntil: 'load' });
    await page.waitForTimeout(1700);
    const out = results[side];
    out[`inicio ${width}`] = await state(page);
    await page
      .getByRole('button', {
        name: new RegExp(tr('Solicitar prueba 7 días sin costo →').replace('→', '')),
      })
      .click();
    await page.waitForTimeout(200);
    out[`vacío ${width}`] = await state(page);
    await page.locator(`input[placeholder="${tr('Juan')}"]`).fill('Laura');
    await page.locator(`input[placeholder="${tr('Pérez')}"]`).fill('Pérez');
    await page.locator(`input[placeholder="${tr('juan.perez@empresa.com')}"]`).fill('invalido');
    await page.locator(`input[placeholder="${tr('555 555 5555')}"]`).fill('123');
    await page
      .getByRole('button', {
        name: new RegExp(tr('Solicitar prueba 7 días sin costo →').replace('→', '')),
      })
      .click();
    await page.waitForTimeout(200);
    out[`inválido ${width}`] = await state(page);
    await page
      .locator(`input[placeholder="${tr('juan.perez@empresa.com')}"]`)
      .fill('laura@example.com');
    await page.locator(`input[placeholder="${tr('555 555 5555')}"]`).fill('3001234567');
    await page
      .getByRole('button', {
        name: new RegExp(tr('Solicitar prueba 7 días sin costo →').replace('→', '')),
      })
      .click();
    await page.waitForTimeout(300);
    out[`éxito ${width}`] = await state(page);
    await page
      .locator('[aria-expanded]')
      .filter({ hasText: tr('¿Qué pasa al terminar los 7 días?') })
      .click();
    out[`acordeón ${width}`] = await state(page);
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
    const a = JSON.parse(expected) as { text: string; inputs: unknown; basics: unknown };
    const b = JSON.parse(actual) as { text: string; inputs: unknown; basics: unknown };
    const at = [...a.text].findIndex((char, i) => char !== [...b.text][i]);
    console.log(
      `DIFIERE ${key} texto@${at}: ${a.text.slice(Math.max(0, at - 70), at + 130)} | ${b.text.slice(Math.max(0, at - 70), at + 130)}; inputs: ${JSON.stringify(a.inputs)} / ${JSON.stringify(b.inputs)}; basics: ${JSON.stringify(a.basics)} / ${JSON.stringify(b.basics)}`,
    );
  }
}
console.log(`comprobaciones: ${Object.keys(results.actual).length}; difieren: ${bad}`);
process.exit(bad ? 1 : 0);
