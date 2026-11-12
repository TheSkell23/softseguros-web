// Uso: node scripts-migracion/gen-sw.mjs   (después de `astro build`; lo corre `npm run build` y Vercel)
// Genera dist/sw.js: un service worker que guarda en el dispositivo la página «Sin conexión» (ES y EN) con todo lo
// que necesita, y la muestra cuando la persona intenta abrir una página del sitio sin internet, en lugar de la
// pantalla del navegador (el dinosaurio). Con conexión no cambia nada: las páginas siempre se piden a la red.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, posix } from 'node:path';

const DIST = 'dist';
const OFFLINE = { es: '/es/sin-conexion/', en: '/en/offline/' };

const fileOf = (url) => join(DIST, url.endsWith('/') ? `${url}index.html` : url);
const assets = new Set();
const queue = [];
const add = (url) => {
  if (!url.startsWith('/') || url.startsWith('//') || assets.has(url)) return;
  if (!existsSync(fileOf(url))) throw new Error(`gen-sw: no existe ${url}`);
  assets.add(url);
  queue.push(url);
};

for (const page of Object.values(OFFLINE)) {
  const html = readFileSync(fileOf(page), 'utf8');
  // Recursos del documento: hojas de estilo, fuentes precargadas, scripts, imágenes e iconos.
  for (const m of html.matchAll(/(?:href|src)="(\/(?:_astro|uploads)\/[^"?#]+)"/g)) add(m[1]);
  for (const m of html.matchAll(/url\((?:'|")?(\/(?:_astro|uploads)\/[^)'"?#]+)/g)) add(m[1]);
}
// Dependencias: imports de los scripts (estáticos y dinámicos) y url() de las hojas de estilo.
while (queue.length) {
  const url = queue.shift();
  const base = posix.dirname(url);
  if (url.endsWith('.js')) {
    const js = readFileSync(fileOf(url), 'utf8');
    // Imports relativos con comillas simples, dobles o invertidas: `import("./x.js")`, `from"./x.js"`.
    // En el script principal solo se sigue la rama de las páginas autónomas (standalone): las demás islas
    // (pestañas, calculadora, FAQ…) nunca se ejecutan en la página «Sin conexión».
    const isMain = url.includes('_astro_type_script_');
    for (const m of js.matchAll(/(?:from|import)\s*\(?\s*["'`](\.{1,2}\/[^"'`]+\.js)["'`]/g)) {
      if (isMain && !/\/standalone\./.test(m[1])) continue;
      add(posix.join(base, m[1]));
    }
  } else if (url.endsWith('.css')) {
    const css = readFileSync(fileOf(url), 'utf8');
    for (const m of css.matchAll(/url\((?:'|")?([^)'"]+)/g)) {
      const ref = m[1].split(/[?#]/)[0];
      if (ref.startsWith('data:') || /^https?:/.test(ref)) continue;
      // Fuentes: solo las que la página precarga (latinas); el navegador no pide las demás.
      if (/\.(woff2?|ttf|otf)$/.test(ref)) continue;
      add(ref.startsWith('/') ? ref : posix.join(base, ref));
    }
  }
}

const list = [...Object.values(OFFLINE), ...[...assets].sort()];
// La versión cambia cuando cambia cualquiera de los archivos guardados: así el navegador actualiza la copia.
const hash = createHash('sha256');
for (const url of list) hash.update(url).update(readFileSync(fileOf(url)));
const version = hash.digest('hex').slice(0, 12);

const sw = `// GENERADO por scripts-migracion/gen-sw.mjs. No editar a mano.
const CACHE = 'ss-offline-${version}';
const OFFLINE = ${JSON.stringify(OFFLINE)};
const PRECACHE = ${JSON.stringify(list)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('ss-offline-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Páginas: siempre de la red; sin conexión, la página «Sin conexión» en el idioma de la dirección.
  if (request.mode === 'navigate') {
    const fallback = url.pathname.startsWith('/en/') ? OFFLINE.en : OFFLINE.es;
    event.respondWith(fetch(request).catch(() => caches.match(fallback)));
    return;
  }
  // Recursos de la página «Sin conexión»: de la red y, si falla, de la copia guardada.
  if (PRECACHE.includes(url.pathname)) {
    event.respondWith(fetch(request).catch(() => caches.match(url.pathname)));
  }
});
`;
writeFileSync(join(DIST, 'sw.js'), sw);
console.log(`gen-sw: dist/sw.js (versión ${version}, ${list.length} archivos guardados)`);
for (const url of list) console.log('  ' + url);
