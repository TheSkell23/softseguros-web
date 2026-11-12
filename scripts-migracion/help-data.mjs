import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function readHelpData(siteDir) {
  const source = readFileSync(join(siteDir, 'Ayuda.dc.html'), 'utf8');
  const script = source.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw new Error('No se encontrÃ³ la lÃ³gica de Ayuda');
  const Component = new Function('DCLogic', `${script}\nreturn Component;`)(class {});
  const instance = new Component();
  const initial = instance.ayudaVals().h;
  instance.state.ho = -1;
  const closed = instance.ayudaVals().h.items[0];
  instance.state.ho = 0;
  const opened = instance.ayudaVals().h.items[0];
  return {
    initial: { items: initial.items.map((item) => ({ ...item, exp: item.exp === 'true' })) },
    accordion: {
      closed: { icon: closed.icon, ans: closed.ans },
      opened: { icon: opened.icon, ans: opened.ans },
    },
  };
}
