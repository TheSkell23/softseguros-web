import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function readPriceData(siteDir) {
  const source = readFileSync(join(siteDir, 'Precios.dc.html'), 'utf8');
  const script = source.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw new Error('No se encontrÃ³ la lÃ³gica de Precios');
  const Component = new Function('DCLogic', `${script}\nreturn Component;`)(class {});
  const instance = new Component();
  const variants = [];
  for (const users of [2, 3])
    for (const commercial of [false, true]) {
      instance.state.usr = users;
      instance.state.mc = commercial;
      variants.push({ users, commercial, ...instance.quoteVals().q });
    }
  return { initial: variants[0], variants };
}
