// Uso: node tests/visual/diffgrid.ts <baseline.png> <candidata.png>
// Muestra dónde se concentran los píxeles distintos (cuadrícula 8 x 6) para localizar la causa de una diferencia.
import { readFileSync } from 'node:fs';
import process from 'node:process';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const [pa, pb] = process.argv.slice(2);
if (!pa || !pb) throw new Error('Uso: diffgrid.ts <baseline.png> <candidata.png>');
const a = PNG.sync.read(readFileSync(pa));
const b = PNG.sync.read(readFileSync(pb));
if (a.width !== b.width || a.height !== b.height)
  throw new Error(`Tamaños distintos: ${a.width}x${a.height} vs ${b.width}x${b.height}`);
const d = new PNG({ width: a.width, height: a.height });
const n = pixelmatch(a.data, b.data, d.data, a.width, a.height, { threshold: 0.1 });
const gx = 8;
const gy = 6;
const cnt = Array.from({ length: gy }, () => Array<number>(gx).fill(0));
for (let y = 0; y < a.height; y++) {
  for (let x = 0; x < a.width; x++) {
    const i = (y * a.width + x) * 4;
    if (d.data[i] === 255 && d.data[i + 1] === 0 && d.data[i + 2] === 0) {
      const row = cnt[Math.floor((y * gy) / a.height)];
      if (row) row[Math.floor((x * gx) / a.width)]++;
    }
  }
}
console.log(`píxeles distintos: ${n} de ${a.width * a.height} (${a.width}x${a.height})`);
cnt.forEach((r) => console.log(r.map((v) => String(v).padStart(6)).join(' ')));
