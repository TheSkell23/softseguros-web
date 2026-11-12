// Conversor de plantillas x-dc (site/*.dc.html) a marcado Astro. Biblioteca usada por gen-page.mjs.
//  - <sc-for list="{{ L }}" as="x"> -> {L.map((x) => (...))}      - <sc-if value="{{ E }}"> -> {E && (<>...</>)}
//  - {{ expr }} -> {expr}; style-hover / style-active -> clases .hvN / .acN (hover.css, con !important como el runtime)
//  - uploads/ -> /uploads/; hrefs "Pagina.dc.html#x" -> {link("clave", "#x")}
//  - cada nodo de texto en español -> {t("texto")} (clave = texto exacto, igual que las claves de i18n.js)
import { parse } from 'node-html-parser';

export const PAGE_FILES = {
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
const VOID = new Set(['br', 'img', 'input', 'hr', 'meta', 'link', 'source', 'col', 'wbr']);
const TRANSLATABLE_ATTRS = new Set(['alt', 'aria-label', 'placeholder', 'title']);

/** Registro de reglas :hover/:active compartido entre páginas (mismo formato que gen-shared.mjs). */
export function createPseudoRegistry(existing = '') {
  const map = new Map();
  const css = [];
  // Normaliza declaraciones (sin espacios tras ":" ni ";" final) y fuerza !important, como el runtime.
  const normalize = (decls) =>
    decls
      .split(';')
      .map((d) => d.trim().replace(/\s*:\s*/, ':'))
      .filter(Boolean)
      .map((d) =>
        /!\s*important$/i.test(d)
          ? d.replace(/\s*!\s*important$/i, ' !important')
          : `${d} !important`,
      )
      .join(';');
  // La semilla se lee del archivo completo (admite formato de una línea o ya formateado con Prettier).
  const text = Array.isArray(existing) ? existing.join('\n') : existing;
  for (const m of text.matchAll(/\.((?:hv|ac)\d+):(hover|active)\s*\{([^}]*)\}/g)) {
    const decls = normalize(m[3]);
    map.set(`${m[2]}|${decls}`, m[1]);
    css.push(`.${m[1]}:${m[2]}{${decls}}`);
  }
  const nextIndex = () => 1 + Math.max(0, ...[...map.values()].map((c) => Number(c.slice(2))));
  return {
    css,
    get(kind, decls) {
      const important = normalize(decls);
      const key = `${kind}|${important}`;
      if (!map.has(key)) {
        const cls = `${kind === 'hover' ? 'hv' : 'ac'}${nextIndex()}`;
        map.set(key, cls);
        css.push(`.${cls}:${kind}{${important}}`);
      }
      return map.get(key);
    },
  };
}

const jsStr = (s) => JSON.stringify(s);
const esc = (s) => s.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');

/**
 * @param {import('node-html-parser').Node} node
 * @param {{ pseudo: ReturnType<typeof createPseudoRegistry>, handlers?: Record<string,string>, textKeys?: Set<string>, rawHooks?: ((el:any)=>string|null)[] }} ctx
 */
export function convertNode(node, ctx) {
  if (node.nodeType === 3) return convertText(node, ctx);
  if (node.nodeType !== 1) return '';
  const tag = node.rawTagName ?? node.tagName.toLowerCase();
  for (const hook of ctx.rawHooks ?? []) {
    const r = hook(node);
    if (r !== null) return r;
  }
  if (tag === 'sc-for') {
    const list = expr(node.getAttribute('list'));
    const as = node.getAttribute('as');
    if (!list || !as) throw new Error('sc-for sin list/as');
    return `{${list}.map((${as}) => (<>${children(node, ctx)}</>))}`;
  }
  if (tag === 'sc-if') {
    const e = expr(node.getAttribute('value'));
    if (!e) throw new Error('sc-if sin value');
    return `{${e} && (<>${children(node, ctx)}</>)}`;
  }
  // Contenido con data-no-i18n (textos legales): se emite tal cual, sin t(), para conservar cada palabra.
  const inner = node.hasAttribute?.('data-no-i18n') && !ctx.noI18n ? { ...ctx, noI18n: true } : ctx;
  const attrs = convertAttrs(node, inner);
  if (VOID.has(tag)) return `<${tag}${attrs} />`;
  return `<${tag}${attrs}>${children(node, inner)}</${tag}>`;
}

const children = (node, ctx) => node.childNodes.map((c) => convertNode(c, ctx)).join('');

/** Devuelve la expresión de un valor `{{ expr }}` completo, o null. */
function expr(v) {
  const m = v?.match(/^\s*\{\{\s*([\s\S]+?)\s*\}\}\s*$/);
  return m ? m[1] : null;
}

