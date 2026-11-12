// Filtro de artículos y suscripción local de Blog. No envía datos.
import { loadT } from '../i18n/client.ts';
interface Article {
  c: number;
  n: string;
}
export async function initBlog(): Promise<void> {
  const t = await loadT(document.documentElement.lang === 'en' ? 'en' : 'es');
  const json = document.getElementById('blog-data')?.textContent;
  if (!json) return;
  const { data, emptyStyle } = JSON.parse(json) as { data: Article[]; emptyStyle: string };
  const categories = [...document.querySelectorAll<HTMLElement>('[data-blog-cat]')];
  const cards = [...document.querySelectorAll<HTMLElement>('[data-blog-card]')];
  const search = document.querySelector<HTMLInputElement>('[data-blog-search]');
  const empty = document.querySelector<HTMLElement>('[data-blog-style="empty"]');
  const onStyle = categories[0]?.getAttribute('style') ?? '';
  const offStyle = categories[1]?.getAttribute('style') ?? '';
  let category = 0;
  let query = '';
  const normalize = (value: string): string =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  const redraw = (): void => {
    categories.forEach((button, index) =>
      button.setAttribute('style', index === category ? onStyle : offStyle),
    );
    let count = 0;
    cards.forEach((card, index) => {
      const article = data[index];
      const visible = Boolean(
        article &&
        (category === 0 || article.c === category) &&
        (!query ||
          normalize(article.n).includes(query) ||
          normalize(card.textContent ?? '').includes(query)),
      );
      card.style.display = visible ? 'flex' : 'none';
      if (visible) count++;
    });
    if (empty) empty.setAttribute('style', count ? 'display:none' : emptyStyle);
  };
  categories.forEach((button, index) =>
    button.addEventListener('click', () => {
      category = index;
      redraw();
    }),
  );
  search?.addEventListener('input', () => {
    query = normalize(search.value).trim();
    redraw();
  });

  const inputs = Object.fromEntries(
    [...document.querySelectorAll<HTMLInputElement>('[data-blog-input]')].map((input) => [
      input.dataset.blogInput,
      input,
    ]),
  ) as Record<string, HTMLInputElement>;
  const field = (name: string): HTMLElement | null =>
    document.querySelector<HTMLElement>(`[data-blog-field="${name}"]`);
  document.querySelector('[data-blog-submit]')?.addEventListener('click', () => {
    const name = inputs.n?.value ?? '';
    const email = inputs.e?.value ?? '';
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.n = 'Escribe tu nombre';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errors.e = 'Escribe un correo válido';
    for (const [key, errorKey] of Object.entries({ n: 'eN', e: 'eE' })) {
      const message = field(errorKey);
      if (message) message.textContent = t(errors[key] ?? '');
      if (inputs[key]) inputs[key].style.borderColor = errors[key] ? '#e25555' : '#cfe0f7';
    }
    if (Object.keys(errors).length) return;
    const form = document.querySelector<HTMLElement>('[data-blog-style="form"]');
    const ok = document.querySelector<HTMLElement>('[data-blog-style="ok"]');
    if (form) form.style.display = 'none';
    if (ok) ok.style.display = 'flex';
    const nameField = field('name');
    const emailField = field('email');
    if (nameField) nameField.textContent = name.trim();
    if (emailField) emailField.textContent = email.trim();
  });
}
