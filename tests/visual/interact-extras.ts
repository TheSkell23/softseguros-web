// Uso: [TEST_LANG=en] SITE_DIR=<site/> node tests/visual/interact-extras.ts
// Páginas autónomas (Error 404 y Offline): enlaces, efectos :hover, errores de consola y, en Offline,
// reintento (animación y recarga) y vuelta a línea (mensaje y recarga).
import process from 'node:process';
import type { Page } from '@playwright/test';
import { extraPaths } from '../../src/data/extra-pages.ts';
import { chromium, normalizeHref, open, report, startServers, TLANG, type Side } from './lib.ts';

const PAGES = [
  { key: 'error404' as const, current: 'Error 404' },
  { key: 'offline' as const, current: 'Offline' },
];
const PROPS = ['transform', 'filter', 'color', 'opacity'];

const urlOf = (side: Side, p: (typeof PAGES)[number]): string =>
  side === 'actual'
    ? `http://127.0.0.1:4173/${encodeURIComponent(p.current)}.dc.html?tod=day${TLANG === 'en' ? '&lang=en' : ''}`
    : `http://127.0.0.1:4174${extraPaths[p.key][TLANG]}?tod=day`;

async function hoverSignature(page: Page): Promise<string> {
  await page.addStyleTag({ content: '*{transition:none !important}' });
  const total = await page.locator('a, button').count();
  const lines: string[] = [];
  for (let i = 0; i < total; i++) {
    const el = page.locator('a, button').nth(i);
    const read = (): Promise<string> =>
      el.evaluate((node, props) => {
        const cs = getComputedStyle(node) as unknown as Record<string, string>;
        return props.map((p) => cs[p]).join('|');
      }, PROPS);
    const before = await read();
    await el.hover();
    await page.waitForTimeout(40);
    const after = await read();
    lines.push(`${(await el.getAttribute('aria-label')) ?? ''} ${before === after ? '-' : after}`);
    await page.mouse.move(0, 0);
  }
  return lines.join(' ; ');
}

const out: Record<Side, Record<string, string>> = { actual: {}, candidato: {} };
const servers = await startServers();
const browser = await chromium.launch();
for (const side of ['actual', 'candidato'] as Side[]) {
  for (const p of PAGES) {
    for (const width of [375, 820, 1440]) {
      const id = `${p.key} ${width}`;
      const { page, errors } = await open(browser, urlOf(side, p), { width, reduced: false });
      out[side][`${id} enlaces`] = (
        await page.evaluate(() =>
          [...document.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? ''),
        )
      )
        .map((h) => normalizeHref(h))
        .join(' ');
      out[side][`${id} hover`] = await hoverSignature(page);
      if (p.key === 'offline' && width === 1440) {
        const spin = (): Promise<string> =>
          page.evaluate(() => {
            const b = document.querySelector('button');
            return b ? getComputedStyle(b).animationName : '';
          });
        out[side][`${id} reposo`] = await spin();
        await page.getByRole('button').click();
        await page.waitForTimeout(300);
        out[side][`${id} reintentando`] = await spin();
        await page.waitForTimeout(1200);
        out[side][`${id} tras reintento`] = await spin();
        // Vuelta a línea: mensaje nuevo y recarga a los 900 ms.
        let reloads = 0;
        page.on('load', () => reloads++);
        await page.evaluate(() => window.dispatchEvent(new Event('online')));
        await page.waitForTimeout(300);
        out[side][`${id} mensaje en línea`] = await page.evaluate(
          () => document.querySelector('main p')?.textContent?.trim() ?? '',
        );
        await page.waitForTimeout(3000);
        out[side][`${id} recargas`] = String(reloads);
      }
      // Las imágenes del 404 y Offline no existen en site/uploads (ni en el sitio actual): esos 404 de recursos
      // no se comparan; solo errores de script.
      const real = errors.filter((e) => !e.startsWith('console: Failed to load resource'));
      out[side][`${id} errores`] = real.join(' | ') || 'ninguno';
      await page.close();
    }
  }
}
await browser.close();
servers.stop();
let bad = 0;
const diffs: Record<Side, Record<string, string>> = { actual: {}, candidato: {} };
for (const k of Object.keys(out.actual)) {
  if (out.actual[k] !== out.candidato[k]) {
    bad++;
    diffs.actual[k] = out.actual[k] ?? '';
    diffs.candidato[k] = out.candidato[k] ?? '';
  }
}
if (bad) report(diffs);
console.log(`comprobaciones: ${Object.keys(out.actual).length} | difieren: ${bad}`);
process.exit(bad ? 1 : 0);
