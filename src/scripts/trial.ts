// Validación local y acordeón de Prueba. El formulario no envía datos.
import { loadT } from '../i18n/client.ts';
interface AccordionStyle {
  icon: string;
  ans: string;
}
export async function initTrial(): Promise<void> {
  const t = await loadT(document.documentElement.lang === 'en' ? 'en' : 'es');
  const inputs = Object.fromEntries(
    [...document.querySelectorAll<HTMLInputElement>('[data-trial-input]')].map((input) => [
      input.dataset.trialInput,
      input,
    ]),
  ) as Record<string, HTMLInputElement>;
  const field = (name: string): HTMLElement | null =>
    document.querySelector<HTMLElement>(`[data-trial-field="${name}"]`);
  const submit = document.querySelector<HTMLElement>('[data-trial-submit]');
  submit?.addEventListener('click', () => {
    const name = inputs.n?.value ?? '';
    const surname = inputs.a?.value ?? '';
    const email = inputs.e?.value ?? '';
    const phone = inputs.p?.value ?? '';
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.n = 'Escribe tu nombre';
    if (!surname.trim()) errors.a = 'Escribe tu apellido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errors.e = 'Escribe un correo válido';
    if (phone.replace(/\D/g, '').length < 7) errors.p = 'Escribe un teléfono válido';
    for (const [key, errorKey] of Object.entries({ n: 'eN', a: 'eA', e: 'eE', p: 'eP' })) {
      const message = field(errorKey);
      if (message) message.textContent = t(errors[key] ?? '');
      const input = inputs[key];
      if (input) input.style.borderColor = errors[key] ? '#e25555' : '#cfe0f7';
    }
    if (Object.keys(errors).length) return;
    const form = document.querySelector<HTMLElement>('[data-trial-style="form"]');
    const ok = document.querySelector<HTMLElement>('[data-trial-style="ok"]');
    if (form) form.style.display = 'none';
    if (ok) ok.style.display = 'flex';
    const nameField = field('name');
    const emailField = field('email');
    if (nameField) nameField.textContent = name.trim();
    if (emailField) emailField.textContent = email.trim();
  });

  const json = document.getElementById('trial-data')?.textContent;
  if (!json) return;
  const accordion = JSON.parse(json) as { closed: AccordionStyle; opened: AccordionStyle };
  const buttons = [...document.querySelectorAll<HTMLElement>('[data-trial-toggle]')];
  let open = 0;
  buttons.forEach((button, index) =>
    button.addEventListener('click', () => {
      open = open === index ? -1 : index;
      buttons.forEach((item, i) => {
        const style = i === open ? accordion.opened : accordion.closed;
        item.setAttribute('aria-expanded', String(i === open));
        item.querySelector<HTMLElement>('span:last-child')?.setAttribute('style', style.icon);
        item.nextElementSibling?.setAttribute('style', style.ans);
      });
    }),
  );
}
