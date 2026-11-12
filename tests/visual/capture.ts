// Uso: node tests/visual/capture.ts <current|astro> <carpeta-salida> [--only=<regex>] [--workers=3] [--matrix=shared] [--align=<carpeta-base>]
//   current: sirve el sitio actual (SITE_DIR=ruta a site/) y captura las 138 combinaciones.
//   astro:   sirve ./dist (después de `npm run build`).
// Determinismo: React local (sin unpkg), fuentes locales idénticas en ambos lados, reloj fijo,
// red externa bloqueada, animaciones desactivadas en la captura.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { chromium, type Browser, type Page } from '@playwright/test';
import { buildMatrix, buildSharedMatrix, type Shot } from './matrix.ts';
import { serveStatic } from './serve.ts';
import { extraPaths, type ExtraKey } from '../../src/data/extra-pages.ts';
import { pathFor, type PageKey } from '../../src/i18n/routes.ts';

type Target = 'current' | 'astro';

const FONT_FILES = [
  'inter-tight/400.css',
  'inter-tight/500.css',
  'inter-tight/600.css',
  'instrument-serif/400-italic.css',
];
const FONTSOURCE = resolve('node_modules/@fontsource');
const PORT = 4173;

async function fontCss(): Promise<string> {
  const parts = await Promise.all(
    FONT_FILES.map(async (f) => {
      const css = await readFile(join(FONTSOURCE, f), 'utf8');
      return css.replace(/url\(\.\/files\/([^)]+)\)/g, 'url(https://fonts.gstatic.com/local/$1)');
    }),
  );
  return parts.join('\n');
}

async function fontFile(name: string): Promise<Buffer | null> {
  for (const pkg of ['inter-tight', 'instrument-serif']) {
    const p = join(FONTSOURCE, pkg, 'files', name);
    if (existsSync(p)) return readFile(p);
  }
  return null;
}

function urlFor(target: Target, shot: Shot): string {
  const tod = `tod=${shot.tod}`;
  if (target === 'current') {
    const lang = shot.lang === 'en' ? '&lang=en' : '';
    return `http://127.0.0.1:${PORT}/${encodeURIComponent(shot.page.current)}.dc.html?${tod}${lang}`;
  }
  const path =
    shot.page.key in extraPaths
      ? extraPaths[shot.page.key as ExtraKey][shot.lang]
      : pathFor(shot.page.key as PageKey, shot.lang);
  return `http://127.0.0.1:${PORT}${path}?${tod}`;
}

async function setupRoutes(page: Page, reactDir: string, css: string): Promise<void> {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, async (route) => {
    const url = route.request().url();
    if (/unpkg\.com\/react@/.test(url)) {
      return route.fulfill({
        contentType: 'text/javascript',
        body: await readFile(join(reactDir, 'react.production.min.js')),
      });
    }
    if (/unpkg\.com\/react-dom@/.test(url)) {
      return route.fulfill({
        contentType: 'text/javascript',
        body: await readFile(join(reactDir, 'react-dom.production.min.js')),
      });
    }
    if (/fonts\.googleapis\.com/.test(url))
      return route.fulfill({ contentType: 'text/css', body: css });
    const m = url.match(/fonts\.gstatic\.com\/local\/(.+)$/);
    if (m?.[1]) {
      const body = await fontFile(m[1]);
      if (body) return route.fulfill({ contentType: 'font/woff2', body });
    }
    return route.abort();
  });
}

