import { pageKeys, slugs } from './routes.ts';
import type { Lang, PageKey } from './routes.ts';

/** Parámetros de `getStaticPaths` para un idioma, a partir de la tabla de rutas. */
export function staticPathsFor(
  lang: Lang,
): { params: { slug: string | undefined }; props: { pageKey: PageKey } }[] {
  return pageKeys.map((pageKey) => {
    const slug = slugs[pageKey][lang];
    return { params: { slug: slug === '' ? undefined : slug }, props: { pageKey } };
  });
}
