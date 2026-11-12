import { pathFor, type Lang, type PageKey } from '../i18n/routes.ts';
import { seoEs, type PageSeo } from './seo.ts';
import { jsonLdEn, seoEn } from './seo-en.ts';

const translateLd = (value: unknown): unknown => {
  if (typeof value === 'string') return jsonLdEn[value] ?? value;
  if (Array.isArray(value)) return value.map(translateLd);
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, translateLd(v)]));
  return value;
};

/** Metadatos por idioma: español desde la fuente, inglés desde el catálogo tipado `seoEn`. */
export function seoFor(pageKey: PageKey, lang: Lang, site: URL): PageSeo {
  const source = seoEs[pageKey];
  const texts = lang === 'en' ? seoEn[pageKey] : source;
  const canonical = new URL(pathFor(pageKey, lang), site).href;
  const jsonLd = (
    lang === 'en' ? translateLd(structuredClone(source.jsonLd)) : structuredClone(source.jsonLd)
  ) as PageSeo['jsonLd'];
  if (jsonLd['@type'] === 'WebPage') {
    jsonLd.url = canonical;
    jsonLd.inLanguage = lang;
    jsonLd.name = texts.title;
  }
  return {
    ...source,
    title: texts.title,
    description: texts.description,
    ogTitle: texts.ogTitle,
    ogDescription: texts.ogDescription,
    jsonLd,
  };
}