async function captureOne(
  browser: Browser,
  target: Target,
  shot: Shot,
  outDir: string,
  reactDir: string,
  css: string,
  alignDir: string | null,
): Promise<void> {
  const context = await browser.newContext({
    viewport: { width: shot.width, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: shot.mode === 'layout' || shot.mode === 'footerel' ? 'reduce' : 'no-preference',
    locale: shot.lang === 'en' ? 'en-US' : 'es-CO',
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message.slice(0, 160)}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && /^http:\/\/127\.0\.0\.1/.test(m.location().url))
      errors.push(`console: ${m.text().slice(0, 160)}`);
  });
  await setupRoutes(page, reactDir, css);
  await page.clock.setFixedTime(new Date('2026-11-02T10:00:00-05:00'));
  const url = urlFor(target, shot);
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(shot.mode === 'hero' || shot.mode === 'heroel' ? 3000 : 2500);
  // El menú mide el ancho de sus textos y `document.fonts.ready` puede resolverse antes de que lleguen las
  // fuentes: en el sitio actual el valor depende de la carrera de carga. Se fuerza un nuevo cálculo con las
  // fuentes ya cargadas para que ambos lados se comparen en el mismo estado asentado.
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await page.waitForTimeout(500);

  if (shot.mode === 'layout' || shot.mode === 'footerel') {
    // Recorre la página para activar los revelados por scroll y vuelve arriba.
    await page.evaluate(async () => {
      const total = document.documentElement.scrollHeight;
      for (let y = 0; y < total; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 70));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(900);
  }

  const scope = shot.mode === 'heroel' ? '#hero' : shot.mode === 'footerel' ? 'footer' : null;
  if (alignDir && shot.mode === 'footerel') {
    // Alinea la posición vertical fraccionaria del footer con la de la línea base (el contenido que hay
    // encima en el sitio actual da un desplazamiento subpíxel distinto en cada página).
    const base = JSON.parse(await readFile(join(alignDir, `${shot.id}.json`), 'utf8')) as {
      rect?: { y: number };
    };
    if (base.rect) {
      const delta = await page.evaluate((target) => {
        const f = document.querySelector('footer');
        const sp = document.querySelector<HTMLElement>('[data-align-spacer]');
        if (!f || !sp) return 0;
        const d = target - (f.getBoundingClientRect().y + window.scrollY);
        sp.style.height = `${sp.getBoundingClientRect().height + d}px`;
        return d;
      }, base.rect.y);
      void delta;
      await page.waitForTimeout(150);
    }
  }
  if (shot.mode === 'footerel') {
    // Mide solo el footer: el contenido de la página que queda debajo de su borde superior translúcido no
    // forma parte del componente. `visibility` no altera el layout (la posición del footer no cambia).
    await page.evaluate(() => {
      const footer = document.querySelector('footer');
      // El menú es fijo: según el desplazamiento de cada página se superpondría al footer.
      ['nav', 'spbar'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.visibility = 'hidden';
      });
      [...(footer?.parentElement?.children ?? [])].forEach((el) => {
        if (el !== footer) (el as HTMLElement).style.visibility = 'hidden';
      });
    });
  }
  const data = await page.evaluate((sel) => {
    const root = sel ? (document.querySelector(sel) as HTMLElement | null) : document.body;
    return {
      text: root?.innerText ?? '',
      links: [...(root ?? document).querySelectorAll('a[href]')].map(
        (a) => a.getAttribute('href') ?? '',
      ),
      height: document.documentElement.scrollHeight,
      lang: document.documentElement.lang,
      rect: root
        ? (() => {
            const r = root.getBoundingClientRect();
            return { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height };
          })()
        : null,
    };
  }, scope);
  const shotOptions = {
    path: join(outDir, `${shot.id}.png`),
    animations: 'disabled' as const,
    caret: 'hide' as const,
    scale: 'css' as const,
  };
  if (shot.mode === 'footerel' && data.rect) {
    // Recorte en coordenadas de documento: no depende del desplazamiento con el que se captura el elemento.
    const y0 = Math.floor(data.rect.y);
    await page.screenshot({
      ...shotOptions,
      fullPage: true,
      clip: {
        x: 0,
        y: y0,
        width: Math.ceil(data.rect.w),
        height: Math.ceil(data.rect.y + data.rect.h) - y0,
      },
    });
  } else if (scope) await page.locator(scope).first().screenshot(shotOptions);
  else await page.screenshot({ ...shotOptions, fullPage: shot.mode === 'layout' });
  await writeFile(
    join(outDir, `${shot.id}.json`),
    JSON.stringify({ id: shot.id, url, errors, ...data }, null, 1),
  );
  await context.close();
}

async function main(): Promise<void> {
  const [targetArg, outArg, ...rest] = process.argv.slice(2);
  if ((targetArg !== 'current' && targetArg !== 'astro') || !outArg) {
    throw new Error(
      'Uso: capture.ts <current|astro> <carpeta-salida> [--only=regex] [--workers=n]',
    );
  }
  const target: Target = targetArg;
  const only = rest.find((a) => a.startsWith('--only='))?.slice(7);
  const alignArg = rest.find((a) => a.startsWith('--align='))?.slice(8);
  const alignDir = alignArg ? resolve(alignArg) : null;
  const workers = Number(rest.find((a) => a.startsWith('--workers='))?.slice(10) ?? 3);
  const outDir = resolve(outArg);
  await mkdir(outDir, { recursive: true });

  const siteDir = process.env.SITE_DIR;
  if (target === 'current' && !siteDir) throw new Error('Define SITE_DIR con la ruta a site/');
  const reactDir =
    process.env.REACT_DIR ?? resolve(siteDir ?? '.', '../harness/artifact-type/compat');
  const root = target === 'current' ? resolve(siteDir ?? '') : resolve('dist');
  const server = await serveStatic(root, PORT);

  const re = only ? new RegExp(only) : null;
  const shared = rest.includes('--matrix=shared');
  const shots = (shared ? buildSharedMatrix() : buildMatrix()).filter((s) =>
    re ? re.test(s.id) : true,
  );
  const css = await fontCss();
  const browser = await chromium.launch();
  const queue = [...shots];
  let done = 0;
  const failures: string[] = [];
  const worker = async (): Promise<void> => {
    for (let shot = queue.shift(); shot; shot = queue.shift()) {
      try {
        await captureOne(browser, target, shot, outDir, reactDir, css, alignDir);
      } catch (e) {
        failures.push(`${shot.id}: ${(e as Error).message.slice(0, 120)}`);
      }
      done++;
      if (done % 10 === 0 || done === shots.length) console.log(`${done}/${shots.length}`);
    }
  };
  await Promise.all(Array.from({ length: workers }, worker));
  await browser.close();
  server.close();
  console.log(`capturas: ${shots.length - failures.length}/${shots.length} -> ${outDir}`);
  if (failures.length) {
    console.log('FALLOS:\n' + failures.join('\n'));
    process.exit(1);
  }
}

await main();
