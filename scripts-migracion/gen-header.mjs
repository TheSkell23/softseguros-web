// Uso: node scripts-migracion/gen-header.mjs   (después de gen-shared.mjs)
// Convierte el fragmento del menú (con bucles x-dc) en src/components/layout/Header.astro.
import { readFileSync, writeFileSync } from 'node:fs';

const F = readFileSync('scripts-migracion/.nav-fragment.html', 'utf8');
const must = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

// --- bucle del menú ---
const mStart = F.indexOf('<sc-for list="{{ menu }}"');
const mEndMarker = '</sc-for> </div> <div class="nv-r"';
const mEnd = F.indexOf(mEndMarker);
must(mStart > 0 && mEnd > mStart, 'No se encontró el bucle del menú');
const loop = F.slice(mStart, mEnd + '</sc-for>'.length);
const anchorStyle = loop.match(
  /<a class="\{\{ m\.cls \}\} hv(\d+)" href="\{\{ m\.href \}\}" style="([^"]*)"/,
);
must(anchorStyle, 'No se encontró el enlace principal del menú');
const caretSvg = loop.match(/<sc-if[^>]*> ?(<svg[\s\S]*?<\/svg>) ?<\/sc-if>/);
must(caretSvg, 'No se encontró la flecha del menú');
const hvMenu = `hv${anchorStyle[1]}`;
const menuAstro = `{menu.map((m) => (
          <div class="dd">
            <a class={\`\${m.label === activeName ? 'on ' : ''}${hvMenu}\`} href={link(m.key, m.hash)} style="${anchorStyle[2]}">
              {m.label}
              {m.caret && ${caretSvg[1].replace(/\s+/g, ' ')}}
            </a>
            <div class={m.ddc}>
              <div>
                {m.sub.map((x) => (
                  <a class="dd-i" href={link(x.key, x.hash)}>{x.label}</a>
                ))}
              </div>
            </div>
          </div>
        ))}`;

// --- enlace "Inicio" ---
const inicio = F.match(/<a href="__L:inicio__" style="([^"]*)" class="(hv\d+)">Inicio<\/a>/);
must(inicio, 'No se encontró el enlace Inicio');
const inicioAstro = `<a class={\`\${currentKey === 'inicio' ? 'on ' : ''}${inicio[2]}\`} href={link('inicio')} style="${inicio[1]}">Inicio</a>`;

// --- selector de idioma ---
const langBlock = F.match(
  /<div class="lang rf" style="([^"]*)"> <span style="([^"]*)">(<svg[\s\S]*?<\/svg>)ES<\/span> <span style="([^"]*)">EN<\/span> <\/div>/,
);
must(langBlock, 'No se encontró el selector de idioma');
const [, langStyle, activeStyle, globe, inactiveStyle] = langBlock;
const langAstro = `<div class="lang rf" role="group" aria-label="Language" style="${langStyle}">
          {langs.map((l) => (
            <a
              href={altPath(l.lang)}
              lang={l.lang}
              hreflang={l.lang}
              data-l={l.lang}
              aria-current={l.lang === lang ? 'true' : undefined}
              style={(l.lang === lang ? '${activeStyle}' : '${inactiveStyle}') + ';text-decoration:none;color:inherit'}
            >
              {l.lang === lang && ${globe.replace(/\s+/g, ' ')}}
              {l.label}
            </a>
          ))}
        </div>`;

// --- resto ---
let rest = F.replace(loop, '__MENU__')
  .replace(langBlock[0], '__LANG__')
  .replace(inicio[0], '__INICIO__');
const lbtn = '<button id="lbtn" type="button" aria-label="Language">EN</button>';
must(rest.includes(lbtn), 'No se encontró el botón de idioma móvil');
rest = rest.replace(
  lbtn,
  '<button id="lbtn" type="button" aria-label={lbLabel} data-href={altPath(otherLang)}>{otherLang.toUpperCase()}</button>',
);
rest = rest.replace(
  /href="__L:([a-z]+)(#[^"_]*)?__"/g,
  (_, k, h) => `href={link('${k}', '${h ?? ''}')}`,
);
rest = rest
  .replace('__MENU__', menuAstro)
  .replace('__LANG__', langAstro)
  .replace('__INICIO__', inicioAstro);
rest = rest.replace('<a class="login" ', '<a class="login" data-i="login" ');
rest = rest.replace(/>Ingresar<\/a>/, '>{labels.login}</a>');
rest = rest
  .replace(/>7 días gratis<\/a>/, ' data-i="trial" data-cta="trial">{labels.trial}</a>')
  .replace(/aria-label="7 días gratis"/, 'aria-label={labels.trial}');

const nav = rest.replace(
  '<nav id="nav" class="nt">',
  '<nav id="nav" class="nt" data-login={labels.login} data-trial={labels.trial} data-trial-href={link(\'prueba\')}>',
);

const out = `---
// GENERADO por scripts-migracion/gen-header.mjs a partir del menú de site/Producto.dc.html.
// El menú móvil (#mm) lo construye src/scripts/mobile-nav.ts leyendo este DOM, igual que el sitio actual.
import { menu, activeLabel } from '../../data/menu.ts';
import { alternates, pathFor } from '../../i18n/routes.ts';
import type { Lang, PageKey } from '../../i18n/routes.ts';

interface Props {
  lang: Lang;
  currentKey: PageKey;
}
const { lang, currentKey } = Astro.props;
const link = (key: PageKey, hash = ''): string => pathFor(key, lang) + hash;
const altPath = (l: Lang): string => alternates(currentKey).find((a) => a.lang === l)?.path ?? '/';
const activeName = activeLabel[currentKey];
const langs: { lang: Lang; label: string }[] = [
  { lang: 'es', label: 'ES' },
  { lang: 'en', label: 'EN' },
];
const otherLang: Lang = lang === 'es' ? 'en' : 'es';
const lbLabel = lang === 'es' ? 'Switch to English' : 'Cambiar a español';
// Fase 4: estos textos pasan por el catálogo de traducción.
const labels = { login: 'Ingresar', trial: '7 días gratis' };
---

${nav}
`;
writeFileSync('src/components/layout/Header.astro', out);
console.log('Header.astro:', out.length, 'bytes');
