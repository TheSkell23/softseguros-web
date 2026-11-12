// Chat y acordeones de FAQ, con preguntas y estilos extraídos de faqVals() del sitio actual.
import { loadT } from '../i18n/client.ts';
interface Question {
  c: number;
  q: string;
  a: string;
  k: string;
}
interface Chip {
  label: string;
  style: string;
}
interface Bubble {
  row: string;
  bub: string;
  href: string;
  linkStyle: string;
}
interface FaqData {
  categories: Chip[][];
  data: Question[];
  accordion: { closed: { icon: string; ans: string }; opened: { icon: string; ans: string } };
  messages: { user: Bubble; bot: Bubble; fallback: Bubble };
}

export async function initFaq(): Promise<void> {
  const t = await loadT(document.documentElement.lang === 'en' ? 'en' : 'es');
  const json = document.getElementById('faq-data')?.textContent;
  if (!json) return;
  const data = JSON.parse(json) as FaqData;
  const categories = [...document.querySelectorAll<HTMLElement>('[data-faq-cat]')];
  const firstChip = document.querySelector<HTMLElement>('[data-faq-chip]');
  const chipHost = firstChip?.parentElement;
  const chipTemplate = firstChip?.cloneNode(true) as HTMLElement | undefined;
  const onStyle = categories[0]?.getAttribute('style') ?? '';
  const offStyle = categories[1]?.getAttribute('style') ?? '';
  const log = document.getElementById('fq-log');
  const messageTemplate = log?.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
  const input = document.getElementById('fq-in') as HTMLInputElement | null;
  let category = 0;
  let query = '';

  const scroll = (): void => {
    window.setTimeout(() => {
      if (log) log.scrollTop = log.scrollHeight;
    }, 60);
  };
  const say = (text: string, kind: 'user' | 'bot' | 'fallback'): void => {
    if (!log || !messageTemplate) return;
    const m = data.messages[kind];
    const row = messageTemplate.cloneNode(true) as HTMLElement;
    const bubble = row.firstElementChild as HTMLElement | null;
    row.setAttribute('style', m.row);
    bubble?.setAttribute('style', m.bub);
    const span = bubble?.querySelector('span');
    if (span) span.textContent = t(text);
    const a = bubble?.querySelector('a');
    if (a) {
      a.href = m.href;
      a.setAttribute('style', m.linkStyle);
    }
    log.appendChild(row);
    scroll();
  };
  const ask = (question: string, answer: string, fallback = false): void => {
    say(question, 'user');
    window.setTimeout(
      () => say(answer, fallback ? 'fallback' : 'bot'),
      700 + Math.min(900, answer.length * 4),
    );
  };
  const showCategory = (index: number): void => {
    category = index;
    categories.forEach((button, i) =>
      button.setAttribute('style', i === index ? onStyle : offStyle),
    );
    if (!chipHost || !chipTemplate) return;
    const chips = data.categories[index] ?? [];
    chipHost.replaceChildren(
      ...chips.map((chip, i) => {
        const button = chipTemplate.cloneNode(true) as HTMLElement;
        button.dataset.faqChip = String(i);
        button.setAttribute('style', chip.style);
        button.textContent = t(chip.label);
        return button;
      }),
    );
  };
  categories.forEach((button, index) =>
    button.addEventListener('click', () => showCategory(index)),
  );
  chipHost?.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLElement>('[data-faq-chip]');
    if (!button) return;
    const question = data.data.filter((item) => item.c === category)[
      Number(button.dataset.faqChip)
    ];
    if (question) ask(question.q, question.a);
  });

  const basics = [...document.querySelectorAll<HTMLElement>('[data-faq-toggle]')];
  let open = 0;
  const showBasic = (index: number): void => {
    open = index;
    basics.forEach((button, i) => {
      const state = i === index ? data.accordion.opened : data.accordion.closed;
      button.setAttribute('aria-expanded', String(i === index));
      button.querySelector<HTMLElement>('span:last-child')?.setAttribute('style', state.icon);
      button.nextElementSibling?.setAttribute('style', state.ans);
    });
  };
  basics.forEach((button, index) =>
    button.addEventListener('click', () => showBasic(open === index ? -1 : index)),
  );

  const normalize = (value: string): string =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  const find = (text: string): Question | undefined => {
    const words = normalize(text)
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(' ')
      .filter(
        (word) =>
          word.length > 2 &&
          ![
            'que',
            'los',
            'las',
            'una',
            'por',
            'con',
            'para',
            'del',
            'como',
            'cual',
            'cuanto',
            'cuanta',
            'son',
            'hay',
            'mis',
            'tiene',
            'tengo',
          ].includes(word),
      );
    let best: Question | undefined;
    let score = 0;
    data.data.forEach((question) => {
      const key = normalize(question.k);
      const count = words.filter((word) => key.includes(word)).length;
      if (count > score) {
        best = question;
        score = count;
      }
    });
    return best;
  };
  const send = (): void => {
    const text = query.trim();
    if (!text) return;
    if (input) input.value = '';
    query = '';
    const answer = find(text);
    if (answer) ask(text, answer.a);
    else
      ask(
        text,
        'No tengo una respuesta prediseñada para eso. Un asesor puede resolverlo contigo por WhatsApp.',
        true,
      );
  };
  input?.addEventListener('input', () => {
    query = input.value;
  });
  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      send();
    }
  });
  document.querySelector('[data-faq-send]')?.addEventListener('click', send);
}
