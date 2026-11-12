// Depuración: valores de --wn/--wl/--wi/--cw del menú del candidato antes y después de forzar un nuevo cálculo.
import { resolve } from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';
import { serveStatic } from './serve.ts';

const server = await serveStatic(resolve('dist'), 4174);
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto(`http://127.0.0.1:4174${process.argv[2] ?? '/es/producto/'}?tod=day`, {
  waitUntil: 'load',
});
const snap = (): Promise<string> =>
  page.evaluate(() => {
    const n = document.getElementById('nav');
    const name = document.querySelector<HTMLElement>('.nv-name');
    return `${['--wn', '--wl', '--wi', '--cw'].map((k) => `${k}=${n?.style.getPropertyValue(k)}`).join(' ')} | nv-name.scrollWidth=${name?.scrollWidth} | fuente cargada=${document.fonts.check('600 16px "Inter Tight"')} | fuentes cargadas=${[...document.fonts].filter((f) => f.status === 'loaded').length}`;
  });
await page.waitForTimeout(3000);
console.log('a los 3 s    :', await snap());
await page.evaluate(() => window.dispatchEvent(new Event('resize')));
await page.waitForTimeout(600);
console.log('tras resize  :', await snap());
await browser.close();
server.close();
