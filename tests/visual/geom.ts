// Uso: SITE_DIR=<site/> node tests/visual/geom.ts <PáginaActual> <ruta-astro> <ancho> [selector]
// Imprime las diferencias de geometría (getBoundingClientRect) entre el sitio actual y el candidato.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { chromium, type Page } from '@playwright/test';
import { serveStatic } from './serve.ts';

const [pageName, astroPath, widthArg, selector = '#nav *'] = process.argv.slice(2);
const siteDir = process.env.SITE_DIR;
if (!pageName || !astroPath || !widthArg || !siteDir)
  throw new Error('Uso: geom.ts <Pagina> <ruta> <ancho> [selector]');
const reactDir = resolve(siteDir, '../harness/artifact-type/compat');
const fontRoot = resolve('node_modules/@fontsource');
const FONT_FILES = [
  'inter-tight/400.css',
  'inter-tight/500.css',
  'inter-tight/600.css',
  'instrument-serif/400-italic.css',
];
const css = (
  await Promise.all(
    FONT_FILES.map(async (f) =>
      (await readFile(join(fontRoot, f), 'utf8')).replace(
        /url\(\.\/files\/([^)]+)\)/g,
        'url(https://fonts.gstatic.com/local/$1)',
      ),
    ),
  )
).join('\n');

async function prep(page: Page): Promise<void> {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, async (route) => {
    const url = route.request().url();
    if (/unpkg\.com\/react@/.test(url))
      return route.fulfill({
        contentType: 'text/javascript',
        body: await readFile(join(reactDir, 'react.production.min.js')),
      });
    if (/unpkg\.com\/react-dom@/.test(url))
      return route.fulfill({
        contentType: 'text/javascript',
        body: await readFile(join(reactDir, 'react-dom.production.min.js')),
      });
    if (/fonts\.googleapis\.com/.test(url))
      return route.fulfill({ contentType: 'text/css', body: css });
    const m = url.match(/fonts\.gstatic\.com\/local\/(.+)$/);
    if (m?.[1])
      for (const pkg of ['inter-tight', 'instrument-serif']) {
        const p = join(fontRoot, pkg, 'files', m[1]);
        if (existsSync(p))
          return route.fulfill({ contentType: 'font/woff2', body: await readFile(p) });
      }
    return route.abort();
  });
}
const rects = (page: Page, sel: string) =>
  page.evaluate(
    (s) =>
      [...document.querySelectorAll(s)]
        .filter((e) => e.getClientRects().length > 0)
        .map((e, i) => {
          const r = e.getBoundingClientRect();
          return {
            i,
            tag:
              e.tagName.toLowerCase() +
              (e.id ? '#' + e.id : '') +
              (typeof e.className === 'string' && e.className
                ? '.' + e.className.trim().split(/\s+/)[0]
                : ''),
            x: +r.x.toFixed(2),
            y: +r.y.toFixed(2),
            w: +r.width.toFixed(2),
            h: +r.height.toFixed(2),
          };
        }),
    sel,
  );

const s1 = await serveStatic(resolve(siteDir), 4173);
const s2 = await serveStatic(resolve('dist'), 4174);
const browser = await chromium.launch();
const open = async (url: string): Promise<Page> => {
  const ctx = await browser.newContext({
    viewport: { width: Number(widthArg), height: 900 },
    reducedMotion: 'no-preference',
  });
  const page = await ctx.newPage();
  await prep(page);
  await page.clock.setFixedTime(new Date('2026-11-02T10:00:00-05:00'));
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(3000);
  return page;
};
const vars = (p: Page) =>
  p.evaluate(() => {
    const n = document.getElementById('nav');
    return n
      ? ['--wn', '--wl', '--wi', '--cw']
          .map((k) => k + '=' + n.style.getPropertyValue(k))
          .join(' ') +
          ' | nav.className=' +
          n.className
      : '';
  });
const pa = await open(`http://127.0.0.1:4173/${encodeURIComponent(pageName)}.dc.html?tod=day`);
const pb = await open(`http://127.0.0.1:4174${astroPath}?tod=day`);
const fnt = (p: Page) =>
  p.evaluate(() => {
    const e = document.querySelector('.nv-name');
    if (!e) return 'sin .nv-name';
    const c = getComputedStyle(e);
    return [
      c.fontFamily,
      c.fontSize,
      c.fontWeight,
      c.letterSpacing,
      c.fontStretch,
      c.fontVariationSettings,
      c.fontKerning,
      c.textRendering,
      c.maxWidth,
      c.marginLeft,
      e.scrollWidth,
    ].join(' | ');
  });
console.log('fuente actual   :', await fnt(pa));
console.log('fuente candidato:', await fnt(pb));
console.log('actual   :', await vars(pa));
console.log('candidato:', await vars(pb));
const a = await rects(
  await open(`http://127.0.0.1:4173/${encodeURIComponent(pageName)}.dc.html?tod=day`),
  selector,
);
const b = await rects(await open(`http://127.0.0.1:4174${astroPath}?tod=day`), selector);
console.log(`elementos: actual ${a.length} | candidato ${b.length}`);
let shown = 0;
for (let i = 0; i < Math.min(a.length, b.length); i++) {
  const p = a[i];
  const q = b[i];
  if (!p || !q) continue;
  const d = [q.x - p.x, q.y - p.y, q.w - p.w, q.h - p.h].map((v) => +v.toFixed(2));
  if (d.some((v) => Math.abs(v) > 0.01) && shown++ < 25)
    console.log(
      `#${i} ${p.tag} vs ${q.tag} | actual (${p.x},${p.y},${p.w},${p.h}) | delta x,y,w,h = ${d.join(', ')}`,
    );
}
console.log(`diferentes: ${shown}`);
await browser.close();
s1.close();
s2.close();
