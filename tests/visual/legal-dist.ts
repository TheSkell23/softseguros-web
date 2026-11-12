// Uso: node tests/visual/legal-dist.ts
// Extrae el cuerpo de cada documento legal del HTML generado (dist/) y lo verifica con las huellas de
// tests/visual/fixtures/legal.json (14 documentos, bloques de 50 palabras, tolerancia cero), en español e inglés.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { parse } from 'node-html-parser';
import { slugs } from '../../src/i18n/routes.ts';

let problems = 0;
for (const lang of ['es', 'en'] as const) {
  const dir = resolve(`tests/visual/out/legal-dist-${lang}`);
  mkdirSync(dir, { recursive: true });
  let found = 0;
  for (const key of ['terminos', 'privacidad'] as const) {
    const html = readFileSync(`dist/${lang}/${slugs[key][lang]}/index.html`, 'utf8');
    const root = parse(html, { comment: false });
    for (const d of root.querySelectorAll('details.lg-d')) {
      const n = Number(d.id.replace('d-', ''));
      const body = d.querySelector('.lg-body');
      if (!body) throw new Error(`${key} ${d.id}: sin .lg-body`);
      writeFileSync(join(dir, `d${n}.html`), body.innerHTML);
      found++;
    }
  }
  console.log(`[${lang}] documentos extraídos de dist: ${found}`);
  const r = spawnSync(
    process.execPath,
    ['tests/visual/legal.ts', 'check', dir, 'tests/visual/fixtures/legal.json'],
    { encoding: 'utf8' },
  );
  process.stdout.write(r.stdout);
  if (r.status !== 0 || found !== 14) problems++;
}
process.exit(problems === 0 ? 0 : 1);
