// GENERADO por scripts-migracion/gen-shared.mjs desde el array `menu` de site/*.dc.html.
import type { PageKey } from '../i18n/routes.ts';

export interface MenuLink {
  label: string;
  key: PageKey;
  hash: string;
}
export interface MenuItem extends MenuLink {
  caret: boolean;
  /** Clases del panel desplegable. */
  ddc: string;
  sub: MenuLink[];
}
export const menu: MenuItem[] = [
  {
    label: 'Producto',
    key: 'producto',
    hash: '',
    caret: true,
    ddc: 'dd-p',
    sub: [
      {
        label: 'CRM para agencias',
        key: 'producto',
        hash: '#crm',
      },
      {
        label: 'Sincronizador de pólizas',
        key: 'producto',
        hash: '#sincronizador',
      },
      {
        label: 'Integraciones',
        key: 'producto',
        hash: '#integraciones',
      },
      {
        label: 'Conoce Softseguros',
        key: 'conoce',
        hash: '',
      },
    ],
  },
  {
    label: 'Soluciones',
    key: 'soluciones',
    hash: '',
    caret: true,
    ddc: 'dd-p',
    sub: [
      {
        label: 'Módulo Comercial',
        key: 'soluciones',
        hash: '#comercial',
      },
      {
        label: 'Multicotizador de Autos',
        key: 'soluciones',
        hash: '#multicotizador',
      },
    ],
  },
  {
    label: 'Recursos',
    key: 'blog',
    hash: '',
    caret: true,
    ddc: 'dd-p',
    sub: [
      {
        label: 'Blog',
        key: 'blog',
        hash: '',
      },
      {
        label: 'Ayuda',
        key: 'ayuda',
        hash: '',
      },
    ],
  },
  {
    label: 'Precios',
    key: 'precios',
    hash: '',
    caret: true,
    ddc: 'dd-p',
    sub: [
      {
        label: 'Arma tu cotización',
        key: 'precios',
        hash: '#cotizador',
      },
    ],
  },
  {
    label: 'FAQ',
    key: 'faq',
    hash: '',
    caret: true,
    ddc: 'dd-p',
    sub: [
      {
        label: 'Chat de preguntas',
        key: 'faq',
        hash: '#chat',
      },
      {
        label: 'Las más básicas',
        key: 'faq',
        hash: '#basicas',
      },
    ],
  },
  {
    label: 'Contáctanos',
    key: 'contacto',
    hash: '',
    caret: false,
    ddc: 'dd-p dd-e',
    sub: [],
  },
];

/** Etiqueta del elemento del menú marcado como activo en cada página (null: ninguno). */
export const activeLabel: Record<PageKey, string | null> = {
  inicio: null,
  producto: 'Producto',
  soluciones: 'Soluciones',
  precios: 'Precios',
  contacto: 'Contáctanos',
  faq: 'FAQ',
  prueba: null,
  blog: 'Recursos',
  ayuda: 'Recursos',
  conoce: 'Producto',
  terminos: null,
  privacidad: null,
};
