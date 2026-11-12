// Tabla única de rutas. Los slugs son PROVISIONALES (preguntas 1 y 2 de MIGRACION.md).
export const LANGS = ['es', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'es';

export type PageKey =
  | 'inicio'
  | 'producto'
  | 'soluciones'
  | 'precios'
  | 'contacto'
  | 'faq'
  | 'prueba'
  | 'blog'
  | 'ayuda'
  | 'conoce'
  | 'terminos'
  | 'privacidad';

/** Slug sin barras. Cadena vacía = raíz del idioma. */
export const slugs: Record<PageKey, Record<Lang, string>> = {
  inicio: { es: '', en: '' },
  producto: { es: 'producto', en: 'product' },
  soluciones: { es: 'soluciones', en: 'solutions' },
  precios: { es: 'precios', en: 'pricing' },
  contacto: { es: 'contacto', en: 'contact' },
  faq: { es: 'preguntas-frecuentes', en: 'faq' },
  prueba: { es: 'prueba-gratis', en: 'free-trial' },
  blog: { es: 'blog', en: 'blog' },
  ayuda: { es: 'ayuda', en: 'help' },
  conoce: { es: 'conoce-softseguros', en: 'meet-softseguros' },
  terminos: { es: 'terminos', en: 'terms' },
  privacidad: { es: 'privacidad', en: 'privacy' },
};

export const pageKeys = Object.keys(slugs) as PageKey[];

/** Ruta relativa al sitio, con barra inicial y final (salida en carpetas: producto/index.html). */
export function pathFor(key: PageKey, lang: Lang): string {
  const slug = slugs[key][lang];
  return slug === '' ? `/${lang}/` : `/${lang}/${slug}/`;
}

/** Todas las variantes de idioma de una página, para hreflang. */
export function alternates(key: PageKey): { lang: Lang; path: string }[] {
  return LANGS.map((lang) => ({ lang, path: pathFor(key, lang) }));
}
