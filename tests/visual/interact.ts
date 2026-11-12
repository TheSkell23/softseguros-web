// Uso: SITE_DIR=<site/> node tests/visual/interact.ts
// Comprueba el comportamiento compartido (menú, desplegables, menú móvil, horario del hero, enlaces, consola)
// en el sitio actual y en el candidato (dist/), con las mismas acciones.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { chromium, type Page } from '@playwright/test';
import { pathFor, type PageKey } from '../../src/i18n/routes.ts';
import { localPath, TLANG } from './lang.ts';
import { serveStatic } from './serve.ts';

const siteDir = process.env.SITE_DIR;
if (!siteDir) throw new Error('Define SITE_DIR con la ruta a site/');
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

const FILE_TO_KEY: Record<string, PageKey> = {
  'Softseguros.dc.html': 'inicio',
  'Producto.dc.html': 'producto',
  'Soluciones.dc.html': 'soluciones',
  'Precios.dc.html': 'precios',
  'Contacto.dc.html': 'contacto',
  'FAQ.dc.html': 'faq',
  'Prueba.dc.html': 'prueba',
  'Blog.dc.html': 'blog',
  'Ayuda.dc.html': 'ayuda',
  'Conoce.dc.html': 'conoce',
  'Terminos.dc.html': 'terminos',
  'Privacidad.dc.html': 'privacidad',
};
/** Normaliza un enlace del sitio actual a su equivalente en el candidato. */
const normalize = (href: string): string => {
  const m = href.match(/^([A-Za-z]+\.dc\.html)(#.*)?$/);
  const key = m?.[1] ? FILE_TO_KEY[m[1]] : undefined;
  return key ? pathFor(key, TLANG) + (m?.[2] ?? '') : href;
};

type Side = 'actual' | 'candidato';
const urlOf = (side: Side, tod = 'day'): string =>
  side === 'actual'
    ? `http://127.0.0.1:4173/Producto.dc.html?tod=${tod}${TLANG === 'en' ? '&lang=en' : ''}`
    : `http://127.0.0.1:4174${localPath('/es/producto/')}?tod=${tod}`;

async function open(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  side: Side,
  width: number,
  opts: { tod?: string; time?: string } = {},
): Promise<{ page: Page; errors: string[] }> {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: 'no-preference',
  });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message.slice(0, 120)}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && /127\.0\.0\.1/.test(m.location().url))
      errors.push(`console: ${m.text().slice(0, 120)}`);
  });
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
      return route.fulfill({ contentType: 'text/css', body: fontCss });
    const m = url.match(/fonts\.gstatic\.com\/local\/(.+)$/);
    if (m?.[1]) {
      for (const pkg of ['inter-tight', 'instrument-serif']) {
        const p = join(fontRoot, pkg, 'files', m[1]);
        if (existsSync(p))
          return route.fulfill({ contentType: 'font/woff2', body: await readFile(p) });
      }
    }
    return route.abort();
  });
  if (opts.time) await page.clock.setFixedTime(new Date(opts.time));
  await page.goto(
    urlOf(side, opts.tod ?? 'day').replace(
      /\?tod=[^&]*/,
      // 'auto' = horario real (sin ?tod); el idioma del sitio actual (&lang=en) se conserva.
      opts.tod === 'auto' ? '?' : `?tod=${opts.tod ?? 'day'}`,
    ),
    { waitUntil: 'load' },
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500);
  return { page, errors };
}

const results: { name: string; actual: string; candidato: string; ok: boolean }[] = [];

const s1 = await serveStatic(resolve(siteDir), 4173);
const s2 = await serveStatic(resolve('dist'), 4174);
const browser = await chromium.launch();

