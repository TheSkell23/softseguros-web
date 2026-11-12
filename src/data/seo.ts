// GENERADO por scripts-migracion/extract-seo.mjs desde site/*.dc.html. Solo español (el inglés se genera en la Fase 4).
import type { PageKey } from '../i18n/routes.ts';

export interface PageSeo {
  title: string;
  description: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  jsonLd: Record<string, unknown>;
}

export const seoEs: Record<PageKey, PageSeo> = {
  inicio: {
    title: 'Softseguros | CRM para agencias de seguros, todo en uno',
    description:
      'Softseguros es un CRM para agencias, promotorías y corredores de seguros: cotiza, compara, renueva y cobra desde un solo panel, con sincronización con aseguradoras e IA por WhatsApp.',
    robots: 'index,follow,max-image-preview:large',
    ogTitle: 'Softseguros | CRM para agencias de seguros',
    ogDescription:
      'Cotiza, compara y haz seguimiento a cada cliente, de la primera llamada a la póliza firmada.',
    ogImage: 'https://www.softseguros.com/uploads/hero-scene2.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://www.softseguros.com/#org',
          name: 'Softseguros',
          url: 'https://www.softseguros.com/',
          logo: 'https://www.softseguros.com/uploads/logo.webp',
          description: 'CRM para agencias, promotorías y corredores de seguros en Latinoamérica.',
          areaServed: 'Latinoamérica',
        },
        {
          '@type': 'WebSite',
          '@id': 'https://www.softseguros.com/#web',
          url: 'https://www.softseguros.com/',
          name: 'Softseguros',
          inLanguage: 'es',
          publisher: {
            '@id': 'https://www.softseguros.com/#org',
          },
        },
        {
          '@type': 'SoftwareApplication',
          name: 'Softseguros',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          description:
            'Software para agencias de seguros que une CRM, sincronización con aseguradoras, cobranza y recordatorios de renovación por WhatsApp en un solo panel.',
          url: 'https://www.softseguros.com/',
          publisher: {
            '@id': 'https://www.softseguros.com/#org',
          },
          featureList: [
            'CRM de clientes y pólizas',
            'Cotizador y comparador de aseguradoras',
            'Sincronización con aseguradoras',
            'Cobranza y recordatorios de renovación por WhatsApp',
            'Agente de IA comercial',
            'Informes de producción',
          ],
        },
      ],
    },
  },
  producto: {
    title: 'Producto | CRM, Sincronizador e Integraciones | Softseguros',
    description:
      'Gestiona pólizas, cartera, comisiones, siniestros y renovaciones en un solo CRM hecho para agencias de seguros. Sincronizador de pólizas e integraciones con aseguradoras y WhatsApp.',
    robots: 'index,follow,max-image-preview:large',
    ogTitle: 'Producto | Softseguros',
    ogDescription:
      'Cotiza, compara y haz seguimiento a cada cliente, de la primera llamada a la póliza firmada.',
    ogImage: 'https://www.softseguros.com/uploads/hero-scene2.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Producto | Softseguros',
      url: 'https://www.softseguros.com/producto',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Softseguros',
        url: 'https://www.softseguros.com/',
      },
    },
  },
  soluciones: {
    title: 'Soluciones | Módulo Comercial y Multicotizador de Autos | Softseguros',
    description:
      'Vende más con Softseguros: Módulo Comercial con agentes de IA por WhatsApp y Multicotizador de autos con comparador en PDF.',
    robots: 'index,follow,max-image-preview:large',
    ogTitle: 'Soluciones | Softseguros',
    ogDescription:
      'Agentes de IA por WhatsApp, campañas y un multicotizador de autos que compara aseguradoras en minutos.',
    ogImage: 'https://www.softseguros.com/uploads/hero-scene2.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Producto | Softseguros',
      url: 'https://www.softseguros.com/soluciones',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Softseguros',
        url: 'https://www.softseguros.com/',
      },
    },
  },
  precios: {
    title: 'Precios | Softseguros',
    description:
      'USD 380 por usuario al año, con mínimo de 2 usuarios. Pólizas y asegurados ilimitados, soporte humano e implementación incluidos. Prueba la demo 7 días sin tarjeta.',
    robots: 'index,follow,max-image-preview:large',
    ogTitle: 'Precios | Softseguros',
    ogDescription: 'Arma tu cotización de Softseguros en 10 segundos.',
    ogImage: 'https://www.softseguros.com/uploads/hero-scene2.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Producto | Softseguros',
      url: 'https://www.softseguros.com/precios-softseguros',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Softseguros',
        url: 'https://www.softseguros.com/',
      },
    },
  },
  contacto: {
    title: 'Contáctanos | Softseguros',
    description:
      'Escríbenos por WhatsApp, agenda una demo o prueba Softseguros 7 días. Atención humana en español.',
    robots: 'index,follow,max-image-preview:large',
    ogTitle: 'Contáctanos | Softseguros',
    ogDescription: 'Habla con un asesor de Softseguros.',
    ogImage: 'https://www.softseguros.com/uploads/hero-scene2.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Producto | Softseguros',
      url: 'https://www.softseguros.com/contacto',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Softseguros',
        url: 'https://www.softseguros.com/',
      },
    },
  },
  faq: {
    title: 'Preguntas frecuentes | Softseguros',
    description:
      'Respuestas sobre precio, prueba gratis, aseguradoras, implementación y seguridad de datos de Softseguros.',
    robots: 'index,follow,max-image-preview:large',
    ogTitle: 'Preguntas frecuentes | Softseguros',
    ogDescription: 'Preguntas frecuentes de Softseguros.',
    ogImage: 'https://www.softseguros.com/uploads/hero-scene2.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Producto | Softseguros',
      url: 'https://www.softseguros.com/preguntas-frecuentes',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Softseguros',
        url: 'https://www.softseguros.com/',
      },
    },
  },
  prueba: {
    title: '7 días gratis | Softseguros',
    description:
      'Prueba Softseguros 7 días gratis con tu propia cartera. Sin tarjeta de crédito ni compromiso.',
    robots: 'index,follow,max-image-preview:large',
    ogTitle: '7 días gratis | Softseguros',
    ogDescription: 'Prueba Softseguros 7 días gratis.',
    ogImage: 'https://www.softseguros.com/uploads/hero-scene2.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Producto | Softseguros',
      url: 'https://www.softseguros.com/probar-software-de-seguros',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Softseguros',
        url: 'https://www.softseguros.com/',
      },
    },
  },
  blog: {
    title: 'Blog y recursos | Softseguros',
    description:
      'Artículos y recursos para vender más y mejor en agencias de seguros: ventas, crecimiento, tecnología y novedades de Softseguros.',
    robots: 'index,follow,max-image-preview:large',
    ogTitle: 'Blog y recursos | Softseguros',
    ogDescription: 'Blog y recursos de Softseguros.',
    ogImage: 'https://www.softseguros.com/uploads/hero-scene2.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Producto | Softseguros',
      url: 'https://www.softseguros.com/tips-consejos-venta-de-seguros',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Softseguros',
        url: 'https://www.softseguros.com/',
      },
    },
  },
  ayuda: {
    title: 'Centro de ayuda | Softseguros',
    description:
      'Guías, novedades, videos y formación para usar Softseguros. Soporte humano en español.',
    robots: 'index,follow,max-image-preview:large',
    ogTitle: 'Centro de ayuda | Softseguros',
    ogDescription: 'Centro de ayuda de Softseguros.',
    ogImage: 'https://www.softseguros.com/uploads/hero-scene2.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Producto | Softseguros',
      url: 'https://www.softseguros.com/centro-de-ayuda',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Softseguros',
        url: 'https://www.softseguros.com/',
      },
    },
  },
  conoce: {
    title: 'Conoce Softseguros | Softseguros',
    description:
      'Conoce Softseguros en 10 minutos: el software que ya reemplazó el Excel en más de 900 agencias de seguros de Latinoamérica.',
    robots: 'index,follow,max-image-preview:large',
    ogTitle: 'Conoce Softseguros | Softseguros',
    ogDescription: 'Conoce Softseguros en 10 minutos.',
    ogImage: 'https://www.softseguros.com/uploads/hero-scene2.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Conoce Softseguros | Softseguros',
      url: 'https://www.softseguros.com/conoce-softseguros',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Softseguros',
        url: 'https://www.softseguros.com/',
      },
    },
  },
  terminos: {
    title: 'Términos del servicio | Softseguros',
    description:
      'Términos del servicio de Softseguros: contrato con el cliente y anexos de definiciones, funcionamiento, seguridad, firma digital, confidencialidad y SARLAFT.',
    robots: 'index,follow,max-image-preview:large',
    ogTitle: 'Términos del servicio | Softseguros',
    ogDescription: 'Contrato, anexos y políticas de Softseguros.',
    ogImage: 'https://www.softseguros.com/uploads/hero-scene2.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Términos del servicio | Softseguros',
      url: 'https://www.softseguros.com/informacion-legal',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Softseguros',
        url: 'https://www.softseguros.com/',
      },
    },
  },
  privacidad: {
    title: 'Privacidad y datos personales | Softseguros',
    description:
      'Privacidad de Softseguros: política de tratamiento de datos personales (Ley 1581 de 2012), integraciones, RNBD, eliminación de cuenta y autorizaciones.',
    robots: 'index,follow,max-image-preview:large',
    ogTitle: 'Privacidad y datos personales | Softseguros',
    ogDescription: 'Contrato, anexos y políticas de Softseguros.',
    ogImage: 'https://www.softseguros.com/uploads/hero-scene2.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacidad y datos personales | Softseguros',
      url: 'https://www.softseguros.com/informacion-legal',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Softseguros',
        url: 'https://www.softseguros.com/',
      },
    },
  },
};
