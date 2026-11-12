// Acordeón de Ayuda según ayudaVals() del sitio actual.
interface Style {
  icon: string;
  ans: string;
}
export function initHelp(): void {
  const json = document.getElementById('help-data')?.textContent;
  if (!json) return;
  const styles = JSON.parse(json) as { closed: Style; opened: Style };
  const buttons = [...document.querySelectorAll<HTMLElement>('[data-help-toggle]')];
  let open = 0;
  buttons.forEach((button, index) =>
    button.addEventListener('click', () => {
      open = open === index ? -1 : index;
      buttons.forEach((item, i) => {
        const style = i === open ? styles.opened : styles.closed;
        item.setAttribute('aria-expanded', String(i === open));
        item.querySelector<HTMLElement>('span:last-child')?.setAttribute('style', style.icon);
        item.nextElementSibling?.setAttribute('style', style.ans);
      });
    }),
  );
}
