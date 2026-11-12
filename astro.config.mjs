// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { LANGS, pageKeys, pathFor } from './src/i18n/routes.ts';

// Alternativas por idioma de cada página (los slugs difieren: /es/precios/ y /en/pricing/).
/** @type {Map<string, { lang: string, path: string }[]>} */
const ALTERNATES = new Map();
for (const key of pageKeys) {
  const links = LANGS.map((lang) => ({ lang, path: pathFor(key, lang) }));
  for (const { path } of links) ALTERNATES.set(path, links);
}

// Salida estática (por defecto). Sin adaptador: el despliegue no forma parte de este trabajo.
export default defineConfig({
  site: 'https://www.softseguros.com',
  trailingSlash: 'always',
  // Astro 7 cambió el valor por defecto a 'jsx'. Se fija `true` (comportamiento anterior)
  // y se mide con las capturas; si el espaciado en línea difiere, se ajusta en la Fase 2.
  compressHTML: true,
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true,
    },
  },
  integrations: [
    sitemap({
      // Fuera del sitemap: la raíz (solo redirige a /es/) y la página 404.
      filter: (page) => {
        const path = new URL(page).pathname;
        // Tampoco entran el 404 ni las páginas Offline (noindex).
        const excluded = ['/404', 'sin-conexion', '/offline/'];
        return path !== '/' && !excluded.some((part) => path.includes(part));
      },
      serialize(item) {
        const links = ALTERNATES.get(new URL(item.url).pathname);
        if (links)
          item.links = links.map(({ lang, path }) => ({
            lang,
            url: new URL(path, 'https://www.softseguros.com').href,
          }));
        return item;
      },
      // Códigos hreflang provisionales (pregunta 7 de MIGRACION.md).
      i18n: {
        defaultLocale: 'es',
        locales: { es: 'es', en: 'en' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
