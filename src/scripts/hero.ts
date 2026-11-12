// Port de initTod, initHero y la barra de progreso de site/*.dc.html (misma lógica, sin React).

type Tod = 'day' | 'sunset' | 'night';

function autoTod(): Tod {
  const now = new Date();
  const t = now.getHours() + now.getMinutes() / 60;
  return t >= 7 && t < 17 ? 'day' : t >= 17 && t < 19 ? 'sunset' : 'night';
}

/** Hero por horario: día 7–17 h, atardecer 17–19 h, noche el resto; `?tod=` fuerza el horario. */
export function initTod(): void {
  const set = (): void => {
    const hero = document.getElementById('hero');
    if (!hero) return;
    const forced = new URLSearchParams(location.search).get('tod');
    const mode = forced && forced !== 'auto' ? forced : autoTod();
    if (hero.getAttribute('data-tod') !== mode) hero.setAttribute('data-tod', mode);
    // Fase 5: las reglas de imagen del hero cuelgan de html[data-tod] (lo fija antes el script del <head>).
    if (document.documentElement.getAttribute('data-tod') !== mode)
      document.documentElement.setAttribute('data-tod', mode);
    const layer = document.getElementById(
      `bg-${mode === 'day' ? 'day' : mode === 'sunset' ? 'sunset' : 'night'}`,
    );
    if (layer && !layer.style.backgroundImage && layer.dataset.bg) {
      layer.style.backgroundImage = `url(${layer.dataset.bg})`;
    }
  };
  set();
  window.setInterval(set, 30000);
}

/** Menú fijo que se compacta al hacer scroll, pausa del hero fuera de pantalla y parallax del escenario. */
export function initHero(): void {
  const hero = document.getElementById('hero');
  const stage = document.getElementById('stage');
  const nav = document.getElementById('nav');
  if (!hero || !nav) return;
  const bar = nav.querySelector<HTMLElement>('.bar');
  if (!bar) return;

  const measure = (): void => {
    const was = nav.classList.contains('scrolled');
    ['.nv-name', '.lang', '.login'].forEach((selector, i) => {
      const el = nav.querySelector<HTMLElement>(selector);
      const name = ['--wn', '--wl', '--wi'][i];
      if (el && name) nav.style.setProperty(name, `${el.scrollWidth + 2}px`);
    });
    nav.classList.add('scrolled', 'm');
    const w = bar.offsetWidth;
    nav.classList.remove('m');
    if (!was) nav.classList.remove('scrolled');
    void bar.offsetWidth;
    nav.style.setProperty('--cw', `${Math.min(w, innerWidth - 24)}px`);
  };
  const onScroll = (): void => {
    const y = window.scrollY;
    const scrolled = nav.classList.contains('scrolled');
    if (!scrolled && y > 80) nav.classList.add('scrolled');
    else if (scrolled && y < 30) nav.classList.remove('scrolled');
  };

  let calmTimer = 0;
  const calm = (): void => {
    nav.classList.add('nt');
    measure();
    clearTimeout(calmTimer);
    calmTimer = window.setTimeout(() => nav.classList.remove('nt'), 120);
  };
  nav.classList.add('nt');
  measure();
  onScroll();
  if (document.fonts) {
    void document.fonts.ready.then(calm);
    // Las fuentes propias se piden al primer uso: `ready` ya puede estar resuelta antes de que lleguen,
    // y el menú mide el ancho de los textos. Se vuelve a medir cuando termina cada carga.
    document.fonts.addEventListener('loadingdone', calm);
  }
  nav.querySelectorAll('img').forEach((img) => {
    if (!img.complete) img.addEventListener('load', calm);
  });
  window.addEventListener('load', calm);
  clearTimeout(calmTimer);
  calmTimer = window.setTimeout(() => nav.classList.remove('nt'), 700);

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(calm, 80);
  });
  let frame = 0;
  window.addEventListener(
    'scroll',
    () => {
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          onScroll();
        });
      }
    },
    { passive: true },
  );
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first) hero.classList.toggle('paused', !first.isIntersecting);
    });
    io.observe(hero);
  }

  if (
    !matchMedia('(hover:hover) and (pointer:fine)').matches ||
    matchMedia('(prefers-reduced-motion:reduce)').matches
  )
    return;
  let tx = 0;
  let ty = 0;
  let raf = 0;
  const apply = (): void => {
    raf = 0;
    if (!stage) return;
    stage.style.setProperty('--ry', `${tx.toFixed(2)}deg`);
    stage.style.setProperty('--rx', `${ty.toFixed(2)}deg`);
  };
  hero.addEventListener(
    'pointermove',
    (e) => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 5;
      ty = -((e.clientY - r.top) / r.height - 0.5) * 3;
      if (!raf) raf = requestAnimationFrame(apply);
    },
    { passive: true },
  );
  hero.addEventListener('pointerleave', () => {
    tx = ty = 0;
    if (!raf) raf = requestAnimationFrame(apply);
  });
}

/** Barra de progreso de lectura (#spbar), alimentada con --sp. */
export function initProgress(): void {
  const bar = document.getElementById('spbar');
  const update = (): void => {
    const d = document.documentElement;
    bar?.style.setProperty(
      '--sp',
      Math.min(1, d.scrollTop / Math.max(1, d.scrollHeight - innerHeight)).toFixed(4),
    );
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}
