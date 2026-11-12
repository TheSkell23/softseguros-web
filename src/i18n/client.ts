// Traducción en el navegador. El catálogo en inglés (~100 KB) solo se descarga si la página está en inglés:
// en español `t` devuelve el texto tal cual y no se pide ningún chunk de i18n.
import type { Lang } from './routes.ts';

export type Translate = <T>(value: T) => T;

export async function loadT(lang: Lang): Promise<Translate> {
  if (lang === 'es') return (value) => value;
  const { getT } = await import('./index.ts');
  return getT(lang);
}
