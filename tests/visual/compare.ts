// Uso: node tests/visual/compare.ts <carpeta-base> <carpeta-candidata> <carpeta-informe> [--threshold=0.1] [--max-ratio=0.001]
// Compara PNG por píxeles (pixelmatch, el mismo algoritmo que usa Playwright) y el texto visible (exacto).
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

interface Meta {
  id: string;
  text: string;
  links: string[];
  height: number;
  errors: string[];
}

interface Row {
  id: string;
  status: 'ok' | 'fuera-de-umbral' | 'tamano-distinto' | 'falta';
  ratio: number;
  diffPixels: number;
  size: string;
  textEqual: boolean;
  firstTextDiff: string;
}

const readPng = async (p: string): Promise<PNG> => PNG.sync.read(await readFile(p));

function firstDiff(a: string, b: string): string {
  const la = a.split('\n');
  const lb = b.split('\n');
  for (let i = 0; i < Math.max(la.length, lb.length); i++) {
    if (la[i] !== lb[i])
      return `línea ${i + 1}: «${(la[i] ?? '').slice(0, 60)}» vs «${(lb[i] ?? '').slice(0, 60)}»`;
  }
  return '';
}

async function main(): Promise<void> {
  const [baseArg, candArg, outArg, ...rest] = process.argv.slice(2);
  if (!baseArg || !candArg || !outArg)
    throw new Error('Uso: compare.ts <base> <candidata> <informe> [--threshold=n] [--max-ratio=n]');
  const threshold = Number(rest.find((a) => a.startsWith('--threshold='))?.slice(12) ?? 0.1);
  const maxRatio = Number(rest.find((a) => a.startsWith('--max-ratio='))?.slice(12) ?? 0.001);
  const only = rest.find((a) => a.startsWith('--only='))?.slice(7);
  const filter = only ? new RegExp(only) : null;
  const base = resolve(baseArg);
  const cand = resolve(candArg);
  const out = resolve(outArg);
  await mkdir(join(out, 'diff'), { recursive: true });

  const ids = (await readdir(base))
    .filter((f) => f.endsWith('.png'))
    .map((f) => f.slice(0, -4))
    .filter((id) => !filter || filter.test(id))
    .sort();
  const rows: Row[] = [];
  for (const id of ids) {
    const candPng = join(cand, `${id}.png`);
    if (!existsSync(candPng)) {
      rows.push({
        id,
        status: 'falta',
        ratio: 1,
        diffPixels: 0,
        size: '-',
        textEqual: false,
        firstTextDiff: 'sin captura candidata',
      });
      continue;
    }
    const [a, b] = await Promise.all([readPng(join(base, `${id}.png`)), readPng(candPng)]);
    const [ma, mb] = await Promise.all(
      [join(base, `${id}.json`), join(cand, `${id}.json`)].map(
        async (p) => JSON.parse(await readFile(p, 'utf8')) as Meta,
      ),
    );
    const textEqual = ma.text === mb.text;
    const firstTextDiff = textEqual ? '' : firstDiff(ma.text, mb.text);
    if (a.width !== b.width || a.height !== b.height) {
      rows.push({
        id,
        status: 'tamano-distinto',
        ratio: 1,
        diffPixels: 0,
        size: `${a.width}x${a.height} vs ${b.width}x${b.height}`,
        textEqual,
        firstTextDiff,
      });
      continue;
    }
    const diff = new PNG({ width: a.width, height: a.height });
    const diffPixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold });
    const ratio = diffPixels / (a.width * a.height);
    const status = ratio <= maxRatio ? 'ok' : 'fuera-de-umbral';
    if (status !== 'ok') await writeFile(join(out, 'diff', `${id}.png`), PNG.sync.write(diff));
    rows.push({
      id,
      status,
      ratio,
      diffPixels,
      size: `${a.width}x${a.height}`,
      textEqual,
      firstTextDiff,
    });
  }

  const bad = rows.filter((r) => r.status !== 'ok' || !r.textEqual);
  await writeFile(join(out, 'report.json'), JSON.stringify({ threshold, maxRatio, rows }, null, 1));
  const worst = [...rows].sort((x, y) => y.ratio - x.ratio).slice(0, 15);
  const md = [
    `# Informe de comparación visual`,
    ``,
    `Umbral por píxel: ${threshold} | razón máxima de píxeles distintos: ${maxRatio}`,
    `Comparaciones: ${rows.length} | fuera de umbral o con texto distinto: ${bad.length}`,
    ``,
    `| id | estado | píxeles distintos | razón | texto igual |`,
    `|---|---|---|---|---|`,
    ...worst.map(
      (r) =>
        `| ${r.id} | ${r.status} | ${r.diffPixels} | ${(r.ratio * 100).toFixed(4)} % | ${r.textEqual ? 'sí' : 'NO: ' + r.firstTextDiff} |`,
    ),
  ].join('\n');
  await writeFile(join(out, 'report.md'), md + '\n');
  console.log(md);
  process.exit(bad.length === 0 ? 0 : 1);
}

await main();
