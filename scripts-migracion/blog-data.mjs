import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function readBlogData(siteDir) {
  const source = readFileSync(join(siteDir, 'Blog.dc.html'), 'utf8');
  const script = source.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw new Error('No se encontrÃ³ la lÃ³gica de Blog');
  const Component = new Function('DCLogic', `${script}\nreturn Component;`)(class {});
  const instance = new Component();
  const initial = instance.blogVals().b;
  instance.state.bq = 'zzzxxyy';
  const emptyStyle = instance.blogVals().b.emptyStyle;
  const data = JSON.parse(script.match(/,DATA=(\[[\s\S]*?\]),ICONS=/)?.[1] ?? '[]');
  if (!data.length) throw new Error('No se encontraron los artÃ­culos de Blog');
  return { initial, data, emptyStyle };
}