for (const side of ['actual', 'candidato'] as Side[]) {
  const out: Record<string, string> = {};

  // 1) Menú compacto al hacer scroll (escritorio)
  {
    const { page, errors } = await open(browser, side, 1440);
    out.errores = errors.length ? errors.join(' | ') : 'ninguno';
    out.menuInicio = await page.evaluate(() =>
      document.getElementById('nav')?.classList.contains('scrolled') ? 'compacto' : 'completo',
    );
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    out.menuTrasScroll = await page.evaluate(() =>
      document.getElementById('nav')?.classList.contains('scrolled') ? 'compacto' : 'completo',
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    out.menuVuelveArriba = await page.evaluate(() =>
      document.getElementById('nav')?.classList.contains('scrolled') ? 'compacto' : 'completo',
    );
    // 2) Desplegable al pasar el ratón por "Producto"
    await page.hover('.nv-menu .dd:nth-of-type(1) > a');
    await page.waitForFunction(
      () => {
        const menu = document.querySelector('.nv-menu .dd .dd-p');
        return menu && Number(getComputedStyle(menu).opacity) > 0.9;
      },
      undefined,
      { timeout: 2500 },
    );
    out.desplegable = await page.evaluate(() => {
      const dd = document.querySelector('.nv-menu .dd .dd-p');
      if (!dd) return 'sin .dd-p';
      const cs = getComputedStyle(dd);
      return `${cs.visibility}/${Number(cs.opacity) > 0.9 ? 'visible' : 'transparente'} | ${[...dd.querySelectorAll('a')].map((a) => (a.textContent ?? '').trim()).join(', ')}`;
    });
    out.enlacesMenu = (
      await page.evaluate(() =>
        [...document.querySelectorAll('#nav a:not([hreflang])')].map(
          (a) => a.getAttribute('href') ?? '',
        ),
      )
    )
      .map(normalize)
      .join(' ');
    // Selector de idioma: el actual son <span>; el candidato son enlaces reales a la misma página en el otro idioma.
    out.selectorIdioma = await page.evaluate(() =>
      [...document.querySelectorAll('#nav .lang > *')]
        .map((e) => `${e.tagName.toLowerCase()}:${(e.textContent ?? '').trim()}`)
        .join(' '),
    );
    out.enlacesFooter = (
      await page.evaluate(() =>
        [...document.querySelectorAll('footer a')].map((a) => a.getAttribute('href') ?? ''),
      )
    )
      .map(normalize)
      .join(' ');
  }

  // 3) Menú móvil
  {
    const { page } = await open(browser, side, 375);
    out.mbtnVisible = await page.evaluate(() => {
      const b = document.getElementById('mbtn');
      return b ? String(getComputedStyle(b).display !== 'none') : 'sin botón';
    });
    await page.click('#mbtn');
    await page.waitForTimeout(700);
    out.movilAbierto = await page.evaluate(
      () =>
        `${document.getElementById('nav')?.classList.contains('mo')} | aria-expanded=${document.getElementById('mbtn')?.getAttribute('aria-expanded')} | enlaces=${document.querySelectorAll('#mm a').length}`,
    );
    out.movilTextos = await page.evaluate(() =>
      [...document.querySelectorAll('#mm a')]
        .map((a) => `${(a.textContent ?? '').trim()}>${a.getAttribute('href')}`)
        .join(' ; '),
    );
    out.movilTextos = out.movilTextos
      .split(' ; ')
      .map((s) => {
        const [txt, ...h] = s.split('>');
        return `${txt}>${normalize(h.join('>'))}`;
      })
      .join(' ; ');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    out.movilCerrado = await page.evaluate(
      () => `${document.getElementById('nav')?.classList.contains('mo')}`,
    );
  }

  // 4) Hero por horario (reloj fijo, sin ?tod=)
  for (const [label, time] of [
    ['10:00', '2026-11-02T10:00:00-05:00'],
    ['17:30', '2026-11-02T17:30:00-05:00'],
    ['22:00', '2026-11-02T22:00:00-05:00'],
    ['06:59', '2026-11-02T06:59:00-05:00'],
    ['19:00', '2026-11-02T19:00:00-05:00'],
  ] as const) {
    const { page } = await open(browser, side, 1440, { tod: 'auto', time });
    out[`horario ${label}`] = await page.evaluate(
      () => document.getElementById('hero')?.getAttribute('data-tod') ?? 'sin data-tod',
    );
  }

  for (const [k, v] of Object.entries(out)) {
    const prev = results.find((r) => r.name === k);
    if (prev) {
      prev.candidato = v;
      prev.ok = prev.actual === v;
    } else results.push({ name: k, actual: v, candidato: '', ok: false });
  }
}
await browser.close();
s1.close();
s2.close();

// Diferencias por diseño (no cuentan como fallo): el selector de idioma pasa de <span> a enlaces reales.
const EXPECTED = new Set(['selectorIdioma']);
let bad = 0;
for (const r of results) {
  const expected = !r.ok && EXPECTED.has(r.name);
  if (!r.ok && !expected) bad++;
  const label = r.ok ? 'OK       ' : expected ? 'ESPERADO ' : 'DIFIERE  ';
  console.log(
    `${label}${r.name}${r.ok ? '' : `\n   actual   : ${r.actual.slice(0, 300)}\n   candidato: ${r.candidato.slice(0, 300)}`}`,
  );
}
console.log(`\ncomprobaciones: ${results.length} | difieren: ${bad}`);
process.exit(bad === 0 ? 0 : 1);
