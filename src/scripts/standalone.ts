// Páginas autónomas (Error 404 y Offline): paralaje con el puntero y, en Offline, reintento y vuelta a línea.
import { loadT } from '../i18n/client.ts';

export async function initStandalone(): Promise<void> {
  // Igual que el script de <helmet> del sitio actual: --mx / --my entre -1 y 1, un cálculo por fotograma.
  const root = document.documentElement;
  let frame = 0;
  addEventListener(
    'pointermove',
    (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        root.style.setProperty('--mx', ((e.clientX / innerWidth - 0.5) * 2).toFixed(3));
        root.style.setProperty('--my', ((e.clientY / innerHeight - 0.5) * 2).toFixed(3));
      });
    },
    { passive: true },
  );

  const retry = document.querySelector<HTMLElement>('[data-offline-retry]');
  if (!retry) return;
  const t = await loadT(document.documentElement.lang === 'en' ? 'en' : 'es');
  const message = document.querySelector<HTMLElement>('[data-offline-msg]');
  const idle = retry.style.animation;
  // Misma lógica que el componente x-dc: al volver la conexión se avisa y se recarga a los 900 ms.
  addEventListener('online', () => {
    if (message) message.textContent = t('Ya estás de vuelta en línea. Recargando tu panel…');
    setTimeout(() => location.reload(), 900);
  });
  addEventListener('offline', () => {
    if (message)
      message.textContent = t(
        'No pudimos conectar con Softseguros. Cuando vuelva tu conexión, retomamos justo donde lo dejaste.',
      );
  });
  retry.addEventListener('click', () => {
    retry.style.animation = 'pl .7s ease-in-out infinite';
    setTimeout(() => {
      retry.style.animation = idle;
      if (navigator.onLine) location.reload();
    }, 1100);
  });
}
