import type { APIRoute } from 'astro';
import { seoFor } from '../data/seo-localized.ts';
import { LANGS, pageKeys, pathFor } from '../i18n/routes.ts';

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('Falta site en astro.config.mjs');
  const lines = ['# Softseguros', ''];
  for (const lang of LANGS) {
    lines.push(`## ${lang.toUpperCase()}`, '');
    for (const key of pageKeys) {
      lines.push(`- [${seoFor(key, lang, site).title}](${new URL(pathFor(key, lang), site).href})`);
    }
    lines.push('');
  }
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
