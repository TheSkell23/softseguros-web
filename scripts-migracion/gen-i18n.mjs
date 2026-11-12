// Uso: node scripts-migracion/gen-i18n.mjs <ruta a site/>
// Lee el diccionario publicado en el código fuente actual. Nunca escribe en site/.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const site = process.argv[2];
if (!site) throw new Error('Falta la ruta a site/');
const source = readFileSync(join(site, 'i18n.js'), 'utf8');
const match = source.match(/var D=(\{[^\n]*\});\/\* i18n v2 404-offline \*\//);
if (!match) throw new Error('No se encontró el diccionario D');
const dictionary = JSON.parse(match[1]);
const rules = source.match(/var RULES=(\[[\s\S]*?\]);\nfunction n\(/)?.[1];
if (!rules) throw new Error('No se encontraron las reglas de traducción');
const keys = Object.keys(dictionary).sort((a, b) => a.localeCompare(b, 'es'));
const asObject = (data) => JSON.stringify(data, null, 2);
writeFileSync(
  'src/i18n/es.ts',
  `// GENERADO desde site/i18n.js. Las claves son los textos originales.\nexport const es = ${asObject(Object.fromEntries(keys.map((key) => [key, key])))} as const;\nexport type MessageKey = keyof typeof es;\n`,
);
writeFileSync(
  'src/i18n/en.ts',
  `// GENERADO desde site/i18n.js. No editar traducciones aquí: actualizar la fuente y regenerar.\nimport type { MessageKey } from './es.ts';\nexport const en = ${asObject(Object.fromEntries(keys.map((key) => [key, dictionary[key]])))} satisfies Record<MessageKey, string>;\n`,
);
writeFileSync(
  'src/i18n/rules.ts',
  `// GENERADO desde las 24 reglas de site/i18n.js. Se conserva el orden original.\nconst n = (s: string): string => String(s).replace(/(\\d)\\.(\\d{3})(?!\\d)/g, '$1,$2').replace(/(\\d),(\\d{1,2})(?!\\d)/g, '$1.$2');\nexport function translateRule(text: string, tr: (text: string) => string): string | undefined {\n  const rules: Array<[RegExp, (m: RegExpExecArray) => string]> = ${rules};\n  for (const [pattern, translate] of rules) {\n    const match = pattern.exec(text);\n    if (match) return translate(match);\n  }\n  return undefined;\n}\n`,
);
const componentDir = 'src/components/pages';
const used = new Set();
for (const page of readdirSync(componentDir, { withFileTypes: true }).filter((entry) =>
  entry.isDirectory(),
)) {
  for (const file of readdirSync(join(componentDir, page.name)).filter((name) =>
    name.endsWith('.astro'),
  )) {
    const text = readFileSync(join(componentDir, page.name, file), 'utf8');
    for (const m of text.matchAll(/\bt\(("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')\)/g)) {
      if (m[1][0] === '"') used.add(JSON.parse(m[1]));
    }
  }
}
const missing = [...used].filter((key) => !(key in dictionary));
console.log(`${keys.length} entradas ES→EN generadas`);
console.log(`${used.size} claves usadas en páginas; ${missing.length} sin entrada directa`);
if (missing.length) console.log(missing.slice(0, 50));
