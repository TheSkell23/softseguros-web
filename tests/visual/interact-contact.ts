// Uso: SITE_DIR=<site/> node tests/visual/interact-contact.ts
// Comprueba que los datos del formulario de Contacto producen el mismo enlace y selección.
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import process from 'node:process';
import { chromium, type Page } from '@playwright/test';
import { serveStatic } from './serve.ts';
import { tr, urlFor } from './lang.ts';

const siteDir = process.env.SITE_DIR;
if (!siteDir) throw new Error('Falta SITE_DIR');
const reactDir = resolve(siteDir, '../harness/artifact-type/compat');
const s1 = await serveStatic(resolve(siteDir), 4173);
const s2 = await serveStatic(resolve('dist'), 4174);
const browser = await chromium.launch();
const result: Record<'actual' | 'candidato', Record<string, string>> = {
  actual: {},
  candidato: {},
};

const LABELS = [
  'Conocer el CRM',
  'Cotización y precios',
  'Demo del Módulo Comercial',
  'Multicotizador de autos',
  'Soporte o implementación',
  '1 a 2',
  '3 a 5',
  '6 a 15',
  'Más de 15',
].map(tr);

const state = (page: Page): Promise<string> =>
  page.evaluate((labels) => {
    const root = document.querySelector('#sl-root');
    const link = [...(root?.querySelectorAll('a') ?? [])].find((a) =>
      a.getAttribute('href')?.startsWith('https://api.whatsapp.com/send?phone=573204863161&text='),
    );
    const choices = labels.map((label) => {
      const button = [...(root?.querySelectorAll('button') ?? [])].find(
        (b) => b.textContent?.trim() === label,
      );
      const css = button ? getComputedStyle(button) : null;
      return `${label}:${css?.color}:${css?.backgroundImage}`;
    });
    return JSON.stringify({ href: link?.getAttribute('href'), choices });
  }, LABELS);

for (const side of ['actual', 'candidato'] as const)
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
    await page.goto(urlFor(side, 'Contacto', '/es/contacto/'), { waitUntil: 'load' });
    await page.waitForTimeout(1700);
    const out = result[side];
    out[`inicio ${width}`] = await state(page);
    await page.locator(`input[placeholder="${tr('Nombre y apellido')}"]`).fill('Laura Pérez');
    out[`nombre ${width}`] = await state(page);
    await page.locator(`input[placeholder="${tr('Nombre de la agencia')}"]`).fill('Agencia Norte');
    out[`agencia ${width}`] = await state(page);
    await page.getByRole('button', { name: tr('Demo del Módulo Comercial') }).click();
    out[`tema ${width}`] = await state(page);
    await page.getByRole('button', { name: tr('6 a 15') }).click();
    out[`tamaño ${width}`] = await state(page);
    out[`errores ${width}`] = errors.join(' | ') || 'ninguno';
    await page.close();
  }
await browser.close();
s1.close();
s2.close();
let bad = 0;
for (const [key, expected] of Object.entries(result.actual)) {
  const actual = result.candidato[key] ?? '';
  if (expected !== actual) {
    bad++;
    console.log(
      `DIFIERE ${key}\n actual: ${expected.slice(0, 650)}\n candidato: ${actual.slice(0, 650)}`,
    );
  }
}
console.log(`comprobaciones: ${Object.keys(result.actual).length}; difieren: ${bad}`);
process.exit(bad ? 1 : 0);
