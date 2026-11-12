// Port de site/fx.js (capa de movimiento). La hoja de estilos está en src/styles/fx.css.
// Único cambio de comportamiento: la transición de salida detecta enlaces internos por ruta (antes, por ".dc.html").

const EASE = 'cubic-bezier(.2,.7,.2,1)';
const RM = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
const loadedAt = Date.now();
const rootEl = (): HTMLElement => document.getElementById('sl-root') ?? document.body;
const skip = (el: Element): boolean =>
  Boolean(el.closest('#nav,#mm,#hero,footer,.ss-reveal,.fxr,.fx-typing,script,style'));

/* ---- revelado al hacer scroll ---- */
let revealObserver: IntersectionObserver | null = null;

function pick(): HTMLElement[] {
  const r = rootEl();
  const out: HTMLElement[] = [];
  const sel =
    'h1,h2,h3,h4,p,li,figure,table,form,details,img,[class*="card"],section>div>div,section>div>a,article';
  const all = r.querySelectorAll<HTMLElement>(sel);
  for (let i = 0; i < all.length && out.length < 260; i++) {
    const el = all[i];
    if (!el || skip(el)) continue;
    const b = el.getBoundingClientRect();
    if (!b.width || b.height < 20 || b.height > 1200) continue;
    const cs = getComputedStyle(el);
    const isCard =
      parseFloat(cs.borderTopLeftRadius) >= 14 &&
      (cs.boxShadow !== 'none' ||
        parseFloat(cs.borderTopWidth) > 0 ||
        cs.backgroundImage !== 'none');
    const isText = /^(H1|H2|H3|H4|P|LI|FIGURE|TABLE|FORM|DETAILS|IMG|ARTICLE)$/.test(el.tagName);
    if (!isCard && !isText) continue;
    if (isText && el.tagName === 'P' && el.closest('li,[class*="card"]')) continue;
    if (isText && (el.tagName === 'LI' || el.tagName === 'IMG') && el.closest('table')) continue;
    out.push(el);
  }
  const set = new Set(out);
  return out.filter((el) => {
    let p = el.parentElement;
    while (p && p !== r) {
      if (set.has(p)) return false;
      p = p.parentElement;
    }
    return true;
  });
}

function reveal(el: HTMLElement): void {
  if (!el.classList.contains('fxr')) return;
  el.classList.add('fxi');
  window.setTimeout(() => {
    el.classList.remove('fxr', 'fxi');
    el.style.removeProperty('--d');
  }, 1400);
}

function initReveal(): void {
  if (RM || !('IntersectionObserver' in window)) return;
  const els = pick();
  const vh = innerHeight;
  const groups = new Map<Element | null, number>();
  els.forEach((el) => {
    const top = el.getBoundingClientRect().top;
    if (top < vh * 0.92) return;
    const p = el.parentElement;
    const n = groups.get(p) ?? 0;
    groups.set(p, n + 1);
    el.style.setProperty('--d', `${Math.min(n, 6) * 0.075}s`);
    el.classList.add('fxr');
  });
  revealObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting || e.boundingClientRect.top < 0) {
          revealObserver?.unobserve(e.target);
          reveal(e.target as HTMLElement);
        }
      }),
    { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
  );
  document.querySelectorAll<HTMLElement>('.fxr').forEach((el) => revealObserver?.observe(el));
  window.setTimeout(() => {
    document.querySelectorAll<HTMLElement>('.fxr:not(.fxi)').forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.top < innerHeight && b.bottom > 0) reveal(el);
    });
  }, 4000);
}

/* ---- contenido dinámico (pestañas, filtros, chat, acordeones) ---- */
let batch: Element[] = [];
let batchFrame = 0;

function flushDyn(): void {
  batchFrame = 0;
  const queue = batch;
  batch = [];
  let k = 0;
  queue.forEach((el) => {
    if (!el.isConnected || skip(el) || !('animate' in el)) return;
    const b = el.getBoundingClientRect();
    if (b.height < 28 || b.width < 40 || b.top > innerHeight * 1.5 || b.bottom < -200) return;
    el.animate(
      [
        { opacity: 0, transform: 'translate3d(0,14px,0)' },
        { opacity: 1, transform: 'none' },
      ],
      {
        duration: 420,
        delay: Math.min(k++, 8) * 45,
        easing: EASE,
        fill: 'backwards',
      },
    );
  });
}

function bump(node: Node): void {
  const p = node.parentElement;
  if (!p || !('animate' in p) || p.closest('#nav,#mm')) return;
  if (parseFloat(getComputedStyle(p).fontSize) < 26) return;
  p.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 380, easing: 'ease-out' });
}

