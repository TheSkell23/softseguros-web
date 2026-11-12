// Huellas de los 14 documentos legales (tools/legal/d0..d13.html), tolerancia cero.
// Equivalente a tools/cmp.py (bloques de 50 palabras con FNV-1a de 32 bits) más sha256 de cada archivo.
//   node tests/visual/legal.ts baseline <carpeta-legal> <salida.json>
//   node tests/visual/legal.ts check    <carpeta-legal> <baseline.json>
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const COUNT = 14;
const BLOCK = 50;

interface Fingerprint {
  sha256: string;
  words: number;
  blocks: number[];
}

const words = (html: string): string[] =>
  html
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

function fnv(s: string): number {
  let h = 2166136261;
  for (const ch of s) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

async function fingerprint(dir: string, i: number): Promise<Fingerprint> {
  const buf = await readFile(join(dir, `d${i}.html`));
  const w = words(buf.toString('utf8'));
  const blocks: number[] = [];
  for (let j = 0; j < w.length; j += BLOCK) blocks.push(fnv(w.slice(j, j + BLOCK).join(' ')));
  return { sha256: createHash('sha256').update(buf).digest('hex'), words: w.length, blocks };
}

async function all(dir: string): Promise<Record<string, Fingerprint>> {
  const out: Record<string, Fingerprint> = {};
  for (let i = 0; i < COUNT; i++) out[`d${i}`] = await fingerprint(dir, i);
  return out;
}

const [mode, dir, file] = process.argv.slice(2);
if (!mode || !dir || !file)
  throw new Error('Uso: legal.ts <baseline|check> <carpeta-legal> <json>');
const current = await all(dir);

if (mode === 'baseline') {
  await writeFile(file, JSON.stringify(current, null, 1));
  const total = Object.values(current).reduce((n, f) => n + f.words, 0);
  console.log(`línea base legal: ${COUNT} documentos, ${total} palabras -> ${file}`);
} else {
  const expected = JSON.parse(await readFile(file, 'utf8')) as Record<string, Fingerprint>;
  let problems = 0;
  for (const [name, exp] of Object.entries(expected)) {
    const got = current[name];
    if (!got) {
      problems++;
      console.log(`FALLA ${name}: falta`);
      continue;
    }
    if (got.sha256 !== exp.sha256) console.log(`aviso ${name}: bytes distintos (sha256)`);
    const same =
      got.words === exp.words &&
      got.blocks.length === exp.blocks.length &&
      got.blocks.every((b, k) => b === exp.blocks[k]);
    if (!same) {
      problems++;
      console.log(`FALLA ${name}: texto distinto (${exp.words} -> ${got.words} palabras)`);
    }
  }
  console.log(
    `legal: ${Object.keys(expected).length} documentos revisados | problemas de texto: ${problems}`,
  );
  process.exit(problems === 0 ? 0 : 1);
}
