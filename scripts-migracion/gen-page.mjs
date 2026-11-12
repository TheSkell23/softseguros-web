// Uso: node scripts-migracion/gen-page.mjs <clave> <ruta a site/>
// Genera src/components/pages/<clave>/{Hero,Body}.astro desde site/<Pagina>.dc.html (solo lectura de site/).
// Ejecutar después de gen-shared.mjs y gen-header.mjs (comparten hover.css).
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import {
  PAGE_FILES,
  convertNode,
  createPseudoRegistry,
  fixCssUrls,
  parse,
  styleCss,
  topRules,
} from './xdc-to-astro.mjs';
import { readHomeData } from './home-data.mjs';
import { readPriceData } from './price-data.mjs';
import { readContactData } from './contact-data.mjs';
import { readFaqData } from './faq-data.mjs';
import { readTrialData } from './trial-data.mjs';
import { readBlogData } from './blog-data.mjs';
import { readHelpData } from './help-data.mjs';

const [key, site] = process.argv.slice(2);
if (!key || !site) throw new Error('Uso: gen-page.mjs <clave> <ruta a site/>');
const file = Object.entries(PAGE_FILES).find(([, k]) => k === key)?.[0];
if (!file) throw new Error(`Clave desconocida: ${key}`);
const source = readFileSync(join(site, file), 'utf8');
const script = source.slice(source.indexOf('<script type="text/x-dc"'));

// --- reglas :hover/:active compartidas ---
const hoverPath = 'src/styles/hover.css';
const existing = existsSync(hoverPath) ? readFileSync(hoverPath, 'utf8') : '';
const pseudo = createPseudoRegistry(existing);
const textKeys = new Set();

// --- CSS propio de la página: reglas que no son comunes a las 11 páginas internas (inner.css) ---
const INNER_FILES = Object.entries(PAGE_FILES)
  .filter(([, k]) => k !== 'inicio')
  .map(([f]) => f);
const innerSets = INNER_FILES.map(
  (f) => new Set(topRules(styleCss(readFileSync(join(site, f), 'utf8')))),
);
const pageRules = topRules(styleCss(source)).filter(
  (r) => !r.startsWith('@keyframes') && !innerSets.every((s) => s.has(r)),
);

// --- configuración por página ---
/** Extrae `pn` (nombres de pestañas) y `pe` (estilo activo/inactivo) del script de la página. */
function tabsExtra() {
  const names = script.match(/const pn=(\[[^\]]*\])/);
  const peSrc = script.match(/pe=i=>\{([\s\S]*?)\};\s*\n/);
  if (!names || !peSrc) throw new Error('No se encontraron pn/pe');
  const pe = (on) =>
    new Function(
      'i',
      `const __pt = ${on ? 'i' : '-1'}; ${peSrc[1].replace(/this\.state\.pt/g, '__pt')}`,
    )(0);
  const tabNames = new Function(`return ${names[1]}`)();
  return { tabNames, tabOn: pe(true), tabOff: pe(false) };
}

const CONFIG = {
  inicio: { home: true, heroHandlers: {}, bodyHandlers: {} },
  precios: {
    pricing: true,
    heroHandlers: {},
    bodyHandlers: {
      'q.minus': 'data-price-action="minus"',
      'q.plus': 'data-price-action="plus"',
      'q.toggle': 'data-price-action="toggle"',
    },
  },
  contacto: {
    contact: true,
    heroHandlers: {},
    bodyHandlers: {
      'c.onName': 'data-contact-input="name"',
      'c.onAgency': 'data-contact-input="agency"',
    },
  },
  faq: {
    faq: true,
    heroHandlers: {},
    bodyHandlers: {
      'f.onType': 'data-faq-input=""',
      'f.onKey': 'data-faq-key=""',
      'f.send': 'data-faq-send=""',
      'it.toggle': 'data-faq-toggle=""',
    },
  },
  prueba: {
    trial: true,
    heroHandlers: {},
    bodyHandlers: {
      'p.onN': 'data-trial-input="n"',
      'p.onA': 'data-trial-input="a"',
      'p.onE': 'data-trial-input="e"',
      'p.onP': 'data-trial-input="p"',
      'p.onC': 'data-trial-country=""',
      'p.submit': 'data-trial-submit=""',
      'it.toggle': 'data-trial-toggle=""',
    },
  },
  blog: {
    blog: true,
    heroHandlers: {},
    bodyHandlers: {
      'b.onQ': 'data-blog-search=""',
      'b.onN': 'data-blog-input="n"',
      'b.onE': 'data-blog-input="e"',
      'b.submit': 'data-blog-submit=""',
    },
  },
  ayuda: { help: true, heroHandlers: {}, bodyHandlers: { 'it.toggle': 'data-help-toggle=""' } },
  // Páginas sin enlaces dinámicos: el reproductor de Conoce y los documentos legales usan islas de DOM.
  conoce: { heroHandlers: {}, bodyHandlers: {} },
  terminos: { heroHandlers: {}, bodyHandlers: {} },
  privacidad: { heroHandlers: {}, bodyHandlers: {} },
  soluciones: {
    tabs: true,
    hash: { '#comercial': 0, '#multicotizador': 1 },
    heroHandlers: { hero0: 'data-go-tab="0"', hero1: 'data-go-tab="1"' },
    bodyHandlers: {},
  },
  producto: {
    tabs: true,
    hash: { '#crm': 0, '#sincronizador': 1, '#integraciones': 2 },
    heroHandlers: { hero0: 'data-go-tab="0"', hero1: 'data-go-tab="1"', hero2: 'data-go-tab="2"' },
    bodyHandlers: { goSync: 'data-go-tab="1"' },
  },
};
const cfg = CONFIG[key];
if (!cfg) throw new Error(`Sin configuración para ${key}`);

