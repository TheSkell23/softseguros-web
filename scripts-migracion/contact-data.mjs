import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function readContactData(siteDir) {
  const source = readFileSync(join(siteDir, 'Contacto.dc.html'), 'utf8');
  const script = source.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw new Error('No se encontrÃ³ la lÃ³gica de Contacto');
  const Component = new Function('DCLogic', `${script}\nreturn Component;`)(class {});
  const instance = new Component();
  return instance.contactVals().c;
}
