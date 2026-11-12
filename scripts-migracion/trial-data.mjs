import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function readTrialData(siteDir) {
  const source = readFileSync(join(siteDir, 'Prueba.dc.html'), 'utf8');
  const script = source.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw new Error('No se encontrÃ³ la lÃ³gica de Prueba');
  const Component = new Function('DCLogic', `${script}\nreturn Component;`)(class {});
  const instance = new Component();
  const p = instance.pruVals().p;
  const basics = instance.faqVals().f.basics.map((item) => ({ ...item, exp: item.exp === 'true' }));
  instance.state.fo = -1;
  const closed = instance.faqVals().f.basics[0];
  instance.state.fo = 0;
  const opened = instance.faqVals().f.basics[0];
  return {
    p,
    f: { basics },
    accordion: {
      closed: { icon: closed.icon, ans: closed.ans },
      opened: { icon: opened.icon, ans: opened.ans },
    },
  };
}
