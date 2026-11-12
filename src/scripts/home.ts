// Estado de las pestañas y la calculadora de Inicio, según renderVals() de Softseguros.dc.html.
import { loadT } from '../i18n/client.ts';
const format = (value: number): string => Math.round(value).toLocaleString('es-CO');

export async function initHome(): Promise<void> {
  const t = await loadT(document.documentElement.lang === 'en' ? 'en' : 'es');
  const list = document.querySelector<HTMLElement>('[data-home-tabs]');
  if (list) {
    const buttons = [...list.querySelectorAll<HTMLElement>('[data-home-tab]')];
    const panels = [...document.querySelectorAll<HTMLElement>('[data-home-panel]')];
    const on = list.dataset.styleOn ?? '';
    const off = list.dataset.styleOff ?? '';
    buttons.forEach((button, selected) => {
      button.addEventListener('click', () => {
        buttons.forEach((item, index) => {
          item.setAttribute('style', index === selected ? on : off);
          item.setAttribute('aria-selected', String(index === selected));
        });
        panels.forEach((panel, index) => {
          panel.style.display = index === selected ? 'contents' : 'none';
        });
      });
    });
  }

  const ranges = [...document.querySelectorAll<HTMLInputElement>('[data-home-slider]')];
  if (ranges.length !== 4) return;
  const labels = [...document.querySelectorAll<HTMLElement>('[data-home-slider-text]')];
  const field = (name: string): HTMLElement | null =>
    document.querySelector<HTMLElement>(`[data-home-calc="${name}"]`);
  const redraw = (): void => {
    const [pol, prima, com, nor] = ranges.map((range) => Number(range.value));
    const lost = (pol * nor) / 100;
    const rec = lost * 0.34;
    const total = (rec * prima * com) / 100;
    const values = [format(pol), `USD ${format(prima)}`, `${com} %`, `${nor} %`];
    ranges.forEach((range, index) => {
      range.style.setProperty(
        '--p',
        `${(((Number(range.value) - Number(range.min)) / (Number(range.max) - Number(range.min))) * 100).toFixed(1)}%`,
      );
      if (labels[index]) labels[index].textContent = t(values[index] ?? '');
    });
    const results: Record<string, string> = {
      total: `USD ${format(total)}`,
      rec: format(rec),
      hrs: `${format(520)} h`,
      x: `${(total / 760).toFixed(1).replace('.', ',')}×`,
    };
    Object.entries(results).forEach(([key, value]) => {
      const target = field(key);
      if (target) target.textContent = t(value);
    });
  };
  ranges.forEach((range) => range.addEventListener('input', redraw));
}
