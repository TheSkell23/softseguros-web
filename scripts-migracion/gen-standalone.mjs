// Uso: node scripts-migracion/gen-standalone.mjs <error404|offline> <ruta a site/>
// Genera src/components/pages/standalone/<Nombre>.astro y <clave>.css desde las páginas autónomas
// "Error 404.dc.html" y "Offline.dc.html" (sin menú ni footer). Solo lee site/.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { convertNode, createPseudoRegistry, fixCssUrls, parse, styleCss } from './xdc-to-astro.mjs';

const CONFIG = {
  error404: { file: 'Error 404.dc.html', name: 'Error404', handlers: {}, vars: '' },
  offline: {
    file: 'Offline.dc.html',
    name: 'Offline',
    handlers: { retry: 'data-offline-retry=""' },
    vars: "const message = 'No pudimos conectar con Softseguros. Cuando vuelva tu conexión, retomamos justo donde lo dejaste.';\nconst spin = 'none';\n",
  },
};
const [key, site] = process.argv.slice(2);
const cfg = CONFIG[key];
if (!cfg || !site) throw new Error('Uso: gen-standalone.mjs <error404|offline> <ruta a site/>');

const source = readFileSync(join(site, cfg.file), 'utf8');
const hoverPath = 'src/styles/hover.css';
const pseudo = createPseudoRegistry(existsSync(hoverPath) ? readFileSync(hoverPath, 'utf8') : '');
const textKeys = new Set();
const root = parse(source);
const main = root.querySelector('main');
if (!main) throw new Error('Sin <main>');
let markup = convertNode(main, { pseudo, textKeys, handlers: cfg.handlers });
if (key === 'offline') {
  // El párrafo del mensaje lo actualiza la isla cuando vuelve la conexión.
  markup = markup.replace(
    /<p ([^>]*)>\{t\(message\)\}<\/p>/,
    '<p $1 data-offline-msg="">{t(message)}</p>',
  );
}
const usesLink = /\blink\(/.test(markup);
const dir = 'src/components/pages/standalone';
mkdirSync(dir, { recursive: true });
writeFileSync(
  `${dir}/${cfg.name}.astro`,
  `---
// GENERADO por scripts-migracion/gen-standalone.mjs desde site/${cfg.file}. Los textos pasan por t().
${usesLink ? "import { pathFor } from '../../../i18n/routes.ts';\n" : ''}import { getT } from '../../../i18n/index.ts';
import type { Lang${usesLink ? ', PageKey' : ''} } from '../../../i18n/routes.ts';

interface Props {
  lang: Lang;
}
const { lang } = Astro.props;
const t = getT(lang);
${usesLink ? "const link = (key: PageKey, hash = ''): string => pathFor(key, lang) + hash;\n" : ''}${cfg.vars}---
${markup}
`,
);
writeFileSync(
  `${dir}/${key}.css`,
  `/* GENERADO: <style> de site/${cfg.file}. */\n${fixCssUrls(styleCss(source))}\n`,
);
writeFileSync(
  hoverPath,
  `/* GENERADO: reglas :hover/:active (con !important) equivalentes a style-hover/style-active del runtime. */\n${pseudo.css.join('\n')}\n`,
);
console.log(
  `${key}: ${markup.length} B | textos: ${textKeys.size} | reglas hover: ${pseudo.css.length}`,
);
