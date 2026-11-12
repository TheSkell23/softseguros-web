// Port de initMobileNav: el menú móvil (#mm) se construye al abrir, leyendo el DOM del menú de escritorio.

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export function initMobileNav(): void {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const close = (): void => {
    nav.classList.remove('mo');
    document.getElementById('mbtn')?.setAttribute('aria-expanded', 'false');
  };

  const build = (): void => {
    let mm = document.getElementById('mm');
    if (!mm) {
      mm = document.createElement('div');
      mm.id = 'mm';
      nav.appendChild(mm);
    }
    const menu = nav.querySelector('.nv-menu');
    let html = '';
    if (menu) {
      [...menu.children].forEach((child) => {
        const a = child.tagName === 'A' ? child : child.querySelector(':scope > a');
        if (!a) return;
        html += `<a href="${esc(a.getAttribute('href') ?? '#')}">${esc((a.textContent ?? '').trim())}</a>`;
        const subs = [...child.querySelectorAll('.dd-p a')];
        if (subs.length) {
          html += `<div class="ms">${subs
            .map(
              (s) =>
                `<a href="${esc(s.getAttribute('href') ?? '#')}">${esc((s.textContent ?? '').trim())}</a>`,
            )
            .join('')}</div>`;
        }
      });
    }
    const login = nav.dataset.login ?? 'Ingresar';
    const trial = nav.dataset.trial ?? '7 días gratis';
    const trialHref = nav.dataset.trialHref ?? '#';
    html += `<a class="ml" href="https://app.softseguros.com/srv1/login/" target="_blank" rel="noopener">${esc(login)}</a><a class="mc" href="${esc(trialHref)}">${esc(trial)}</a>`;
    mm.innerHTML = html;
  };

  document.addEventListener('click', (e) => {
    const target = e.target as Element | null;
    const button = target?.closest('#mbtn');
    if (button) {
      if (nav.classList.contains('mo')) close();
      else {
        build();
        nav.classList.add('mo');
        button.setAttribute('aria-expanded', 'true');
      }
      return;
    }
    if (
      nav.classList.contains('mo') &&
      !(target?.closest('#mm a') === null && target?.closest('#mm'))
    )
      close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  window.addEventListener('resize', () => {
    if (innerWidth > 860) close();
  });

  // Pantallas táctiles con menú de escritorio (tablet): no hay :hover, así que el primer toque en un enlace con
  // submenú lo abre (con el foco, que activa el `.dd:focus-within` existente) y el segundo navega.
  let pointer = 'mouse';
  let armed: Element | null = null;
  document.addEventListener('pointerdown', (e) => (pointer = e.pointerType), { capture: true });
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as Element | null;
      const a = target?.closest<HTMLAnchorElement>('#nav .nv-menu .dd > a');
      const dd = a?.parentElement ?? null;
      if (a && dd && pointer !== 'mouse' && dd.querySelector('.dd-p a') && armed !== dd) {
        e.preventDefault();
        armed = dd;
        a.focus();
        return;
      }
      if (armed && !(target && armed.contains(target))) {
        armed = null;
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    },
    { capture: true },
  );

  // Botón de idioma del menú móvil: navega a la misma página en el otro idioma.
  document.getElementById('lbtn')?.addEventListener('click', (e) => {
    const href = (e.currentTarget as HTMLElement).dataset.href;
    if (href) location.assign(href);
  });
}
