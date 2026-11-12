// Metadatos en inglés. PROPUESTA de traducción (el sitio actual no publica metadatos en inglés): pendiente de revisión
// por un hablante nativo. El tipo obliga a traducir cada página y cada campo: si falta uno, `astro check` falla.
import type { PageKey } from '../i18n/routes.ts';
import type { PageSeo } from './seo.ts';

export type SeoTexts = Pick<PageSeo, 'title' | 'description' | 'ogTitle' | 'ogDescription'>;

export const seoEn: Record<PageKey, SeoTexts> = {
  inicio: {
    title: 'Softseguros | CRM for insurance agencies, all in one',
    description:
      'Softseguros is a CRM for insurance agencies, promoters and brokers: quote, compare, renew and collect from a single dashboard, with insurer sync and AI on WhatsApp.',
    ogTitle: 'Softseguros | CRM for insurance agencies',
    ogDescription:
      'Quote, compare and follow up with every client, from the first call to the signed policy.',
  },
  producto: {
    title: 'Product | CRM, Policy Sync and Integrations | Softseguros',
    description:
      'Manage policies, receivables, commissions, claims and renewals in a single CRM built for insurance agencies. Policy sync and integrations with insurers and WhatsApp.',
    ogTitle: 'Product | Softseguros',
    ogDescription:
      'Quote, compare and follow up with every client, from the first call to the signed policy.',
  },
  soluciones: {
    title: 'Solutions | Commercial Module and Auto Multi-quoter | Softseguros',
    description:
      'Sell more with Softseguros: Commercial Module with AI agents on WhatsApp and an Auto multi-quoter with a PDF comparison.',
    ogTitle: 'Solutions | Softseguros',
    ogDescription:
      'AI agents on WhatsApp, campaigns and an auto multi-quoter that compares insurers in minutes.',
  },
  precios: {
    title: 'Pricing | Softseguros',
    description:
      'USD 380 per user per year, with a minimum of 2 users. Unlimited policies and insureds, human support and onboarding included. Try the demo for 7 days, no card required.',
    ogTitle: 'Pricing | Softseguros',
    ogDescription: 'Build your Softseguros quote in 10 seconds.',
  },
  contacto: {
    title: 'Contact us | Softseguros',
    description:
      'Message us on WhatsApp, book a demo or try Softseguros for 7 days. Human support in Spanish.',
    ogTitle: 'Contact us | Softseguros',
    ogDescription: 'Talk to a Softseguros advisor.',
  },
  faq: {
    title: 'Frequently asked questions | Softseguros',
    description:
      'Answers about pricing, the free trial, insurers, onboarding and data security at Softseguros.',
    ogTitle: 'Frequently asked questions | Softseguros',
    ogDescription: 'Softseguros frequently asked questions.',
  },
  prueba: {
    title: '7 days free | Softseguros',
    description:
      'Try Softseguros free for 7 days with your own portfolio. No credit card, no commitment.',
    ogTitle: '7 days free | Softseguros',
    ogDescription: 'Try Softseguros free for 7 days.',
  },
  blog: {
    title: 'Blog and resources | Softseguros',
    description:
      'Articles and resources to sell more and better at insurance agencies: sales, growth, technology and Softseguros updates.',
    ogTitle: 'Blog and resources | Softseguros',
    ogDescription: 'Softseguros blog and resources.',
  },
  ayuda: {
    title: 'Help center | Softseguros',
    description:
      'Guides, updates, videos and training to use Softseguros. Human support in Spanish.',
    ogTitle: 'Help center | Softseguros',
    ogDescription: 'Softseguros help center.',
  },
  conoce: {
    title: 'Meet Softseguros | Softseguros',
    description:
      'Meet Softseguros in 10 minutes: the software that has already replaced Excel in more than 900 insurance agencies across Latin America.',
    ogTitle: 'Meet Softseguros | Softseguros',
    ogDescription: 'Meet Softseguros in 10 minutes.',
  },
  terminos: {
    title: 'Terms of service | Softseguros',
    description:
      'Softseguros terms of service: customer agreement and annexes on definitions, operation, security, digital signature, confidentiality and SARLAFT.',
    ogTitle: 'Terms of service | Softseguros',
    ogDescription: 'Softseguros agreement, annexes and policies.',
  },
  privacidad: {
    title: 'Privacy and personal data | Softseguros',
    description:
      'Softseguros privacy: personal data processing policy (Law 1581 of 2012), integrations, RNBD, account deletion and authorizations.',
    ogTitle: 'Privacy and personal data | Softseguros',
    ogDescription: 'Softseguros agreement, annexes and policies.',
  },
};

/** Textos de datos estructurados (JSON-LD) que se traducen al inglés. */
export const jsonLdEn: Record<string, string> = {
  'CRM para agencias, promotorías y corredores de seguros en Latinoamérica.':
    'CRM for insurance agencies, promoters and brokers in Latin America.',
  Latinoamérica: 'Latin America',
  'Software para agencias de seguros que une CRM, sincronización con aseguradoras, cobranza y recordatorios de renovación por WhatsApp en un solo panel.':
    'Software for insurance agencies that brings CRM, insurer sync, collections and WhatsApp renewal reminders together in a single dashboard.',
  'CRM de clientes y pólizas': 'Client and policy CRM',
  'Cotizador y comparador de aseguradoras': 'Insurer quoting and comparison tool',
  'Sincronización con aseguradoras': 'Insurer sync',
  'Cobranza y recordatorios de renovación por WhatsApp':
    'Collections and WhatsApp renewal reminders',
  'Agente de IA comercial': 'AI sales agent',
  'Informes de producción': 'Production reports',
};
