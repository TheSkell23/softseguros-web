// Reproductor de Conoce: port de `initVid` de site/Conoce.dc.html. Al pulsar "Ver el video" se sustituye
// el botón por el iframe de YouTube (youtube-nocookie) con el identificador del contenedor.
import { loadT } from '../i18n/client.ts';
export async function initVideo(): Promise<void> {
  const t = await loadT(document.documentElement.lang === 'en' ? 'en' : 'es');
  document.addEventListener('click', (e) => {
    const button = (e.target as Element | null)?.closest<HTMLElement>('.cs-play');
    if (!button) return;
    const wrap = button.closest<HTMLElement>('.cs-vid');
    if (!wrap) return;
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${wrap.dataset.id ?? ''}?autoplay=1&rel=0`;
    frame.title = t('Conoce Softseguros');
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    button.remove();
    wrap.insertBefore(frame, wrap.firstChild);
  });
}
