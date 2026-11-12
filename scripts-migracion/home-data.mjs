// Lee los datos de la página de Inicio sin ejecutar el montaje del runtime.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function readHomeData(siteDir) {
  const source = readFileSync(join(siteDir, 'Softseguros.dc.html'), 'utf8');
  const script = source.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw new Error('No se encontró la lógica de Inicio');
  const Component = new Function('DCLogic', `${script}\nreturn Component;`)(class {});
  const instance = new Component();
  const initial = instance.renderVals();
  const panels = Array.from({ length: 4 }, (_, tab) => {
    instance.state.tab = tab;
    return instance.renderVals().panel;
  });
  return { initial, panels };
}

if (process.argv[1]?.endsWith('home-data.mjs')) {
  const { initial, panels } = readHomeData(process.argv[2]);
  console.log(Object.keys(initial).join(', '));
  console.log(`paneles: ${panels.length}; tarjetas: ${initial.iaCards.length}`);
}
