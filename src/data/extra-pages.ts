// Páginas autónomas fuera del mapa principal de rutas (no entran en el sitemap ni en llms.txt).
import type { Lang } from '../i18n/routes.ts';
import { seoEs, type PageSeo } from './seo.ts';

export type ExtraKey = 'error404' | 'offline';

export const extraPaths: Record<ExtraKey, Record<Lang, string>> = {
  error404: { es: '/404.html', en: '/en/404/' },
  offline: { es: '/es/sin-conexion/', en: '/en/offline/' },
};

const titles: Record<ExtraKey, Record<Lang, string>> = {
  error404: { es: 'Error 404 | Softseguros', en: 'Error 404 | Softseguros' },
  offline: { es: 'Sin conexión | Softseguros', en: 'No connection | Softseguros' },
};

export const extraAlternates = (key: ExtraKey): { lang: Lang; path: string }[] =>
  (['es', 'en'] as const).map((lang) => ({ lang, path: extraPaths[key][lang] }));

/** Metadatos: noindex y sin datos estructurados de la portada. */
export function extraSeo(key: ExtraKey, lang: Lang): PageSeo {
  const title = titles[key][lang];
  return {
    ...seoEs.inicio,
    title,
    ogTitle: title,
    description: title,
    ogDescription: title,
    robots: 'noindex',
    jsonLd: {},
  };
}