const root = parse(source, { comment: false });
const slRoot = root.querySelector('#sl-root');
const hero = slRoot.childNodes.filter((n) => n.nodeType === 1)[0];
const wrap = slRoot.childNodes.filter((n) => n.nodeType === 1)[1];
const outerCta = slRoot.childNodes
  .filter((n) => n.nodeType === 1)
  .find((n) => n.getAttribute('id') === 'cta');
const hx = hero.childNodes
  .filter((n) => n.nodeType === 1)
  .find((c) => /\bhx\b/.test(c.classNames ?? ''));
if (!hx || !wrap) throw new Error('Estructura inesperada');

const tabs = cfg.tabs ? tabsExtra() : null;
const home = cfg.home ? readHomeData(site) : null;
const pricing = cfg.pricing ? readPriceData(site) : null;
const contact = cfg.contact ? readContactData(site) : null;
const faq = cfg.faq ? readFaqData(site) : null;
const trial = cfg.trial ? readTrialData(site) : null;
const blog = cfg.blog ? readBlogData(site) : null;
const help = cfg.help ? readHelpData(site) : null;
const homeKeys = [
  'heroQuotes',
  'toasts',
  'logos',
  'logosLoop',
  'metrics',
  'comparativa',
  'calc',
  'sliders',
  'tabs',
  'chat',
  'queEsStats',
  'dolores',
  'iaCards',
  'renov',
];
const homeDataJson = home ? JSON.stringify(home.initial).replaceAll('"uploads/', '"/uploads/') : '';

