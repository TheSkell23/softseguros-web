// Cotizador de Precios, con los valores iniciales extraídos de quoteVals() del sitio actual.
import { loadT } from '../i18n/client.ts';
interface Variant {
  users: number;
  commercial: boolean;
  feat: string[];
  month: string;
  mcStyle: string;
  mcOn: string;
  mcLabel: string;
}

export async function initPrice(): Promise<void> {
  const t = await loadT(document.documentElement.lang === 'en' ? 'en' : 'es');
  const data = document.getElementById('price-data')?.textContent;
  if (!data) return;
  const variants = JSON.parse(data) as Variant[];
  const features = document.querySelector<HTMLElement>('[data-price-features]');
  const template = features?.querySelector('li')?.cloneNode(true) as HTMLElement | undefined;
  const field = (key: string): HTMLElement | null =>
    document.querySelector<HTMLElement>(`[data-price-field="${key}"]`);
  const number = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  let users = 2;
  let commercial = false;

  const redraw = (): void => {
    const variant = variants.find(
      (v) => v.users === (users >= 3 ? 3 : 2) && v.commercial === commercial,
    );
    if (!variant) return;
    const values: Record<string, string> = {
      users: String(users),
      total: t(`USD ${number(380 * users + (commercial ? 1300 : 0))} al año`),
      month: t(variant.month),
      mcLabel: t(variant.mcLabel),
    };
    Object.entries(values).forEach(([key, value]) => {
      const el = field(key);
      if (el) el.textContent = value;
    });
    const toggle = document.querySelector<HTMLElement>('[data-price-switch]');
    if (toggle) {
      toggle.setAttribute('style', variant.mcStyle);
      toggle.setAttribute('aria-checked', variant.mcOn);
    }
    if (features && template) {
      const texts = [...variant.feat];
      if (users >= 3) {
        for (const [index, count] of [
          [2, 800 * users],
          [3, 130 * users],
          [4, 15 * users],
        ])
          if (texts[index]) texts[index] = texts[index].replace(/^[\d.]+/, number(count));
      }
      features.replaceChildren(
        ...texts.map((text) => {
          const li = template.cloneNode(true) as HTMLElement;
          const label = li.querySelector('span');
          if (label) label.textContent = t(text);
          return li;
        }),
      );
    }
  };
  document.querySelectorAll<HTMLElement>('[data-price-action]').forEach((button) => {
    button.addEventListener('click', () => {
      switch (button.dataset.priceAction) {
        case 'minus':
          users = Math.max(2, users - 1);
          break;
        case 'plus':
          users = Math.min(50, users + 1);
          break;
        case 'toggle':
          commercial = !commercial;
          break;
      }
      redraw();
    });
  });
}
