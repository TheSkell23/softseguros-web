// Documentos legales (Términos y Privacidad): port de `initLegal` de site/Terminos.dc.html.
// Índice lateral, apertura del acordeón por ancla `#d-N` con corrección de scroll y marca del documento actual.
export function initLegal(): void {
  const toc = document.getElementById('lg-toc') as HTMLDetailsElement | null;
  if (toc && innerWidth > 900) toc.open = true;

  const go = (id: string, push: boolean): boolean => {
    const el = document.getElementById(id);
    if (!el || el.tagName !== 'DETAILS') return false;
    (el as HTMLDetailsElement).open = true;
    if (push) {
      try {
        history.replaceState(null, '', `#${id}`);
      } catch {
        /* sin historial disponible */
      }
    }
    const pos = (): number => el.getBoundingClientRect().top + window.scrollY - 90;
    window.setTimeout(() => window.scrollTo({ top: pos(), behavior: 'smooth' }), 30);
    let userMoved = false;
    const mark = (): void => {
      userMoved = true;
    };
    (['wheel', 'touchstart', 'keydown', 'mousedown'] as const).forEach((ev) =>
      window.addEventListener(ev, mark, { once: true, passive: true }),
    );
    // El contenido cambia de altura mientras abre: se reajusta la posición hasta que la persona se mueva.
    const pin = (): void => {
      if (!userMoved && Math.abs(pos() - window.scrollY) > 3)
        window.scrollTo({ top: pos(), behavior: 'auto' });
    };
    window.setTimeout(pin, 1100);
    const t0 = Date.now();
    const timer = window.setInterval(() => {
      pin();
      if (userMoved || Date.now() - t0 > 9000) clearInterval(timer);
    }, 250);
    return true;
  };

  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#d-"]');
    if (!a) return;
    const id = (a.getAttribute('href') ?? '').slice(1);
    if (go(id, true)) {
      e.preventDefault();
      if (innerWidth <= 900 && toc && a.closest('#lg-toc')) toc.open = false;
    }
  });
  const fromHash = (): void => {
    if (location.hash) go(location.hash.slice(1), false);
  };
  window.addEventListener('hashchange', fromHash);
  if (location.hash) {
    window.setTimeout(fromHash, 500);
    window.addEventListener('load', () => window.setTimeout(fromHash, 300), { once: true });
  }

  const links = [...document.querySelectorAll<HTMLAnchorElement>('#lg-toc a')];
  const docs = [...document.querySelectorAll<HTMLElement>('details.lg-d')];
  const spy = (): void => {
    let current: string | null = null;
    docs.forEach((d) => {
      if (d.getBoundingClientRect().top < 150) current = d.id;
    });
    links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === `#${current}`));
  };
  window.addEventListener('scroll', spy, { passive: true });
  spy();
}
