// Punto de entrada de los scripts compartidos. Mismo orden que componentDidMount de site/*.dc.html.
import { initFx } from './fx.ts';
import { initGlass } from './glass.ts';
import { initHero, initProgress, initTod } from './hero.ts';
import { initLife, initReveal } from './life.ts';
import { initMobileNav } from './mobile-nav.ts';
import { initOffscreenPause } from './offscreen.ts';

// Las páginas autónomas (404 y Offline) no llevan menú, hero ni efectos globales: solo su propia isla.
if (document.querySelector('[data-standalone]')) {
  void import('./standalone.ts').then((m) => m.initStandalone());
} else {
  initTod();
  initHero();
  initGlass();
  initMobileNav();
  initLife();
  initProgress();
  initReveal();
  initFx();
  initOffscreenPause();
}

// Botones con destino (`<button data-href>`, p. ej. «Ingresa» y «Agenda una demo» del hero de Inicio): son botones
// por su diseño, pero llevan a una página externa, que se abre en una pestaña nueva.
document.addEventListener('click', (e) => {
  const button = (e.target as Element | null)?.closest<HTMLElement>('button[data-href]');
  const href = button?.dataset.href;
  if (href) window.open(href, '_blank', 'noopener');
});

// Islas: se cargan solo si la página las usa. No se declaran como <script> dentro de los componentes porque Astro
// los inserta en el DOM junto al componente y rompería selectores como `section:has(+footer.ft)` del CSS original.
if (document.querySelector('[data-tabs]')) void import('./tabs.ts').then((m) => m.initTabs());
if (document.querySelector('[data-home-tabs], [data-home-slider]'))
  void import('./home.ts').then((m) => m.initHome());
if (document.querySelector('[data-price-action]'))
  void import('./price.ts').then((m) => m.initPrice());
if (document.querySelector('[data-contact-topic]'))
  void import('./contact.ts').then((m) => m.initContact());
if (document.querySelector('[data-faq-cat]')) void import('./faq.ts').then((m) => m.initFaq());
if (document.querySelector('[data-trial-submit]'))
  void import('./trial.ts').then((m) => m.initTrial());
if (document.querySelector('[data-blog-cat]')) void import('./blog.ts').then((m) => m.initBlog());
if (document.querySelector('[data-help-toggle]'))
  void import('./help.ts').then((m) => m.initHelp());
if (document.querySelector('.cs-vid')) void import('./video.ts').then((m) => m.initVideo());
if (document.querySelector('#lg-toc, details.lg-d'))
  void import('./legal.ts').then((m) => m.initLegal());
