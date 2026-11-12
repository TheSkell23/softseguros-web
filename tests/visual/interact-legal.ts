// Uso: SITE_DIR=<site/> node tests/visual/interact-legal.ts <Pagina> <ruta-astro> <clave> <primerDoc> <ultimoDoc>
// Términos y Privacidad: acordeones (details), índice lateral, anclas #d-N, marca del documento actual, enlaces,
// consola y texto COMPLETO de cada documento (abiertos todos), con huellas de 50 palabras.
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

const [pageName, astroPath, key, firstArg, lastArg] = process.argv.slice(2);
if (!pageName || !astroPath || !key || !firstArg || !lastArg)
  throw new Error('Uso: interact-legal.ts <Pagina> <ruta> <clave> <primerDoc> <ultimoDoc>');
const first = Number(firstArg);
const last = Number(lastArg);
const out: Record<Side, Record<string, string>> = { actual: {}, candidato: {} };
const dirs: Record<Side, string> = {
  actual: resolve(`tests/visual/out/legal-${key}-base`),
  candidato: resolve(`tests/visual/out/legal-${key}-cand`),
};
for (const d of Object.values(dirs)) await mkdir(d, { recursive: true });
const servers = await startServers();
const browser = await chromium.launch();

const states = (p: Page): Promise<string> =>
  p.evaluate(() =>
    [...document.querySelectorAll('details.lg-d')]
      .map((d) => (d.hasAttribute('open') ? '1' : '0'))
      .join(''),
  );
const tocOpen = (p: Page): Promise<string> =>
  p.evaluate(() => String((document.getElementById('lg-toc') as HTMLDetailsElement | null)?.open));
const scrollY = async (p: Page): Promise<number> =>
  Math.round(await p.evaluate(() => window.scrollY));
const spy = (p: Page): Promise<string> =>
  p.evaluate(() =>
    [...document.querySelectorAll('#lg-toc a.on')].map((a) => a.getAttribute('href')).join(','),
  );

for (const side of SIDES) {
  const o = out[side];
  const url = (hash = ''): string => pageUrl(side, pageName, astroPath, hash);
  for (const width of [1440, 820, 375]) {
    const tag = `${width}px `;
    const { page, errors } = await open(browser, url(), { width });
    o[`${tag}errores de consola`] = errors.join(' | ') || 'ninguno';
    o[`${tag}documentos`] = await page.evaluate(() =>
      [...document.querySelectorAll('details.lg-d')].map((d) => d.id).join(','),
    );
    o[`${tag}estado inicial`] = `${await states(page)} | índice abierto=${await tocOpen(page)}`;
    o[`${tag}enlaces del documento`] = (
      await page.evaluate(() =>
        [...document.querySelectorAll('.lg-body a[href]')].map((a) => a.getAttribute('href') ?? ''),
      )
    )
      .map(normalizeHref)
      .join(' ');
    o[`${tag}enlaces de la página`] = (
      await page.evaluate(() =>
        [...document.querySelectorAll('a[href]:not([hreflang]):not(.lg-body a)')].map(
          (a) => a.getAttribute('href') ?? '',
        ),
      )
    )
      .map(normalizeHref)
      .join(' ');
    // Clic en el índice: abre el documento, mueve el scroll y fija el ancla en la URL.
    const mid = Math.floor((first + last) / 2);
    const link = page.locator(`#lg-toc a[href="#d-${mid}"]`);
    if (width <= 900) await page.locator('#lg-toc > summary').click();
    await link.click();
    await page.waitForTimeout(2200);
    o[`${tag}clic en índice d-${mid}`] =
      `${await states(page)} | scrollY=${await scrollY(page)} | hash=${await page.evaluate(() => location.hash)} | índice abierto=${await tocOpen(page)} | marca=${await spy(page)}`;
    // Marca del documento actual al desplazarse
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    o[`${tag}marca arriba`] = await spy(page);
    // Texto completo con todos los documentos abiertos
    await page.evaluate(() =>
      document.querySelectorAll('details.lg-d').forEach((d) => d.setAttribute('open', '')),
    );
    await page.waitForTimeout(500);
    const texts = await page.evaluate(() =>
      [...document.querySelectorAll('details.lg-d')].map((d) => ({
        id: d.id,
        text: (d.querySelector('.lg-body') as HTMLElement | null)?.innerText ?? '',
        raw: (d.querySelector('.lg-body') as HTMLElement | null)?.textContent ?? '',
      })),
    );
    for (const t of texts) {
      const words = t.raw.split(/\s+/).filter(Boolean);
      o[`${tag}texto ${t.id}`] =
        `palabras=${words.length} | innerText=${t.text.replace(/\s+/g, ' ').trim().length} car.`;
    }
    const id = `abiertos__${width}`;
    await page.evaluate(() => window.scrollTo(0, 0));
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
    await page.close();
    // Ancla en la carga
    for (const h of [`#d-${first}`, `#d-${last}`]) {
      const { page: p2 } = await open(browser, url(h), { width });
      await p2.waitForTimeout(3500);
      o[`${tag}carga con ${h}`] = `${await states(p2)} | scrollY=${await scrollY(p2)}`;
      await p2.close();
    }
  }
}
await browser.close();
servers.stop();
const bad = report(out);
process.exit(bad === 0 ? 0 : 1);
