// Matriz de comparación (MIGRACION.md, sección 9). El sitio actual es la referencia.
export type Lang = 'es' | 'en';
export type Tod = 'day' | 'sunset' | 'night';
export type Mode = 'layout' | 'hero' | 'heroel' | 'footerel';

export interface PageDef {
  key: string;
  /** Nombre del .dc.html del sitio actual (sin extensión). */
  current: string;
}

export const WIDTHS = [375, 820, 1440] as const;
export const LANGS: Lang[] = ['es', 'en'];
export const TODS: Tod[] = ['day', 'sunset', 'night'];

export const PAGES: PageDef[] = [
  { key: 'inicio', current: 'Softseguros' },
  { key: 'producto', current: 'Producto' },
  { key: 'soluciones', current: 'Soluciones' },
  { key: 'precios', current: 'Precios' },
  { key: 'contacto', current: 'Contacto' },
  { key: 'faq', current: 'FAQ' },
  { key: 'prueba', current: 'Prueba' },
  { key: 'blog', current: 'Blog' },
  { key: 'ayuda', current: 'Ayuda' },
  { key: 'conoce', current: 'Conoce' },
  { key: 'terminos', current: 'Terminos' },
  { key: 'privacidad', current: 'Privacidad' },
];

export const EXTRAS: PageDef[] = [
  { key: 'error404', current: 'Error 404' },
  { key: 'offline', current: 'Offline' },
];

/** Páginas cuyo primer pantallazo se compara en los tres horarios del hero. */
export const HERO_PAGES = ['inicio', 'producto', 'conoce'];

export interface Shot {
  id: string;
  page: PageDef;
  width: number;
  lang: Lang;
  mode: Mode;
  tod: Tod;
}

export function buildMatrix(): Shot[] {
  const shots: Shot[] = [];
  const add = (page: PageDef, width: number, lang: Lang, mode: Mode, tod: Tod): void => {
    shots.push({
      id: `${page.key}__${width}__${lang}__${mode}__${tod}`,
      page,
      width,
      lang,
      mode,
      tod,
    });
  };
  for (const page of [...PAGES, ...EXTRAS]) {
    for (const width of WIDTHS) for (const lang of LANGS) add(page, width, lang, 'layout', 'day');
  }
  for (const page of PAGES.filter((p) => HERO_PAGES.includes(p.key))) {
    for (const tod of TODS) {
      for (const width of WIDTHS) for (const lang of LANGS) add(page, width, lang, 'hero', tod);
    }
  }
  return shots;
}

/** Matriz de la Fase 2: elementos compartidos (hero y footer) en español, sin depender del contenido de cada página. */
export function buildSharedMatrix(): Shot[] {
  const shots: Shot[] = [];
  const add = (page: PageDef, width: number, mode: Mode, tod: Tod): void => {
    shots.push({
      id: `${page.key}__${width}__es__${mode}__${tod}`,
      page,
      width,
      lang: 'es',
      mode,
      tod,
    });
  };
  const inner = PAGES.filter((p) => p.key !== 'inicio');
  for (const page of inner) {
    for (const width of WIDTHS) add(page, width, 'heroel', 'day');
  }
  for (const page of inner.filter((p) => HERO_PAGES.includes(p.key))) {
    for (const tod of TODS.filter((t) => t !== 'day')) {
      for (const width of WIDTHS) add(page, width, 'heroel', tod);
    }
  }
  for (const page of PAGES) {
    for (const width of WIDTHS) add(page, width, 'footerel', 'day');
  }
  return shots;
}
