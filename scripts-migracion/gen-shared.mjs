// Uso: node scripts-migracion/gen-shared.mjs <ruta a site/>
// Genera lo compartido (CSS común, estilos de fx.js, hover, datos del hero y del menú, fragmentos de hero)
// a partir de los .dc.html del sitio actual. Solo lectura de site/.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { parse } from 'node-html-parser';
import { pathFor } from '../src/i18n/routes.ts';

const site = process.argv[2];
if (!site) throw new Error('Falta la ruta a site/');
const out = (p, s) => {
  mkdirSync(join(p, '..'), { recursive: true });
  writeFileSync(p, s);
};
const read = (f) => readFileSync(join(site, f), 'utf8');

const PAGES = {
  inicio: 'Softseguros',
  producto: 'Producto',
  soluciones: 'Soluciones',
  precios: 'Precios',
  contacto: 'Contacto',
  faq: 'FAQ',
  prueba: 'Prueba',
  blog: 'Blog',
  ayuda: 'Ayuda',
  conoce: 'Conoce',
  terminos: 'Terminos',
  privacidad: 'Privacidad',
};
const FILE_TO_KEY = Object.fromEntries(Object.entries(PAGES).map(([k, f]) => [`${f}.dc.html`, k]));
const INNER = Object.keys(PAGES).filter((k) => k !== 'inicio');
const html = Object.fromEntries(Object.entries(PAGES).map(([k, f]) => [k, read(`${f}.dc.html`)]));

// ---------- CSS ----------
const styleCss = (h) =>
  (h.match(/<style[^>]*>[\s\S]*?<\/style>/g) ?? [])
    .map((s) => s.replace(/<\/?style[^>]*>/g, ''))
    .join('\n');
