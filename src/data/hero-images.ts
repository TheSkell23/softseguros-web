// Imagen de fondo del hero según horario y ancho de pantalla (misma elección que las reglas CSS de inner.css y
// home.css). Se usa para fijar `html[data-tod]` y precargar solo la imagen que se va a ver (Fase 5).
import type { PageKey } from '../i18n/routes.ts';

export type Tod = 'day' | 'sunset' | 'night';
export type Size = 'm' | 't' | 'd';

const inner: Record<Tod, Record<Size, string>> = {
  day: { m: 'hero-int-m', t: 'hero-int-t', d: 'hero-dia' },
  sunset: { m: 'hero-ints-m', t: 'hero-ints-t', d: 'hero-tarde' },
  night: { m: 'hero-intn-m', t: 'hero-intn-t', d: 'hero-noche' },
};
const home: Record<Tod, Record<Size, string>> = {
  day: { m: 'hero-day-m', t: 'hero-day-t', d: 'hero-day' },
  sunset: { m: 'hero-sunset-m', t: 'hero-sunset-t', d: 'hero-sunset' },
  night: { m: 'hero-night-m', t: 'hero-night-t', d: 'hero-night' },
};

/** Rutas públicas de las imágenes del hero de una página, por horario y tamaño. */
export function heroImages(pageKey: PageKey): Record<Tod, Record<Size, string>> {
  const names = pageKey === 'inicio' ? home : inner;
  const out = {} as Record<Tod, Record<Size, string>>;
  for (const tod of Object.keys(names) as Tod[]) {
    out[tod] = {} as Record<Size, string>;
    for (const size of Object.keys(names[tod]) as Size[])
      out[tod][size] = `/uploads/${names[tod][size]}.webp`;
  }
  return out;
}

/**
 * Script del <head>: fija `html[data-tod]` (misma lógica que initTod: día 7–17 h, atardecer 17–19 h, noche el
 * resto; `?tod=` fuerza el horario) y precarga la imagen del hero que corresponde al ancho actual.
 */
export function heroHeadScript(pageKey: PageKey): string {
  const map = JSON.stringify(heroImages(pageKey));
  return `(function(){var d=document.documentElement,f=new URLSearchParams(location.search).get('tod'),n=new Date(),t=n.getHours()+n.getMinutes()/60,m=f&&f!=='auto'?f:t>=7&&t<17?'day':t>=17&&t<19?'sunset':'night';d.setAttribute('data-tod',m);var s=${map}[m];if(!s)return;var w=innerWidth,l=document.createElement('link');l.rel='preload';l.as='image';l.href=s[w<=640?'m':w<=1000?'t':'d'];l.setAttribute('fetchpriority','high');document.head.appendChild(l)})();`;
}
