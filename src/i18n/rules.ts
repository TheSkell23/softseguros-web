// GENERADO desde las 24 reglas de site/i18n.js. Se conserva el orden original.
const n = (s: string): string =>
  String(s)
    .replace(/(\d)\.(\d{3})(?!\d)/g, '$1,$2')
    .replace(/(\d),(\d{1,2})(?!\d)/g, '$1.$2');
export function translateRule(text: string, tr: (text: string) => string): string | undefined {
  const rules: Array<[RegExp, (m: RegExpExecArray) => string]> = [
    [
      /^([\d.,]+) correos \(([\d.,]+) por usuario\)$/,
      function (m) {
        return n(m[1]) + ' emails (' + n(m[2]) + ' per user)';
      },
    ],
    [
      /^([\d.,]+) lecturas de PDF con IA \(([\d.,]+) por usuario\)$/,
      function (m) {
        return n(m[1]) + ' AI PDF reads (' + n(m[2]) + ' per user)';
      },
    ],
    [
      /^([\d.,]+) GB de almacenamiento \(([\d.,]+) GB por usuario\)$/,
      function (m) {
        return n(m[1]) + ' GB of storage (' + n(m[2]) + ' GB per user)';
      },
    ],
    [
      /^(\d+) líneas? de WhatsApp automático$/,
      function (m) {
        return m[1] + (m[1] === '1' ? ' automatic WhatsApp line' : ' automatic WhatsApp lines');
      },
    ],
    [
      /^Incluye Módulo Comercial \(USD ([\d.,]+)\)\. Licencia: USD ([\d.,]+) por usuario al mes$/,
      function (m) {
        return (
          'Includes Commercial Module (USD ' +
          n(m[1]) +
          '). License: USD ' +
          n(m[2]) +
          ' per user per month'
        );
      },
    ],
    [
      /^USD ([\d.,]+) por usuario al mes$/,
      function (m) {
        return 'USD ' + n(m[1]) + ' per user per month';
      },
    ],
    [
      /^(\d+) usuarios? · USD ([\d.,]+) al año \+ Módulo Comercial$/,
      function (m) {
        return m[1] + ' users · USD ' + n(m[2]) + ' per year + Commercial Module';
      },
    ],
    [
      /^(\d+) usuarios?$/,
      function (m) {
        return m[1] + (m[1] === '1' ? ' user' : ' users');
      },
    ],
    [
      /^(\d+) usuarios? · USD ([\d.,]+) al año$/,
      function (m) {
        return m[1] + (m[1] === '1' ? ' user' : ' users') + ' · USD ' + n(m[2]) + ' per year';
      },
    ],
    [
      /^USD ([\d.,]+) al año$/,
      function (m) {
        return 'USD ' + n(m[1]) + ' per year';
      },
    ],
    [
      /^USD ([\d.,]+)$/,
      function (m) {
        return 'USD ' + n(m[1]);
      },
    ],
    [
      /^Licencia: USD ([\d.,]+) por usuario al mes$/,
      function (m) {
        return 'License: USD ' + n(m[1]) + ' per user per month';
      },
    ],
    [
      /^por usuario al año · (\d+) usuarios: USD ([\d.,]+)$/,
      function (m) {
        return 'per user per year · ' + m[1] + ' users: USD ' + n(m[2]);
      },
    ],
    [
      /^al año · equivale a USD ([\d.,]+) por usuario al mes$/,
      function (m) {
        return 'per year · equals USD ' + n(m[1]) + ' per user per month';
      },
    ],
    [
      /^lo que cuesta Softseguros para (\d+) usuarios? \(USD ([\d.,]+) al año\)$/,
      function (m) {
        return (
          'what Softseguros costs for ' +
          m[1] +
          (m[1] === '1' ? ' user' : ' users') +
          ' (USD ' +
          n(m[2]) +
          ' per year)'
        );
      },
    ],
    [
      /^(\d[\d.,]*) h$/,
      function (m) {
        return m[1] + ' h';
      },
    ],
    [
      /^(\d+) renovaciones? recuperadas?$/,
      function (m) {
        return m[1] + ' renewals recovered';
      },
    ],
    [
      /^(\d+) pólizas$/,
      function (m) {
        return m[1] + ' policies';
      },
    ],
    [
      /^(\d+) (días?)$/,
      function (m) {
        return m[1] + (m[1] === '1' ? ' day' : ' days');
      },
    ],
    [
      /^(.*) · Por (.+)$/,
      function (m) {
        return tr(m[1]) + ' · By ' + m[2];
      },
    ],
    [
      /^(\d+)\/(\d+)\/(\d{4}) · Por (.+)$/,
      function (m) {
        return m[2] + '/' + m[1] + '/' + m[3] + ' · By ' + m[4];
      },
    ],
    [
      /^¡Gracias, (.+)!$/,
      function (m) {
        return 'Thank you, ' + m[1] + '!';
      },
    ],
    [
      /^(\d+) frente a (\d+) pagadas$/,
      function (m) {
        return m[1] + ' vs. ' + m[2] + ' paid';
      },
    ],
    [
      /^(\d[\d.,]*) veces$/,
      function (m) {
        return n(m[1]) + ' times';
      },
    ],
  ];
  for (const [pattern, translate] of rules) {
    const match = pattern.exec(text);
    if (match) return translate(match);
  }
  return undefined;
}
