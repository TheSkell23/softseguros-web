// Selección y mensaje de WhatsApp de Contacto, según contactVals() del sitio actual.
export function initContact(): void {
  const topics = [...document.querySelectorAll<HTMLElement>('[data-contact-topic]')];
  const sizes = [...document.querySelectorAll<HTMLElement>('[data-contact-size]')];
  const link = document.querySelector<HTMLAnchorElement>('[data-contact-link]');
  if (!topics.length || !sizes.length || !link) return;
  const name = document.querySelector<HTMLInputElement>('[data-contact-input="name"]');
  const agency = document.querySelector<HTMLInputElement>('[data-contact-input="agency"]');
  const topicStyles = [
    topics[0]?.getAttribute('style') ?? '',
    topics[1]?.getAttribute('style') ?? '',
  ];
  const sizeStyles = [sizes[0]?.getAttribute('style') ?? '', sizes[1]?.getAttribute('style') ?? ''];
  let topic = 0;
  let size = 0;
  const redraw = (): void => {
    topics.forEach((button, index) =>
      button.setAttribute('style', topicStyles[index === topic ? 0 : 1] ?? ''),
    );
    sizes.forEach((button, index) =>
      button.setAttribute('style', sizeStyles[index === size ? 0 : 1] ?? ''),
    );
    const person = name?.value.trim() || 'un interesado';
    const firm = agency?.value.trim();
    const message = `Hola, soy ${person}${firm ? ` de la agencia ${firm}` : ''}. Me interesa: ${topics[topic]?.dataset.sourceLabel}. Somos ${(sizes[size]?.dataset.sourceLabel ?? '').toLowerCase()} usuarios. ¿Pueden contactarme?`;
    link.href = `https://api.whatsapp.com/send?phone=573204863161&text=${encodeURIComponent(message)}`;
  };
  topics.forEach((button, index) =>
    button.addEventListener('click', () => {
      topic = index;
      redraw();
    }),
  );
  sizes.forEach((button, index) =>
    button.addEventListener('click', () => {
      size = index;
      redraw();
    }),
  );
  name?.addEventListener('input', redraw);
  agency?.addEventListener('input', redraw);
}
