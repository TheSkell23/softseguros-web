// Port de initLife y de la parte de componentDidMount que anima el contenido:
// brillo de botones, revelado por scroll (.ss-reveal), contadores (.ss-num), chats (.ss-chat) y el "lift" con puntero.

interface Counter {
  pre: string;
  value: number;
  suf: string;
  text: string;
}
type CountedEl = HTMLElement & { _c?: Counter };

const reducedMotion = (): boolean =>
  Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

export function initLife(): void {
  const root = document.getElementById('sl-root');
  if (root) {
    root.addEventListener(
      'pointermove',
      (e) => {
        const card = (e.target as Element | null)?.closest<HTMLElement>('.ss-lift');
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty('--gx', `${e.clientX - r.left}px`);
        card.style.setProperty('--gy', `${e.clientY - r.top}px`);
      },
      { passive: true },
    );
  }
  const rm = reducedMotion();
  document.querySelectorAll<HTMLElement>('.ss-reveal').forEach((el) => {
    const siblings = [...(el.parentElement?.children ?? [])].filter((c) =>
      c.classList.contains('ss-reveal'),
    );
    const i = siblings.indexOf(el);
    if (siblings.length > 1 && !rm) {
      el.style.transitionDelay = `${Math.min(i, 5) * 90}ms`;
      el.addEventListener('transitionend', (ev) => {
        if (ev.propertyName === 'transform') el.style.transitionDelay = '';
      });
    }
  });

  const nums = [...document.querySelectorAll<CountedEl>('.ss-num')];
  nums.forEach((n) => {
    const text = n.textContent ?? '';
    const m = text.match(/^(\D*)([\d.,]+)(.*)$/);
    if (m)
      n._c = {
        pre: m[1] ?? '',
        value: parseFloat((m[2] ?? '').replace(/\./g, '').replace(',', '.')),
        suf: m[3] ?? '',
        text,
      };
  });
  const run = (n: CountedEl): void => {
    const c = n._c;
    if (!c || rm) return;
    const t0 = performance.now();
    const dur = 1400;
    const fmt = (x: number): string => Math.round(x).toLocaleString('es-CO');
    const tick = (now: number): void => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      n.textContent = p < 1 ? c.pre + fmt(c.value * e) + c.suf : c.text;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const chats = [...document.querySelectorAll<HTMLElement>('.ss-chat')];
  chats.forEach((c) =>
    c.querySelectorAll<HTMLElement>('.ss-msg').forEach((m, i) => {
      m.style.transitionDelay = `${i * 0.9 + 0.3}s`;
    }),
  );
  if (!('IntersectionObserver' in window)) {
    chats.forEach((c) => c.classList.add('go'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as CountedEl;
        io.unobserve(el);
        if (el.classList.contains('ss-num')) run(el);
        else el.classList.add('go');
      }),
    { threshold: 0.4 },
  );
  nums.forEach((n) => io.observe(n));
  chats.forEach((c) => io.observe(c));
}

/** Revelado de .ss-reveal y brillo (.shine) de botones, como en componentDidMount. */
export function initReveal(): void {
  const items = [...document.querySelectorAll<HTMLElement>('.ss-reveal')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting || e.boundingClientRect.top < 0) {
            const el = e.target as HTMLElement;
            el.classList.add('ss-in');
            io.unobserve(el);
            window.setTimeout(() => el.classList.remove('ss-reveal', 'ss-in'), 900);
          }
        }),
      { threshold: 0.12 },
    );
    items.forEach((el) => io.observe(el));
  } else items.forEach((el) => el.classList.add('ss-in'));

  const shine = (button: Element, delay: string): void => {
    const s = document.createElement('i');
    s.className = 'shine';
    s.setAttribute('aria-hidden', 'true');
    s.style.animationDelay = delay;
    button.appendChild(s);
  };
  document.querySelectorAll('#sl-root a.ss-btn').forEach((b, i) => shine(b, `${i * 0.9}s`));
  document.querySelectorAll('#sl-root button.rf, #sl-root button.btn').forEach((b, i) => {
    if (b.querySelector('.shine')) return;
    shine(b, `${(i * 0.7) % 4}s`);
  });
}
