// Port de initGlass: filtro SVG de refracción (feDisplacementMap) para los elementos [data-rf].

const NS = 'http://www.w3.org/2000/svg';

function gradient(
  id: string,
  x2: number,
  y2: number,
  colors: [string, string, string],
  b: number,
): string {
  const span = x2 || y2;
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${colors[0]}"/><stop offset="${b / span}" stop-color="${colors[1]}"/><stop offset="${1 - b / span}" stop-color="${colors[1]}"/><stop offset="1" stop-color="${colors[2]}"/></linearGradient>`;
}

function map(w: number, h: number, b: number): string {
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs>${gradient('a', w, 0, ['rgb(255,0,0)', 'rgb(128,0,0)', 'rgb(0,0,0)'], b)}${gradient('c', 0, h, ['rgb(0,255,0)', 'rgb(0,128,0)', 'rgb(0,0,0)'], b)}</defs><rect width="${w}" height="${h}" fill="#000"/><rect width="${w}" height="${h}" fill="url(#a)"/><rect width="${w}" height="${h}" fill="url(#c)" style="mix-blend-mode:screen"/></svg>`,
    )
  );
}

export function initGlass(): void {
  const root = document.getElementById('sl-root');
  if (!root) return;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('style', 'position:absolute;pointer-events:none');
  svg.setAttribute('aria-hidden', 'true');
  const defs = document.createElementNS(NS, 'defs');
  svg.appendChild(defs);
  root.appendChild(svg);

  const ids = new WeakMap<Element, string>();
  let counter = 0;
  const channel = (n: string, scale: number, matrix: string): string =>
    `<feDisplacementMap in="SourceGraphic" in2="m" scale="${scale.toFixed(1)}" xChannelSelector="R" yChannelSelector="G" result="d${n}"/><feColorMatrix in="d${n}" values="${matrix}" result="c${n}"/>`;

  const make = (el: HTMLElement): void => {
    const w = Math.round(el.offsetWidth);
    const h = Math.round(el.offsetHeight);
    if (!w || !h) return;
    let id = ids.get(el);
    if (!id) {
      id = `sf${++counter}`;
      ids.set(el, id);
    }
    const b = Math.max(8, Math.min(24, Math.min(w, h) * 0.38));
    const k = b * 1.9;
    defs.querySelector(`#${id}`)?.remove();
    const filter = document.createElementNS(NS, 'filter');
    (
      [
        ['id', id],
        ['filterUnits', 'userSpaceOnUse'],
        ['primitiveUnits', 'userSpaceOnUse'],
        ['x', '0'],
        ['y', '0'],
        ['width', String(w)],
        ['height', String(h)],
        ['color-interpolation-filters', 'sRGB'],
      ] as const
    ).forEach(([name, value]) => filter.setAttribute(name, value));
    filter.innerHTML =
      `<feImage href="${map(w, h, b)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="m"/>` +
      channel('r', k, '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0') +
      channel('g', k * 1.22, '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0') +
      channel('b', k * 1.44, '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0') +
      '<feBlend in="cr" in2="cg" mode="screen" result="rg"/><feBlend in="rg" in2="cb" mode="screen"/>';
    defs.appendChild(filter);
    const value = `url(#${id}) blur(2px) saturate(1.6)`;
    el.style.backdropFilter = value;
    el.style.setProperty('-webkit-backdrop-filter', value);
  };

  let firstPass = true;
  const queue = new Set<HTMLElement>();
  let timer = 0;
  const ro = new ResizeObserver((entries) => {
    if (firstPass) {
      firstPass = false;
      entries.forEach((e) => make(e.target as HTMLElement));
      return;
    }
    entries.forEach((e) => queue.add(e.target as HTMLElement));
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      queue.forEach((t) => make(t));
      queue.clear();
    }, 160);
  });
  const seen = new Set<Element>();
  const scan = (): void => {
    root.querySelectorAll<HTMLElement>('[data-rf]').forEach((e) => {
      if (!seen.has(e)) {
        seen.add(e);
        ro.observe(e);
      }
    });
  };
  scan();
  new MutationObserver(scan).observe(root, { childList: true, subtree: true });
}
