// Isla de pestañas de producto (Producto y Soluciones). Port del estado `pt`, de `hashTab` y de las funciones
// `gT`/`goSync` de site/*.dc.html. Los paneles ya están en el HTML; aquí solo se alterna cuál se ve.

const EASE = 'cubic-bezier(.2,.7,.2,1)';
const loadedAt = Date.now();

export function initTabs(): void {
  const list = document.querySelector<HTMLElement>('[data-tabs]');
  if (!list) return;
  const styleOn = list.dataset.styleOn ?? '';
  const styleOff = list.dataset.styleOff ?? '';
  const hashes = JSON.parse(list.dataset.hashes ?? '{}') as Record<string, number>;
  const buttons = [...list.querySelectorAll<HTMLElement>('[data-tab]')];
  const panels = [...document.querySelectorAll<HTMLElement>('[data-panel]')];
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  const scrollToTabs = (): void => {
    const el = document.getElementById('productos');
    if (el)
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 70,
        behavior: 'smooth',
      });
  };

  const select = (index: number): void => {
    buttons.forEach((b, i) => {
      b.setAttribute('style', i === index ? styleOn : styleOff);
      b.setAttribute('aria-selected', String(i === index));
    });
    let shown: HTMLElement | null = null;
    panels.forEach((p) => {
      const active = Number(p.dataset.panel) === index;
      p.style.display = active ? 'contents' : 'none';
      if (active) shown = p.firstElementChild as HTMLElement | null;
    });
    // El runtime anima el contenido que se añade tras la carga (fx.js, contenido dinámico): se reproduce.
    const el = shown as HTMLElement | null;
    if (el && !reduced && Date.now() - loadedAt >= 2200 && 'animate' in el) {
      const b = el.getBoundingClientRect();
      if (b.height >= 28 && b.width >= 40 && b.top <= innerHeight * 1.5 && b.bottom >= -200) {
        el.animate(
          [
            { opacity: 0, transform: 'translate3d(0,14px,0)' },
            { opacity: 1, transform: 'none' },
          ],
          {
            duration: 420,
            delay: 0,
            easing: EASE,
            fill: 'backwards',
          },
        );
      }
    }
  };

  buttons.forEach((b, i) => b.addEventListener('click', () => select(i)));
  document.querySelectorAll<HTMLElement>('[data-go-tab]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      select(Number(a.dataset.goTab));
      scrollToTabs();
    });
  });

  const fromHash = (): void => {
    const h = (location.hash || '').toLowerCase();
    const index = hashes[h];
    if (index !== undefined) {
      select(index);
      window.setTimeout(scrollToTabs, 80);
    }
  };
  fromHash();
  window.addEventListener('hashchange', fromHash);
}
