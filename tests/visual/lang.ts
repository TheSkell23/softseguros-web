// Idioma de las pruebas de interacción: TEST_LANG=en repite la suite en inglés.
// Sitio actual: ?lang=en. Candidato: ruta /en/... Los textos fijos pasan por el mismo catálogo que usa el candidato.
import process from 'node:process';
import { translate } from '../../src/i18n/index.ts';
import { pageKeys, pathFor, type Lang } from '../../src/i18n/routes.ts';

export const TLANG: Lang = process.env.TEST_LANG === 'en' ? 'en' : 'es';
/** Texto de la interfaz tal como se ve en el idioma de la prueba. */
export const tr = (text: string): string => translate(TLANG, text);
/** Convierte una ruta /es/... a la del idioma de la prueba (conserva el hash). */
export const localPath = (esPath: string): string => {
  const hashAt = esPath.indexOf('#');
  const base = hashAt < 0 ? esPath : esPath.slice(0, hashAt);
  const key = pageKeys.find((k) => pathFor(k, 'es') === base);
  return key ? pathFor(key, TLANG) + (hashAt < 0 ? '' : esPath.slice(hashAt)) : esPath;
};
/** URL del sitio actual (puerto 4173) o del candidato (4174) para una página. */
export const urlFor = (side: 'actual' | 'candidato', current: string, esPath: string): string =>
  side === 'actual'
    ? `http://127.0.0.1:4173/${current}.dc.html?tod=day${TLANG === 'en' ? '&lang=en' : ''}`
    : `http://127.0.0.1:4174${localPath(esPath)}?tod=day`;
