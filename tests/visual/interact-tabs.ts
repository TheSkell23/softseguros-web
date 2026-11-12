// Uso: SITE_DIR=<site/> node tests/visual/interact-tabs.ts <Pagina> <ruta-astro> <nTabs>
// Compara la isla de pestañas (Producto, Soluciones) entre el sitio actual y el candidato:
// panel visible y pestaña activa tras cada clic, tarjetas del hero, hash de la URL, animación y capturas.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { chromium, type Browser, type Page } from '@playwright/test';
import { serveStatic } from './serve.ts';
import { localPath, TLANG } from './lang.ts';

const [pageName, astroPath, nArg] = process.argv.slice(2);
const siteDir = process.env.SITE_DIR;
if (!pageName || !astroPath || !nArg || !siteDir)
  throw new Error('Uso: interact-tabs.ts <Pagina> <ruta> <nTabs>');
const nTabs = Number(nArg);
const reactDir = resolve(siteDir, '../harness/artifact-type/compat');
const fontRoot = resolve('node_modules/@fontsource');
const FONT_FILES = [
  'inter-tight/400.css',
  'inter-tight/500.css',
  'inter-tight/600.css',
  'instrument-serif/400-italic.css',
];
const fontCss = (
  await Promise.all(
    FONT_FILES.map(async (f) =>
      (await readFile(join(fontRoot, f), 'utf8')).replace(
        /url\(\.\/files\/([^)]+)\)/g,
        'url(https://fonts.gstatic.com/local/$1)',
      ),
    ),
  )
).join('\n');
type Side = 'actual' | 'candidato';
const urlOf = (side: Side, hash = ''): string =>
  side === 'actual'
    ? `http://127.0.0.1:4173/${encodeURIComponent(pageName)}.dc.html?tod=day${TLANG === 'en' ? '&lang=en' : ''}${hash}`
    : `http://127.0.0.1:4174${localPath(astroPath)}?tod=day${hash}`;

async function open(
  browser: Browser,
  side: Side,
  opts: { reduced: boolean; width: number; hash?: string },
): Promise<{ page: Page; errors: string[] }> {
  const ctx = await browser.newContext({
    viewport: { width: opts.width, height: 900 },
    reducedMotion: opts.reduced ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 100)));
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
  await page.goto(urlOf(side, opts.hash), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2600);
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await page.waitForTimeout(500);
  return { page, errors };
}

/** Pestaña activa (por su estilo) y panel visible (primer encabezado visible bajo la barra de pestañas). */
const state = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const tabs = [...document.querySelectorAll<HTMLElement>('[role="tablist"] [role="tab"]')];
    const active = tabs.findIndex((b) => getComputedStyle(b).color === 'rgb(255, 255, 255)');
    const nav = document.getElementById('productos');
    const visibleHeads = [...document.querySelectorAll<HTMLElement>('h2,h3')]
      .filter(
        (h) =>
          h.getClientRects().length > 0 &&
          nav &&
          nav.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING,
      )
      .slice(0, 3)
      .map((h) => (h.textContent ?? '').trim().slice(0, 40));
    return `activa=${active} | encabezados=${visibleHeads.join(' / ')}`;
  });

const out: Record<Side, Record<string, string>> = { actual: {}, candidato: {} };
const pageSlug = pageName.toLowerCase();
const dirs = {
  actual: resolve(`tests/visual/out/tabs-${pageSlug}-base`),
  candidato: resolve(`tests/visual/out/tabs-${pageSlug}-cand`),
};
await mkdir(dirs.actual, { recursive: true });
await mkdir(dirs.candidato, { recursive: true });

const s1 = await serveStatic(resolve(siteDir), 4173);
const s2 = await serveStatic(resolve('dist'), 4174);
const browser = await chromium.launch();
for (const side of ['actual', 'candidato'] as Side[]) {
  const o = out[side];
  // 1) Clic en cada pestaña (sin movimiento, para poder comparar píxeles)
  for (const width of [375, 820, 1440]) {
    const { page, errors } = await open(browser, side, { reduced: true, width });
    o[`errores ${width}`] = errors.join(' | ') || 'ninguno';
    o[`inicio ${width}`] = await state(page);
    for (let i = 0; i < nTabs; i++) {
      await page.locator('[role="tablist"] [role="tab"]').nth(i).click();
      await page.waitForTimeout(600);
      o[`tab ${i} ${width}`] = await state(page);
      await page.evaluate(async () => {
        const total = document.documentElement.scrollHeight;
        for (let y = 0; y < total; y += 400) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 70));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(900);
      const id = `tab${i}__${width}`;
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
    }
    await page.close();
  }
  // 2) Tarjetas del hero (clic) y enlace interno entre paneles: pestaña y desplazamiento
  {
    const { page } = await open(browser, side, { reduced: true, width: 1440 });
    const cards = page.locator('#hero a[href="#productos"]');
    const n = await cards.count();
    o['tarjetas del hero'] = String(n);
    for (let i = 0; i < n; i++) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      await cards.nth(i).click();
      await page.waitForTimeout(1500);
      o[`hero ${i}`] =
        `${await state(page)} | scrollY=${Math.round(await page.evaluate(() => window.scrollY))}`;
    }
  }
  // 3) Hash en la URL
  const hashes =
    pageName === 'Producto'
      ? ['#crm', '#sincronizador', '#integraciones']
      : ['#comercial', '#multicotizador'];
  for (const h of hashes) {
    const { page } = await open(browser, side, { reduced: true, width: 1440, hash: h });
    await page.waitForTimeout(1200);
    o[`hash ${h}`] =
      `${await state(page)} | scrollY=${Math.round(await page.evaluate(() => window.scrollY))}`;
  }
  // 4) Animación del panel nuevo (con movimiento)
  {
    const { page } = await open(browser, side, { reduced: false, width: 1440 });
    const before = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((a) => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition)).length,
    );
    await page.locator('[role="tablist"] [role="tab"]').nth(1).click();
    await page.waitForTimeout(100);
    o.animacion = `animaciones WAAPI antes=${before} tras clic=${await page.evaluate(() => document.getAnimations().filter((a) => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition)).length)}`;
  }
}
await browser.close();
s1.close();
s2.close();

let bad = 0;
for (const k of Object.keys(out.actual)) {
  const a = out.actual[k] ?? '';
  const c = out.candidato[k] ?? '';
  const ok = a === c;
  if (!ok) bad++;
  console.log(
    `${ok ? 'OK      ' : 'DIFIERE '}${k}${ok ? '' : `\n   actual   : ${a}\n   candidato: ${c}`}`,
  );
}
console.log(`\ncomprobaciones: ${Object.keys(out.actual).length} | difieren: ${bad}`);
process.exit(bad === 0 ? 0 : 1);