function convertText(node, ctx) {
  const raw = node.rawText;
  if (!raw.trim()) return raw.length ? ' ' : '';
  if (ctx.noI18n) return esc(raw);
  const parts = raw.split(/(\{\{[\s\S]+?\}\})/g);
  return parts
    .map((p) => {
      const e = expr(p);
      if (e) return `{t(${e})}`;
      if (!p.trim()) return p.length ? ' ' : '';
      const decoded = decodeEntities(p);
      const lead = /^\s/.test(decoded) ? ' ' : '';
      const trail = /\s$/.test(decoded) && decoded.trim() ? ' ' : '';
      // El runtime conserva NBSP en innerText; solo se normaliza espacio ASCII entre palabras.
      const key = decoded.replace(/[ \t\r\n]+/g, ' ').trim();
      ctx.textKeys?.add(key);
      return `${lead}{t(${jsStr(key)})}${trail}`;
    })
    .join('');
}

const ENT = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  middot: '·',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  laquo: '«',
  raquo: '»',
  copy: '©',
  times: '×',
  rarr: '→',
  larr: '←',
  check: '✓',
};
function decodeEntities(s) {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, e) => {
    if (e[0] === '#')
      return String.fromCodePoint(
        e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10),
      );
    return ENT[e] ?? m;
  });
}

function convertAttrs(node, ctx) {
  let out = '';
  const attrs = { ...node.attributes };
  const classes = [];
  for (const kind of ['hover', 'active']) {
    const v = attrs[`style-${kind}`];
    if (v !== undefined) {
      classes.push(ctx.pseudo.get(kind, v));
      delete attrs[`style-${kind}`];
    }
  }
  delete attrs['hint-placeholder-count'];
  delete attrs['hint-placeholder-val'];
  delete attrs['hint-size'];
  for (const [rawName, value] of Object.entries(attrs)) {
    const name = rawName;
    if (/^on[a-z]+$/i.test(name) && value.includes('{{')) {
      const h = expr(value);
      const mapped = h ? ctx.handlers?.[h] : undefined;
      if (mapped === undefined) throw new Error(`Manejador sin definir: ${name}="${value}"`);
      if (mapped) out += ` ${mapped}`;
      continue;
    }
    let v = value
      .replace(/^uploads\//, '/uploads/')
      .replace(/url\((['"]?)uploads\//g, 'url($1/uploads/');
    if (name === 'class') {
      if (v.includes('{{')) {
        const e = expr(v);
        if (e) {
          out += ` class={[${e}, ${jsStr(classes.join(' '))}].filter(Boolean).join(' ')}`;
        } else
          out += ` class={\`${toTemplate(v)}${classes.length ? ' ' + classes.join(' ') : ''}\`}`;
        classes.length = 0;
        continue;
      }
      classes.unshift(...v.split(/\s+/).filter(Boolean));
      continue;
    }
    if (name === 'href') {
      const m = v.match(/^([A-Za-z]+\.dc\.html)(#.*)?$/);
      if (m && PAGE_FILES[m[1]]) {
        out += ` href={link(${jsStr(PAGE_FILES[m[1]])}, ${jsStr(m[2] ?? '')})}`;
        continue;
      }
    }
    if (v.includes('{{')) {
      const e = expr(v);
      out += e ? ` ${name}={${e}}` : ` ${name}={\`${toTemplate(v)}\`}`;
      continue;
    }
    if (!ctx.noI18n && TRANSLATABLE_ATTRS.has(name) && v.trim()) {
      ctx.textKeys?.add(decodeEntities(v).trim());
      out += ` ${name}={t(${jsStr(decodeEntities(v))})}`;
      continue;
    }
    out += v === '' ? ` ${name}=""` : ` ${name}=${attrQuote(v)}`;
  }
  if (classes.length) out = ` class="${classes.join(' ')}"` + out;
  return out;
}

const toTemplate = (v) =>
  v
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')
    .replace(/\{\{\s*([\s\S]+?)\s*\}\}/g, '${$1}');
const attrQuote = (v) => (v.includes('"') ? `'${v}'` : `"${v}"`);

export { parse, esc, decodeEntities };

// ---------- CSS propio de cada página ----------
export const styleCss = (html) =>
  (html.match(/<style[^>]*>[\s\S]*?<\/style>/g) ?? [])
    .map((s) => s.replace(/<\/?style[^>]*>/g, ''))
    .join('\n');

export function topRules(css) {
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

export const fixCssUrls = (s) =>
  s
    .replace(/url\((['"]?)uploads\//g, 'url($1/uploads/')
    .replace(/\[href=(['"])Prueba\.dc\.html\1\]/g, '[data-cta="trial"]');
