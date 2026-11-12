// Pausa las animaciones CSS infinitas (destellos de títulos, brillo de cifras, carrusel de logos, brillo de
// botones…) de las secciones que no están en pantalla, y las reanuda al volver. No cambia nada visible: solo
// deja de calcular fotogramas que nadie ve, que era lo que hacía perder fluidez al hacer scroll en teléfonos.
// El hero ya se pausa por su cuenta (`#hero.paused`, en hero.ts).
export function initOffscreenPause(): void {
  if (!('IntersectionObserver' in window)) return;
  const targets = [...document.querySelectorAll<HTMLElement>('section, footer')].filter(
    (el) => !el.closest('#hero'),
  );
  if (!targets.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) e.target.classList.toggle('fx-off', !e.isIntersecting);
    },
    // Margen para que reanuden un poco antes de entrar y no se vea el salto.
    { rootMargin: '200px 0px' },
  );
  targets.forEach((el) => io.observe(el));
}