// --- ganchos de conversión ---
const rawHooks = [];
if (home) {
  rawHooks.push((el) => {
    const directText = el.childNodes
      ?.filter((n) => n.nodeType === 3)
      .map((n) => n.rawText)
      .join('')
      .trim();
    const calcField = directText?.match(/^\{\{\s*calc\.(total|rec|hrs|x)\s*\}\}$/)?.[1];
    if (calcField) el.setAttribute('data-home-calc', calcField);
    if (directText === '{{ s.text }}') el.setAttribute('data-home-slider-text', '');
    if (el.rawTagName === 'sc-for' && /\{\{\s*tabs\s*\}\}/.test(el.getAttribute('list') ?? '')) {
      return '{tabs.map((tab, i) => (<button role="tab" data-home-tab={i} aria-selected={i === 0} style={tab.style}>{tr(tab.label)}</button>))}';
    }
    if (
      el.parentNode?.getAttribute?.('id') === 'equipo' &&
      el.outerHTML.includes('{{ panel.role }}')
    ) {
      const inner = convertNode(el, { ...ctx, rawHooks: [] });
      return `{panels.map((panel, i) => (<div data-home-panel={i} style={i === 0 ? 'display:contents' : 'display:none'}>${inner}</div>))}`;
    }
    return null;
  });
  const tablist = wrap.querySelector('#equipo [role="tablist"]');
  if (tablist) {
    tablist.setAttribute('data-home-tabs', '');
    tablist.setAttribute('data-style-on', home.initial.tabs[0].style);
    tablist.setAttribute('data-style-off', home.initial.tabs[1].style);
  }
}
if (pricing) {
  rawHooks.push((el) => {
    const directText = el.childNodes
      ?.filter((n) => n.nodeType === 3)
      .map((n) => n.rawText)
      .join('')
      .trim();
    const field = directText?.match(/^\{\{\s*q\.(users|total|month|mcLabel)\s*\}\}$/)?.[1];
    if (field) el.setAttribute('data-price-field', field);
    if (el.rawTagName === 'button' && el.getAttribute('role') === 'switch')
      el.setAttribute('data-price-switch', '');
    if (el.rawTagName === 'ul' && el.outerHTML.includes('list="{{ q.feat }}"'))
      el.setAttribute('data-price-features', '');
    return null;
  });
}
if (contact) {
  rawHooks.push((el) => {
    if (el.getAttribute?.('href') === '{{ c.href }}') el.setAttribute('data-contact-link', '');
    if (el.rawTagName === 'sc-for') {
      const list = el.getAttribute('list') ?? '';
      if (/\{\{\s*c\.topics\s*\}\}/.test(list))
        return '{c.topics.map((choice,i)=>(<button type="button" data-contact-topic={i} data-source-label={choice.label} style={choice.style}>{t(choice.label)}</button>))}';
      if (/\{\{\s*c\.sizes\s*\}\}/.test(list))
        return '{c.sizes.map((choice,i)=>(<button type="button" data-contact-size={i} data-source-label={choice.label} style={choice.style}>{t(choice.label)}</button>))}';
    }
    return null;
  });
}
if (faq) {
  rawHooks.push((el) => {
    if (el.rawTagName === 'sc-for') {
      const list = el.getAttribute('list') ?? '';
      if (/\{\{\s*f\.cats\s*\}\}/.test(list))
        return '{f.cats.map((choice,i)=>(<button type="button" data-faq-cat={i} style={choice.style}>{t(choice.label)}</button>))}';
      if (/\{\{\s*f\.chips\s*\}\}/.test(list))
        return '{f.chips.map((choice,i)=>(<button type="button" data-faq-chip={i} style={choice.style}>{t(choice.label)}</button>))}';
    }
    return null;
  });
}
if (trial) {
  rawHooks.push((el) => {
    const style = el.getAttribute?.('style') ?? '';
    const markers = {
      '{{ p.formStyle }}': 'form',
      '{{ p.okStyle }}': 'ok',
      '{{ p.sN }}': 'n',
      '{{ p.sA }}': 'a',
      '{{ p.sE }}': 'e',
      '{{ p.sP }}': 'p',
    };
    if (markers[style]) el.setAttribute('data-trial-style', markers[style]);
    const directText = el.childNodes
      ?.filter((n) => n.nodeType === 3)
      .map((n) => n.rawText)
      .join('')
      .trim();
    const field = directText?.match(/^\{\{\s*p\.(eN|eA|eE|eP|name|email)\s*\}\}$/)?.[1];
    if (field) el.setAttribute('data-trial-field', field);
    return null;
  });
}
if (blog) {
  rawHooks.push((el) => {
    if (el.rawTagName === 'sc-for') {
      const list = el.getAttribute('list') ?? '';
      if (/\{\{\s*b\.cats\s*\}\}/.test(list))
        return '{b.cats.map((choice,i)=>(<button type="button" data-blog-cat={i} style={choice.style}>{t(choice.label)}</button>))}';
      if (/\{\{\s*b\.items\s*\}\}/.test(list)) {
        const article = el.childNodes.find((n) => n.rawTagName === 'article');
        if (!article) throw new Error('ArtÃ­culo de Blog no encontrado');
        article.setAttribute('data-blog-card', '{{ i }}');
        return `{b.items.map((a,i)=>(<>${convertNode(article, ctx)}</>))}`;
      }
    }
    const style = el.getAttribute?.('style') ?? '';
    const markers = {
      '{{ b.emptyStyle }}': 'empty',
      '{{ b.formStyle }}': 'form',
      '{{ b.okStyle }}': 'ok',
      '{{ b.sN }}': 'n',
      '{{ b.sE }}': 'e',
    };
    if (markers[style]) el.setAttribute('data-blog-style', markers[style]);
    const directText = el.childNodes
      ?.filter((n) => n.nodeType === 3)
      .map((n) => n.rawText)
      .join('')
      .trim();
    const field = directText?.match(/^\{\{\s*b\.(eN|eE)\s*\}\}$/)?.[1];
    if (field) el.setAttribute('data-blog-field', field);
    return null;
  });
}
if (cfg.tabs) {
  // Bucle de pestañas -> botones con data-tab (la isla alterna el estilo activo/inactivo).
  rawHooks.push((el) => {
    if (el.rawTagName === 'sc-for' && /\{\{\s*ptabs\s*\}\}/.test(el.getAttribute('list') ?? '')) {
      return '{tabNames.map((name, i) => (<button role="tab" data-tab={i} style={i === 0 ? tabOn : tabOff}>{t(name)}</button>))}';
    }
    // Paneles: se renderizan todos; la isla muestra el activo (display:contents no genera caja).
    if (el.rawTagName === 'sc-if') {
      const m = (el.getAttribute('value') ?? '').match(/\{\{\s*pt(\d)\s*\}\}/);
      if (m)
        return `<div data-panel="${m[1]}" style="display:${m[1] === '0' ? 'contents' : 'none'}">${el.childNodes.map((c) => convertNode(c, ctx)).join('')}</div>`;
    }
    return null;
  });
  // El contenedor de pestañas lleva los datos que necesita la isla.
  const tablist = wrap.querySelector('[role="tablist"]');
  if (tablist) {
    tablist.setAttribute('data-tabs', '');
    tablist.setAttribute('data-style-on', tabs.tabOn);
    tablist.setAttribute('data-style-off', tabs.tabOff);
    tablist.setAttribute('data-hashes', JSON.stringify(cfg.hash));
  }
}
const ctx = { pseudo, textKeys, handlers: { ...cfg.heroHandlers, ...cfg.bodyHandlers }, rawHooks };
if (home) ctx.handlers['s.on'] = 'data-home-slider=""';

