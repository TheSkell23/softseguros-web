// Uso: node scripts-migracion/serve-dist.mjs [puerto]   (después de `astro build`)
// Servidor local de dist/ que imita un hosting estático: añade la barra final (301) a las carpetas, sirve
// `/en/404/` como error de las rutas en inglés y `/404.html` para el resto, y responde con código 404.
// `astro preview` no sirve para esto: con trailingSlash «always» muestra su propia página 404 sin barra final.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const PORT = Number(process.argv[2] ?? 4321);
const ROOT = resolve('dist');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
};
const isFile = (p) => existsSync(p) && statSync(p).isFile();

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const clean = normalize(decodeURIComponent(url.pathname)).replace(/\\/g, '/');
  if (clean.includes('..')) {
    res.writeHead(400).end();
    return;
  }
  let file = join(ROOT, clean);
  if (isFile(file)) return send(res, file, 200);
  // Carpeta con index.html: redirige a la ruta con barra final.
  if (isFile(join(file, 'index.html'))) {
    if (!url.pathname.endsWith('/')) {
      res.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end();
      return;
    }
    return send(res, join(file, 'index.html'), 200);
  }
  // Error: inglés bajo /en/, español en el resto.
  file = url.pathname.startsWith('/en/') ? join(ROOT, 'en/404/index.html') : join(ROOT, '404.html');
  return send(res, isFile(file) ? file : join(ROOT, '404.html'), 404);
}).listen(PORT, '127.0.0.1', () => console.log(`dist/ en http://127.0.0.1:${PORT}/`));

function send(res, file, status) {
  res.writeHead(status, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}
