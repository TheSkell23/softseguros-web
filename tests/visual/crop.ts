// Uso: node tests/visual/crop.ts <baseline.png> <candidata.png> <x> <y> <ancho> <alto> <salida.png> [zoom]
// Apila recorte de la base, de la candidata y de la diferencia, ampliados, para inspeccionar a ojo.
import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const [pa, pb, sx, sy, sw, sh, out, sz] = process.argv.slice(2);
if (!pa || !pb || !sx || !sy || !sw || !sh || !out) throw new Error('Faltan argumentos');
const [x0, y0, w, h] = [sx, sy, sw, sh].map(Number) as [number, number, number, number];
const zoom = Number(sz ?? 2);
const a = PNG.sync.read(readFileSync(pa));
const b = PNG.sync.read(readFileSync(pb));
const diff = new PNG({ width: a.width, height: a.height });
pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
const res = new PNG({ width: w * zoom, height: h * zoom * 3 + 8 });
const put = (src: PNG, band: number): void => {
  for (let y = 0; y < h * zoom; y++) {
    for (let x = 0; x < w * zoom; x++) {
      const si = ((y0 + Math.floor(y / zoom)) * src.width + (x0 + Math.floor(x / zoom))) * 4;
      const di = ((band * (h * zoom + 4) + y) * res.width + x) * 4;
      for (let k = 0; k < 4; k++) res.data[di + k] = src.data[si + k] ?? 0;
    }
  }
};
put(a, 0);
put(b, 1);
put(diff, 2);
writeFileSync(out, PNG.sync.write(res));
