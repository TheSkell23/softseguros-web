import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function readFaqData(siteDir) {
  const source = readFileSync(join(siteDir, 'FAQ.dc.html'), 'utf8');
  const script = source.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw new Error('No se encontrÃ³ la lÃ³gica de FAQ');
  const Component = new Function('DCLogic', `${script}\nreturn Component;`)(class {});
  const instance = new Component();
  const initial = instance.faqVals().f;
  const categories = [];
  for (let i = 0; i < initial.cats.length; i++) {
    instance.state.fc = i;
    categories.push(instance.faqVals().f.chips);
  }
  instance.state.fo = -1;
  const closed = instance.faqVals().f.basics[0];
  instance.state.fo = 0;
  const opened = instance.faqVals().f.basics[0];
  instance.state.fm = [
    { w: 'u', t: 'x' },
    { w: 'b', t: 'x', fb: true },
  ];
  const [userMessage, fallbackMessage] = instance.faqVals().f.msgs;
  const data = JSON.parse(script.match(/,DATA=(\[[\s\S]*?\]),BASIC=/)?.[1] ?? '[]');
  if (!data.length) throw new Error('No se encontraron las preguntas de FAQ');
  return {
    initial: {
      ...initial,
      basics: initial.basics.map((item) => ({ ...item, exp: item.exp === 'true' })),
    },
    categories,
    data,
    accordion: {
      closed: { icon: closed.icon, ans: closed.ans },
      opened: { icon: opened.icon, ans: opened.ans },
    },
    messages: { user: userMessage, bot: initial.msgs[0], fallback: fallbackMessage },
  };
}
