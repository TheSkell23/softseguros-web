// Uso: SITE_DIR=<site/> node tests/visual/interact-help.ts
// Compara apertura y cierre del acordeón de Ayuda.
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { chromium, type Page } from '@playwright/test';
import { serveStatic } from './serve.ts';
import { TLANG, urlFor } from './lang.ts';

const siteDir = process.env.SITE_DIR;
if (!siteDir) throw new Error('Falta SITE_DIR');
const reactDir = resolve(siteDir, '../harness/artifact-type/compat');
const s1 = await serveStatic(resolve(siteDir), 4173);
const s2 = await serveStatic(resolve('dist'), 4174);
const browser = await chromium.launch();
type Side = 'actual' | 'candidato';
const results: Record<Side, Record<string, string>> = { actual: {}, candidato: {} };
const state = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('#sl-root > div');
    const buttons = [
      ...document.querySelectorAll<HTMLButtonElement>('button[aria-expanded]'),
    ].filter((x) => x.closest('#sl-root > div'));
    return JSON.stringify({
      text: root?.innerText,
      open: buttons.map((x) => x.getAttribute('aria-expanded')),
      icons: buttons.map((x) => getComputedStyle(x.lastElementChild as Element).transform),
    });
  });
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
    await page.goto(urlFor(side, 'Ayuda', '/es/ayuda/'), { waitUntil: 'load' });
    await page.waitForTimeout(1700);
    const out = results[side];
    out[`inicio ${width}`] = await state(page);
    const buttons = page
      .locator('button[aria-expanded]')
      .filter({ hasText: TLANG === 'es' ? '¿' : '?' });
    await buttons.nth(1).click();
    out[`segundo ${width}`] = await state(page);
    await buttons.nth(1).click();
    out[`cerrado ${width}`] = await state(page);
    await buttons.nth(4).click();
    out[`quinto ${width}`] = await state(page);
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
      `DIFIERE ${key}\n actual: ${expected.slice(0, 500)}\n candidato: ${actual.slice(0, 500)}`,
    );
  }
}
console.log(`comprobaciones: ${Object.keys(results.actual).length}; difieren: ${bad}`);
process.exit(bad ? 1 : 0);