function initDyn(): void {
  if (RM || !window.MutationObserver) return;
  new MutationObserver((mutations) => {
    if (Date.now() - loadedAt < 2200) return;
    for (const m of mutations) {
      if (m.type === 'childList') {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) {
            const el = n as Element;
            if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.id !== 'mm') batch.push(el);
          }
        });
      } else if (
        m.type === 'characterData' &&
        /\d/.test(m.target.nodeValue ?? '') &&
        m.oldValue !== m.target.nodeValue
      ) {
        bump(m.target);
      }
    }
    if (batch.length && !batchFrame) batchFrame = requestAnimationFrame(flushDyn);
  }).observe(rootEl(), {
    childList: true,
    subtree: true,
    characterData: true,
    characterDataOldValue: true,
  });
}

/* ---- parallax del hero ---- */
function initParallax(): void {
  if (RM) return;
  const hero = document.getElementById('hero');
  if (!hero) return;
  let tick = 0;
  const update = (): void => {
    tick = 0;
    const y = window.scrollY || 0;
    const h = hero.offsetHeight || 800;
    if (y > h * 1.1) return;
    hero.style.setProperty('--py', `${(y * 0.16).toFixed(1)}px`);
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!tick) tick = requestAnimationFrame(update);
    },
    { passive: true },
  );
  update();
}

/* ---- inclinación de tarjetas y respuesta al pulsar ---- */
function initPointer(): void {
  if (RM || !window.matchMedia || !matchMedia('(hover:hover)').matches) return;
  let cur: HTMLElement | null = null;
  let raf = 0;
  let px = 0;
  let py = 0;
  const reset = (): void => {
    if (cur) {
      cur.style.removeProperty('--rx');
      cur.style.removeProperty('--ry');
      cur = null;
    }
  };
  document.addEventListener(
    'pointermove',
    (e) => {
      const c = (e.target as Element | null)?.closest<HTMLElement>('.ss-lift') ?? null;
      if (!c) {
        reset();
        return;
      }
      cur = c;
      px = e.clientX;
      py = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!cur) return;
        const r = cur.getBoundingClientRect();
        const x = (px - r.left) / r.width - 0.5;
        const y = (py - r.top) / r.height - 0.5;
        const mx = Math.min(
          1,
          Math.max(r.width, r.height) < 420 ? 1 : 420 / Math.max(r.width, r.height),
        );
        cur.style.setProperty('--ry', `${(x * 5 * mx).toFixed(2)}deg`);
        cur.style.setProperty('--rx', `${(-y * 4 * mx).toFixed(2)}deg`);
      });
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', reset, true);
}

function initPress(): void {
  if (RM) return;
  document.addEventListener(
    'pointerdown',
    (e) => {
      const b = (e.target as Element | null)?.closest<HTMLButtonElement>(
        'button:not(#mbtn):not(#lbtn),a.rf,.ss-press',
      );
      if (!b || !('animate' in b) || b.disabled) return;
      b.animate([{ transform: 'scale(.965)' }, { transform: 'scale(1)' }], {
        duration: 320,
        easing: 'cubic-bezier(.2,.9,.25,1.3)',
      });
    },
    { passive: true },
  );
}

/* ---- transición al salir de la página ---- */
function initLeave(): void {
  if (RM) return;
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
      if (
        !a ||
        e.defaultPrevented ||
        e.button ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        a.target === '_blank'
      )
        return;
      const href = a.getAttribute('href') ?? '';
      if (!href.startsWith('/')) return;
      const path = href.split('#')[0] ?? '';
      if (path === '' || path === location.pathname) return;
      const r = document.getElementById('sl-root');
      r?.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 220,
        easing: 'ease-in',
        fill: 'forwards',
      });
    },
    false,
  );
  window.addEventListener('pageshow', (e) => {
    if (e.persisted)
      document
        .getElementById('sl-root')
        ?.getAnimations()
        .forEach((a) => a.cancel());
  });
}

declare global {
  interface Window {
    __ssTyping?: (show: boolean) => void;
  }
}

/** Indicador "escribiendo…" del chat de FAQ (lo usa la isla del chat en la Fase 3). */
window.__ssTyping = (show: boolean): void => {
  const log = document.getElementById('fq-log');
  if (!log) return;
  let t = document.getElementById('fx-typing');
  if (show && !t) {
    t = document.createElement('div');
    t.id = 'fx-typing';
    t.className = 'fx-typing';
    t.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(t);
    log.scrollTop = log.scrollHeight;
  } else if (!show && t) t.remove();
};

export function initFx(): void {
  const init = (): void => {
    initParallax();
    initPointer();
    initPress();
    initLeave();
    initDyn();
    window.setTimeout(initReveal, 350);
  };
  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
}
