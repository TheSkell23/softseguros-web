// Uso: SITE_DIR=<site/> node tests/visual/interact-conoce.ts
// Conoce: reproductor de video, preguntas frecuentes (details), anclas del hero, enlaces y consola.
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import process from 'node:process';
import type { Page } from '@playwright/test';
import {
  chromium,
  normalizeHref,
  open,
  pageUrl,
  report,
  SIDES,
  startServers,
  type Side,
} from './lib.ts';

const out: Record<Side, Record<string, string>> = { actual: {}, candidato: {} };
const dirs: Record<Side, string> = {
  actual: resolve('tests/visual/out/conoce-int-base'),
  candidato: resolve('tests/visual/out/conoce-int-cand'),
};
for (const d of Object.values(dirs)) await mkdir(d, { recursive: true });
const servers = await startServers();
const browser = await chromium.launch();

const states = (p: Page): Promise<string> =>
  p.evaluate(() =>
    [...document.querySelectorAll('details')].map((d) => (d.open ? '1' : '0')).join(''),
  );

for (const side of SIDES) {
  const o = out[side];
  const url = (hash = ''): string => pageUrl(side, 'Conoce', '/es/conoce-softseguros/', hash);
  for (const width of [1440, 820, 375]) {
    const { page, errors, requests } = await open(browser, url(), { width });
    const tag = `${width}px `;
    o[`${tag}errores de consola`] = errors.join(' | ') || 'ninguno';
    o[`${tag}enlaces`] = (
      await page.evaluate(() =>
        [...document.querySelectorAll('a[href]:not([hreflang])')].map(
          (a) => a.getAttribute('href') ?? '',
        ),
      )
    )
      .map(normalizeHref)
      .join(' ');
    o[`${tag}video antes`] = await page.evaluate(
      () =>
        `play=${document.querySelectorAll('.cs-play').length} iframes=${document.querySelectorAll('iframe').length} id=${document.querySelector<HTMLElement>('.cs-vid')?.dataset.id}`,
    );
    // Preguntas frecuentes
    o[`${tag}faq inicial`] = await states(page);
    const sums = page.locator('details > summary');
    o[`${tag}faq nº`] = String(await sums.count());
    await sums.nth(0).scrollIntoViewIfNeeded();
    await sums.nth(0).click();
    await page.waitForTimeout(400);
    o[`${tag}faq tras abrir 1`] = await states(page);
    await sums.nth(2).click();
    await page.waitForTimeout(400);
    o[`${tag}faq tras abrir 3`] = await states(page);
    const id = `faq-abiertas__${width}`;
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
        errors: [],
        height: 0,
      }),
    );
    await sums.nth(0).click();
    await page.waitForTimeout(400);
    o[`${tag}faq tras cerrar 1`] = await states(page);
    // Reproductor
    await page.locator('.cs-play').scrollIntoViewIfNeeded();
    await page.locator('.cs-play').click();
    await page.waitForTimeout(600);
    o[`${tag}video tras clic`] = await page.evaluate(() => {
      const f = document.querySelector('iframe');
      const wrap = document.querySelector('.cs-vid');
      return f
        ? `iframes=${document.querySelectorAll('iframe').length} src=${f.src} title=${f.title} allow=${f.allow} fullscreen=${f.allowFullscreen} referrer=${f.referrerPolicy} primerHijo=${wrap?.firstElementChild?.tagName} play=${document.querySelectorAll('.cs-play').length}`
        : 'sin iframe';
    });
    o[`${tag}video peticiones`] =
      requests
        .filter((r) => /youtube/.test(r))
        .map((r) => r.slice(0, 90))
        .join(' | ') || 'ninguna';
    await page.close();
  }
  // Anclas del hero (escritorio)
  {
    const { page } = await open(browser, url(), { width: 1440 });
    const anchors = page.locator('#hero a[href^="#"]');
    const n = await anchors.count();
    o['hero anclas'] = String(n);
    for (let i = 0; i < n; i++) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      const href = await anchors.nth(i).getAttribute('href');
      await anchors.nth(i).click();
      await page.waitForTimeout(1500);
      o[`hero ancla ${i} ${href}`] =
        `scrollY=${Math.round(await page.evaluate(() => window.scrollY))}`;
    }
    for (const h of ['#video', '#faq']) {
      const { page: p2 } = await open(browser, url(h), { width: 1440 });
      await p2.waitForTimeout(800);
      o[`carga con ${h}`] = `scrollY=${Math.round(await p2.evaluate(() => window.scrollY))}`;
      await p2.close();
    }
    await page.close();
  }
}
await browser.close();
servers.stop();
// Por diseño: Astro es HTML estático y salta al ancla al cargar; el sitio actual renderiza después de la carga y no salta.
const bad = report(out, new Set(['carga con #video', 'carga con #faq']));
process.exit(bad === 0 ? 0 : 1);