function topRules(css) {
  const rules = [];
  let depth = 0;
  let cur = '';
  for (const ch of css) {
    cur += ch;
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        rules.push(cur.trim());
        cur = '';
      }
    }
  }
  return rules;
}
const ruleSets = INNER.map((k) => new Set(topRules(styleCss(html[k]))));
const common = topRules(styleCss(html.producto)).filter(
  (r) => ruleSets.every((s) => s.has(r)) && !r.startsWith('@keyframes'),
);
// Las rutas de imágenes pasan a absolutas y el selector por href literal pasa a un atributo estable
// (el href cambia con el idioma y la ruta nueva).
const fixUrls = (s) =>
  s
    .replace(/url\((['"]?)uploads\//g, 'url($1/uploads/')
    .replace(/\[href=(['"])Prueba\.dc\.html\1\]/g, '[data-cta="trial"]');
out(
  'src/styles/inner.css',
  `/* GENERADO por scripts-migracion/gen-shared.mjs: reglas idénticas en las 11 páginas internas de site/, en el orden de Producto\n   (sin @keyframes, que van en keyframes.css). Sin capa (@layer): igual que el CSS original. */\n${fixUrls(common.join('\n'))}\n`,
);
console.log(`inner.css: ${common.length} reglas (comunes a las 11 páginas internas)`);

// ---------- fx.js: CSS ----------
const fx = read('fx.js');
const inner = fx.slice(fx.indexOf('var css=[') + 9, fx.indexOf("].join('\\n');"));
const fxCss = new Function('EASE', `return [${inner}].join("\\n")`)('cubic-bezier(.2,.7,.2,1)');
out(
  'src/styles/fx.css',
  `/* GENERADO desde site/fx.js (hoja que inyectaba el script). */\n${fxCss}\n`,
);

// ---------- runtime.css (hoja que inyecta support.js) ----------
out(
  'src/styles/runtime.css',
  `/* Equivalente a lo que inyecta support.js en el documento. */\nhtml,body{height:100%;margin:0}#dc-root,#dc-root>.sc-host{height:100%}\n`,
);

// ---------- hover / active ----------
const pseudo = new Map(); // "hover|decls" -> clase
const pseudoCss = [];
function pseudoClass(kind, decls) {
  const key = `${kind}|${decls}`;
  if (!pseudo.has(key)) {
    const cls = `${kind === 'hover' ? 'hv' : 'ac'}${pseudo.size + 1}`;
    pseudo.set(key, cls);
    const important = decls
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => (/!\s*important$/i.test(d) ? d : `${d} !important`))
      .join(';');
    pseudoCss.push(`.${cls}:${kind}{${important}}`);
  }
  return pseudo.get(key);
}

// ---------- transformación de fragmentos ----------
function addClass(el, cls) {
  const cur = el.getAttribute('class');
  el.setAttribute('class', cur ? `${cur} ${cls}` : cls);
}
function transform(root) {
  for (const el of root.querySelectorAll('*')) {
    for (const kind of ['hover', 'active']) {
      const v = el.getAttribute(`style-${kind}`);
      if (v !== undefined) {
        addClass(el, pseudoClass(kind, v));
        el.removeAttribute(`style-${kind}`);
      }
    }
    for (const a of ['hint-placeholder-count', 'hint-placeholder-val']) el.removeAttribute(a);
    for (const [name, value] of Object.entries(el.attributes)) {
      let v = value;
      if (/^uploads\//.test(v)) v = `/${v}`;
      v = v.replace(/url\((['"]?)uploads\//g, 'url($1/uploads/');
      const m = v.match(/^([A-Za-z]+\.dc\.html)(#.*)?$/);
      if (name === 'href' && m && FILE_TO_KEY[m[1]]) v = `__L:${FILE_TO_KEY[m[1]]}${m[2] ?? ''}__`;
      if (v !== value) el.setAttribute(name, v);
    }
  }
  return root;
}
// node-html-parser serializa alt="" como alt (atributo booleano): se restituye el valor vacío.
const ser = (el) => el.outerHTML.replace(/ alt(?=[ />])/g, ' alt=""');
const linkExpr = (s) =>
  s.replace(/href="__L:([a-z]+)(#[^"_]*)?__"/g, (_, k, h) => `href={link("${k}", "${h ?? ''}")}`);

const dom = (k) => parse(html[k], { comment: false });

// ---------- datos del hero (estrellas y motas) ----------
const heroOf = (k) => dom(k).querySelector('#hero');
const decorKey = (k) =>
  heroOf(k)
    .childNodes.filter((n) => n.nodeType === 1)
    .slice(0, 4)
    .map((c) => c.outerHTML.replace(/\s+/g, ' '))
    .join('');
const decorRef = decorKey('producto');
const decorOk = INNER.every((k) => decorKey(k) === decorRef);
console.log(`decorado del hero idéntico en las 11 páginas internas: ${decorOk}`);
if (!decorOk) throw new Error('El decorado del hero difiere entre páginas internas');
const heroRef = heroOf('producto');
const hk = heroRef.childNodes.filter((n) => n.nodeType === 1);
const stars = hk[2].querySelectorAll('i').map((e) => {
  const s = e.getAttribute('style');
  const m = s.match(
    /left:([\d.]+)%;top:([\d.]+)%;width:([\d.]+)px;height:([\d.]+)px;.*box-shadow:0 0 (\d+)px (\d+)px rgba\(190,225,255,\.9\);animation:twk ([\d.]+)s ease-in-out ([\d.]+)s infinite/,
  );
  if (!m) throw new Error(`Estrella con formato inesperado: ${s}`);
  const style = `position:absolute;left:${m[1]}%;top:${m[2]}%;width:${m[3]}px;height:${m[4]}px;border-radius:50%;background:#fff;box-shadow:0 0 ${m[5]}px ${m[6]}px rgba(190,225,255,.9);animation:twk ${m[7]}s ease-in-out ${m[8]}s infinite`;
  if (style !== s) throw new Error(`Estrella no reproducible: ${s}`);
  return {
    left: m[1],
    top: m[2],
    size: m[3],
    blur: Number(m[5]),
    spread: Number(m[6]),
    dur: m[7],
    delay: m[8],
  };
});
const motes = hk[3].querySelectorAll('i').map((e) => {
  const s = e.getAttribute('style');
  const m = s.match(
    /left:([\d.]+)%;bottom:-20px;width:([\d.]+)px;height:([\d.]+)px;border-radius:50%;background:radial-gradient\(circle,#fff,rgba\(160,215,255,\.5\) 55%,transparent 70%\);--dx:(-?[\d.]+)px;animation:mote ([\d.]+)s linear ([\d.]+)s infinite/,
  );
  if (!m) throw new Error(`Mota con formato inesperado: ${s}`);
  const rebuilt = `position:absolute;left:${m[1]}%;bottom:-20px;width:${m[2]}px;height:${m[3]}px;border-radius:50%;background:radial-gradient(circle,#fff,rgba(160,215,255,.5) 55%,transparent 70%);--dx:${m[4]}px;animation:mote ${m[5]}s linear ${m[6]}s infinite`;
  if (rebuilt !== s || m[2] !== m[3]) throw new Error(`Mota no reproducible: ${s}`);
  return { left: m[1], size: m[2], dx: m[4], dur: m[5], delay: m[6] };
});
const heroStyle = heroRef.getAttribute('style');
const bgLayers = hk[1]
  .querySelectorAll('i')
  .map((e) => ({ id: e.id, bg: `/${e.getAttribute('data-bg')}` }));
const bgStyle = hk[1].getAttribute('style');
const dataTs = `// GENERADO por scripts-migracion/gen-shared.mjs desde site/Producto.dc.html (idéntico en las 11 páginas internas).
export interface Star {
  left: string;
  top: string;
  size: string;
  blur: number;
  spread: number;
  dur: string;
  delay: string;
}
export interface Mote {
  left: string;
  size: string;
  dx: string;
  dur: string;
  delay: string;
}
export const heroStyle = ${JSON.stringify(heroStyle)};
export const heroBgStyle = ${JSON.stringify(bgStyle)};
export const heroBgLayers = ${JSON.stringify(bgLayers)} as const;
export const starsStyle = ${JSON.stringify(hk[2].getAttribute('style'))};
export const motesStyle = ${JSON.stringify(hk[3].getAttribute('style'))};
export const stars: Star[] = ${JSON.stringify(stars)};
export const motes: Mote[] = ${JSON.stringify(motes)};
`;
out('src/data/hero-decor.ts', dataTs);
console.log(
  `hero: ${stars.length} estrellas, ${motes.length} motas, capas: ${bgLayers.map((l) => l.id).join(',')}`,
);

// ---------- menú ----------
function menuOf(k) {
  const s = html[k].slice(html[k].indexOf('<script type="text/x-dc"'));
  const i = s.indexOf('menu: [');
  if (i < 0) throw new Error(`${k}: sin menú`);
  let depth = 0;
  let j = s.indexOf('[', i);
  const start = j;
  for (; j < s.length; j++) {
    if (s[j] === '[') depth++;
    if (s[j] === ']') {
      depth--;
      if (depth === 0) break;
    }
  }
  return new Function(`return ${s.slice(start, j + 1)}`)();
}
const menu = menuOf('producto');
const same = INNER.concat('inicio').every(
  (k) =>
    JSON.stringify(menuOf(k).map((m) => [m.label, m.href, m.ddc, m.caret, m.sub])) ===
    JSON.stringify(menu.map((m) => [m.label, m.href, m.ddc, m.caret, m.sub])),
);
console.log(`menú idéntico (salvo la clase activa) en las 12 páginas: ${same}`);
const toRef = (href) => {
  const m = href.match(/^([A-Za-z]+\.dc\.html)(#.*)?$/);
  if (!m || !FILE_TO_KEY[m[1]]) throw new Error(`Enlace de menú inesperado: ${href}`);
  return { key: FILE_TO_KEY[m[1]], hash: m[2] ?? '' };
};
const menuItems = menu.map((m) => ({
  label: m.label,
  ...toRef(m.href),
  caret: Boolean(m.caret),
  ddc: m.ddc,
  sub: m.sub.map((x) => ({ label: x.label, ...toRef(x.href) })),
}));
const active = Object.fromEntries(
  Object.keys(PAGES).map((k) => [k, menuOf(k).find((m) => m.cls === 'on')?.label ?? null]),
);
out(
  'src/data/menu.ts',
  `// GENERADO por scripts-migracion/gen-shared.mjs desde el array \`menu\` de site/*.dc.html.
import type { PageKey } from '../i18n/routes.ts';

export interface MenuLink {
  label: string;
  key: PageKey;
  hash: string;
}
export interface MenuItem extends MenuLink {
  caret: boolean;
  /** Clases del panel desplegable. */
  ddc: string;
  sub: MenuLink[];
}
export const menu: MenuItem[] = ${JSON.stringify(menuItems, null, 2)};

/** Etiqueta del elemento del menú marcado como activo en cada página (null: ninguno). */
export const activeLabel: Record<PageKey, string | null> = ${JSON.stringify(active, null, 2)};
`,
);

// ---------- footer ----------
const footEl = (k) => transform(dom(k)).querySelector('footer');
const fInner = footEl('producto');
const fHome = footEl('inicio');
const norm = (s) => s.replace(/\s+/g, ' ');
const footStyleInner = fInner.getAttribute('style');
const footStyleHome = fHome.getAttribute('style');
// Solo debe diferir el estilo de la raíz (PNG en Inicio, WebP en el resto).
fInner.setAttribute('style', 'X');
fHome.setAttribute('style', 'X');
const onlyStyleDiffers = norm(ser(fInner)) === norm(ser(fHome));
console.log(
  `footer: solo difiere el estilo de la raíz entre Inicio y el resto: ${onlyStyleDiffers}`,
);
if (!onlyStyleDiffers) throw new Error('El footer difiere en más que el estilo raíz');
const extStyle = footStyleInner
  .replace(/footer-tf\.webp/g, 'footer-tf.${ext}')
  .replace(/footer-u\.webp/g, 'footer-u.${ext}');
const homeRebuilt = extStyle.replace(/\$\{ext\}/g, 'png');
if (homeRebuilt !== footStyleHome)
  console.warn('AVISO: el estilo del footer de Inicio no se reconstruye exactamente con ext=png');
const footerHtml = linkExpr(norm(ser(fInner)).replace('style="X"', 'style={`' + extStyle + '`}'));
out(
  'src/components/layout/Footer.astro',
  `---
// GENERADO por scripts-migracion/gen-shared.mjs (marcado idéntico al de site/). Los textos se traducen en la Fase 4.
import { pathFor } from '../../i18n/routes.ts';
import type { Lang, PageKey } from '../../i18n/routes.ts';

interface Props {
  lang: Lang;
  /** Inicio usa PNG en las dos primeras capas del fondo; el resto, WebP. */
  ext?: 'webp' | 'png';
}
const { lang, ext = 'webp' } = Astro.props;
const link = (key: PageKey, hash = ''): string => pathFor(key, lang) + hash;
---

${footerHtml}
`,
);

// ---------- fragmentos de hero (andamiaje de la Fase 2; la Fase 3 los reemplaza por PageHero tipado) ----------
for (const k of INNER) {
  const hx = transform(dom(k))
    .querySelector('#hero')
    .childNodes.filter((n) => n.nodeType === 1)
    .find((c) => /\bhx\b/.test(c.classNames ?? ''));
  const text = norm(ser(hx)).replace(
    /__L:([a-z]+)(#[^"_]*)?__/g,
    (_, key, h) => pathFor(key, 'es') + (h ?? ''),
  );
  out(`src/content/hero-fragments/${k}.html`, text + '\n');
}
console.log('fragmentos de hero:', INNER.length);

// ---------- nav ----------
const nav = transform(dom('producto')).querySelector('nav');
out('scripts-migracion/.nav-fragment.html', norm(ser(nav)));
out(
  'src/styles/hover.css',
  `/* GENERADO: reglas :hover/:active (con !important) equivalentes a style-hover/style-active del runtime. */\n${pseudoCss.join('\n')}\n`,
);
console.log(`hover.css: ${pseudoCss.length} reglas`);