// --- salida ---
const frontmatter = (markup, extra = '') => {
  const usesLink = /\blink\(/.test(markup);
  const usedHomeKeys = homeKeys.filter((key) => new RegExp(`\\b${key}\\.`).test(markup));
  const usesPanels = /\bpanels\b/.test(markup);
  const usesPricing = Boolean(pricing && /\bq\./.test(markup));
  const usesContact = Boolean(contact && /\bc\./.test(markup));
  const usesFaq = Boolean(faq && /\bf\./.test(markup));
  const usesTrial = Boolean(trial && /\b(?:p|f)\./.test(markup));
  const usesBlog = Boolean(blog && /\bb\./.test(markup));
  const usesHelp = Boolean(help && /\bh\./.test(markup));
  return `---
// GENERADO por scripts-migracion/gen-page.mjs desde site/${file}. Los textos pasan por t() (catálogo: Fase 4).
${usesLink ? "import { pathFor } from '../../../i18n/routes.ts';\n" : ''}import { getT } from '../../../i18n/index.ts';
import type { Lang${usesLink ? ', PageKey' : ''} } from '../../../i18n/routes.ts';

interface Props {
  lang: Lang;
}
const { lang } = Astro.props;
const t = getT(lang);
${home ? 'const tr = t;\n' : ''}
${usesLink ? "const link = (key: PageKey, hash = ''): string => pathFor(key, lang) + hash;\n" : ''}${home && usedHomeKeys.length ? `const homeData = ${homeDataJson};\nconst { ${usedHomeKeys.join(', ')} } = homeData;\n` : ''}${home && usesPanels ? `const panels = ${JSON.stringify(home.panels)};\n` : ''}${usesPricing ? `const q = ${JSON.stringify({ ...pricing.initial, mcOn: pricing.initial.mcOn === 'true' })};\nconst priceJson = ${JSON.stringify(JSON.stringify(pricing.variants))};\n` : ''}${usesContact ? `const c = ${JSON.stringify(contact)};\n` : ''}${usesFaq ? `const f = ${JSON.stringify(faq.initial)};\nconst faqJson = ${JSON.stringify(JSON.stringify({ categories: faq.categories, data: faq.data, accordion: faq.accordion, messages: faq.messages }))};\n` : ''}${usesTrial ? `const p = ${JSON.stringify(trial.p)};\nconst f = ${JSON.stringify(trial.f)};\nconst trialJson = ${JSON.stringify(JSON.stringify(trial.accordion))};\n` : ''}${usesBlog ? `const b = ${JSON.stringify(blog.initial)};\nconst blogJson = ${JSON.stringify(JSON.stringify({ data: blog.data, emptyStyle: blog.emptyStyle }))};\n` : ''}${usesHelp ? `const h = ${JSON.stringify(help.initial)};\nconst helpJson = ${JSON.stringify(JSON.stringify(help.accordion))};\n` : ''}${extra}---
`;
};
const dir = `src/components/pages/${key}`;
mkdirSync(dir, { recursive: true });
if (home) {
  const decor = hero.childNodes
    .filter((n) => n.nodeType === 1)
    .slice(0, 4)
    .map((n) => convertNode(n, ctx))
    .join('\n');
  writeFileSync(
    `${dir}/Decor.astro`,
    `---\n// GENERADO: decoraciÃ³n del hero de Inicio.\n---\n${decor}\n`,
  );
}
let heroMarkup = convertNode(hx, ctx);
if (home) {
  const contents = hero.childNodes.filter((n) => n.nodeType === 1).slice(5);
  heroMarkup = contents.map((n) => convertNode(n, ctx)).join('\n');
}
const homeMarkup = (s) => (home ? s.replace(/\bt\(/g, 'tr(') : s);
heroMarkup = homeMarkup(heroMarkup);
writeFileSync(`${dir}/Hero.astro`, `${frontmatter(heroMarkup)}\n${heroMarkup}\n`);

const bodyNodes = wrap.childNodes.filter((n) => n.nodeType === 1 && n.rawTagName !== 'footer');
const extra = tabs
  ? `const tabNames: string[] = ${JSON.stringify(tabs.tabNames)};\nconst tabOn = ${JSON.stringify(tabs.tabOn)};\nconst tabOff = ${JSON.stringify(tabs.tabOff)};\n`
  : '';
let bodyMarkup = homeMarkup(bodyNodes.map((n) => convertNode(n, ctx)).join('\n'));
if (trial) {
  bodyMarkup = bodyMarkup
    .replace('{t(p.name)}', '<span data-trial-field="name">{p.name}</span>')
    .replace('{t(p.email)}', '<span data-trial-field="email">{p.email}</span>');
}
if (blog) {
  bodyMarkup = bodyMarkup
    .replace('{t(b.name)}', '<span data-blog-field="name">{b.name}</span>')
    .replace('{t(b.email)}', '<span data-blog-field="email">{b.email}</span>');
}
if (pageRules.length) {
  writeFileSync(
    `${dir}/page.css`,
    `/* GENERADO: reglas propias de ${file} (no comunes a las 11 páginas internas), en su orden original. */\n${fixCssUrls(pageRules.join('\n'))}\n`,
  );
}
if (home) {
  // El runtime normaliza el atributo style; estos selectores no coinciden en la pÃ¡gina original.
  const homeCss = styleCss(source).replace(
    /#sl-root section\[style\*=["']padding:(?:96|110)px 0 0["']\]\{[^}]*\}/g,
    '',
  );
  writeFileSync(
    `${dir}/home.css`,
    `/* GENERADO: CSS completo de ${file}. */\n${fixCssUrls(homeCss)}\n`,
  );
}
const cssImport = '';
writeFileSync(
  `${dir}/Body.astro`,
  `${frontmatter(bodyMarkup, cssImport + extra)}\n${bodyMarkup}\n${pricing ? '<script id="price-data" type="application/json" set:html={priceJson} />\n' : ''}${faq ? '<script id="faq-data" type="application/json" set:html={faqJson} />\n' : ''}${trial ? '<script id="trial-data" type="application/json" set:html={trialJson} />\n' : ''}${blog ? '<script id="blog-data" type="application/json" set:html={blogJson} />\n' : ''}${help ? '<script id="help-data" type="application/json" set:html={helpJson} />\n' : ''}`,
);
if (outerCta) {
  const ctaMarkup = convertNode(outerCta, ctx);
  writeFileSync(`${dir}/Cta.astro`, `${frontmatter(ctaMarkup)}\n${ctaMarkup}\n`);
}

writeFileSync(
  hoverPath,
  `/* GENERADO: reglas :hover/:active (con !important) equivalentes a style-hover/style-active del runtime. */\n${pseudo.css.join('\n')}\n`,
);
writeFileSync(`${dir}/text-keys.json`, JSON.stringify([...textKeys].sort(), null, 1));
console.log(
  `${key}: Hero ${hx.outerHTML.length} B, cuerpo ${bodyNodes.map((n) => n.outerHTML.length).join('+')} B, CTA externo ${outerCta ? 'sí' : 'no'} | textos: ${textKeys.size} | reglas hover: ${pseudo.css.length} | reglas CSS propias: ${pageRules.length}`,
);
