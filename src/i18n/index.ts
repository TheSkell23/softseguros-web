import { en } from './en.ts';
import { es } from './es.ts';
import { translateRule } from './rules.ts';
import type { Lang } from './routes.ts';

export type MessageKey = keyof typeof es;
const catalog: Record<string, string> = en;

/** Misma prioridad que site/i18n.js: diccionario, reglas y finalmente texto original. */
export function translate(lang: Lang, text: string): string {
  if (lang === 'es') return text;
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return text;
  const translated =
    catalog[normalized] ?? translateRule(normalized, (part) => translate(lang, part));
  if (translated === undefined) return text;
  return (text.match(/^\s*/)?.[0] ?? '') + translated + (text.match(/\s*$/)?.[0] ?? '');
}

export function getT(lang: Lang): <T>(value: T) => T {
  return (value) => (typeof value === 'string' ? translate(lang, value) : value) as typeof value;
}
