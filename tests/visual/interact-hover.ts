// Uso: SITE_DIR=<site/> node tests/visual/interact-hover.ts [clave ...]
// Compara los efectos :hover entre el sitio actual y el candidato: para cada enlace, botón y resumen visible,
// pasa el ratón por encima y registra qué propiedades calculadas cambian. Las capturas no cubren estos estados.
import process from 'node:process';
import type { Page } from '@playwright/test';
import { chromium, open, pageUrl, report, SIDES, startServers, type Side } from './lib.ts';

const PAGES: { key: string; current: string; path: string }[] = [
  { key: 'inicio', current: 'Softseguros', path: '/es/' },
  { key: 'producto', current: 'Producto', path: '/es/producto/' },
  { key: 'soluciones', current: 'Soluciones', path: '/es/soluciones/' },
  { key: 'precios', current: 'Precios', path: '/es/precios/' },
  { key: 'contacto', current: 'Contacto', path: '/es/contacto/' },
  { key: 'faq', current: 'FAQ', path: '/es/preguntas-frecuentes/' },
  { key: 'prueba', current: 'Prueba', path: '/es/prueba-gratis/' },
  { key: 'blog', current: 'Blog', path: '/es/blog/' },
  { key: 'ayuda', current: 'Ayuda', path: '/es/ayuda/' },
  { key: 'conoce', current: 'Conoce', path: '/es/conoce-softseguros/' },
  { key: 'terminos', current: 'Terminos', path: '/es/terminos/' },
  { key: 'privacidad', current: 'Privacidad', path: '/es/privacidad/' },
];
const only = process.argv.slice(2);
const pages = only.length ? PAGES.filter((p) => only.includes(p.key)) : PAGES;
const PROPS = [
  'color',
  'backgroundColor',
  'backgroundImage',
  'transform',
  'filter',
  'boxShadow',
  'textDecorationLine',
  'opacity',
  'borderTopColor',
];

async function hoverSignature(page: Page): Promise<string[]> {
  await page.addStyleTag({ content: '*{transition:none !important;animation:none !important}' });
  const total = await page.evaluate(
    () =>
      [...document.querySelectorAll<HTMLElement>('a:not([hreflang]), button, summary')].filter(
        (e) => e.getClientRects().length > 0 && e.getBoundingClientRect().width > 1,
      ).length,
  );
  const lines: string[] = [];
  for (let i = 0; i < total; i++) {
    const info = await page.evaluate(
      ([index, props]) => {
        const els = [
          ...document.querySelectorAll<HTMLElement>('a:not([hreflang]), button, summary'),
        ].filter((e) => e.getClientRects().length > 0 && e.getBoundingClientRect().width > 1);
        const el = els[index as number];
        if (!el) return null;
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        const r = el.getBoundingClientRect();
        const read = (): Record<string, string> => {
          const cs = getComputedStyle(el);
          return Object.fromEntries(
            (props as string[]).map((p) => [p, (cs as unknown as Record<string, string>)[p] ?? '']),
          );
        };
        return {
          label: `${el.tagName.toLowerCase()}:${(el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 24)}`,
          x: r.x + r.width / 2,
          y: r.y + r.height / 2,
          before: read(),
        };
      },
      [i, PROPS] as [number, string[]],
    );
    if (!info) continue;
    await page.mouse.move(info.x, info.y);
    await page.waitForTimeout(30);
    const after = await page.evaluate(
      ([index, props]) => {
        const els = [
          ...document.querySelectorAll<HTMLElement>('a:not([hreflang]), button, summary'),
        ].filter((e) => e.getClientRects().length > 0 && e.getBoundingClientRect().width > 1);
        const el = els[index as number];
        if (!el) return {};
        const cs = getComputedStyle(el);
        return Object.fromEntries(
          (props as string[]).map((p) => [p, (cs as unknown as Record<string, string>)[p] ?? '']),
        );
      },
      [i, PROPS] as [number, string[]],
    );
    const changed = PROPS.filter((p) => info.before[p] !== after[p]).map((p) => `${p}=${after[p]}`);
    lines.push(`${i} ${info.label} | ${changed.join('; ') || '-'}`);
    await page.mouse.move(0, 0);
  }
  return lines;
}

const out: Record<Side, Record<string, string>> = { actual: {}, candidato: {} };
const servers = await startServers();
const browser = await chromium.launch();
let hovered = 0;
let withEffect = 0;
for (const side of SIDES) {
  for (const p of pages) {
    const { page } = await open(browser, pageUrl(side, p.current, p.path), { width: 1440 });
    const lines = await hoverSignature(page);
    if (side === 'actual') {
      hovered += lines.length;
      withEffect += lines.filter((l) => !l.endsWith('| -')).length;
    }
    // Una entrada por elemento para localizar el que difiere.
    lines.forEach((l, i) => {
      out[side][`${p.key} #${i}`] = l.replace(/^\d+ /, '');
    });
    await page.close();
  }
}
await browser.close();
servers.stop();
console.log(`elementos recorridos (sitio actual): ${hovered} | con efecto hover: ${withEffect}`);
// Solo se muestran las diferencias; el resto cuenta como coincidencia.
const diffs: Record<Side, Record<string, string>> = { actual: {}, candidato: {} };
let same = 0;
for (const k of new Set([...Object.keys(out.actual), ...Object.keys(out.candidato)])) {
  const a = out.actual[k] ?? '(no existe)';
  const c = out.candidato[k] ?? '(no existe)';
  if (a === c) same++;
  else {
    diffs.actual[k] = a;
    diffs.candidato[k] = c;
  }
}
console.log(`coinciden: ${same}`);
const bad = Object.keys(diffs.actual).length === 0 ? 0 : report(diffs);
process.exit(bad === 0 ? 0 : 1);
