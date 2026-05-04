import { siteConfig } from '../config/site.js'
import { stripHtml } from './wp-api.js'

export function absoluteUrl(pathname = '/') {
  return new URL(pathname, siteConfig.siteUrl).toString()
}

export function normaliseDescription(value, fallback = siteConfig.description) {
  const text = stripHtml(value || '')

  if (!text) {
    return fallback
  }

  return text.length > 170 ? `${text.slice(0, 170).trimEnd()}...` : text
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteConfig.siteUrl}#organization`,
    name: siteConfig.legalName,
    url: siteConfig.siteUrl,
    foundingDate: siteConfig.foundingDate,
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: siteConfig.contact.city,
      addressCountry: siteConfig.contact.country,
    },
    sameAs: Object.values(siteConfig.social),
    knowsAbout: [
      'Brand strategy',
      'Headless WordPress',
      'Technical SEO',
      'Structured data',
      'Generative engine optimisation',
    ],
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteConfig.siteUrl}#website`,
    url: siteConfig.siteUrl,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: {
      '@id': `${siteConfig.siteUrl}#organization`,
    },
    inLanguage: siteConfig.locale,
  }
}

export function webPageSchema({ pathname, title, description, type = 'WebPage' }) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${absoluteUrl(pathname)}#webpage`,
    url: absoluteUrl(pathname),
    name: title,
    description,
    isPartOf: {
      '@id': `${siteConfig.siteUrl}#website`,
    },
    about: {
      '@id': `${siteConfig.siteUrl}#organization`,
    },
    inLanguage: siteConfig.locale,
  }
}

export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function collectionSchema({ pathname, title, description, items }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${absoluteUrl(pathname)}#collection`,
    url: absoluteUrl(pathname),
    name: title,
    description,
    isPartOf: {
      '@id': `${siteConfig.siteUrl}#website`,
    },
    hasPart: items.map((item) => ({
      '@type': 'CreativeWork',
      headline: item.title,
      url: absoluteUrl(item.uri || pathname),
      datePublished: item.date || undefined,
    })),
  }
}

export function articleSchema({ pathname, title, description, image, datePublished, author }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${absoluteUrl(pathname)}#article`,
    headline: title,
    description,
    datePublished,
    dateModified: datePublished,
    image: image ? [absoluteUrl(image)] : [absoluteUrl(siteConfig.defaultSocialImage)],
    author: {
      '@type': 'Person',
      name: author || siteConfig.name,
    },
    publisher: {
      '@id': `${siteConfig.siteUrl}#organization`,
    },
    mainEntityOfPage: absoluteUrl(pathname),
    inLanguage: siteConfig.locale,
    isAccessibleForFree: true,
  }
}

export function serviceCatalogSchema(pathname, sections = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${absoluteUrl(pathname)}#services`,
    itemListElement: sections.map((section, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: section.title,
        description: section.body,
        provider: {
          '@id': `${siteConfig.siteUrl}#organization`,
        },
      },
    })),
  }
}

export function contactSchema(pathname) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${absoluteUrl(pathname)}#contact`,
    url: absoluteUrl(pathname),
    mainEntity: {
      '@id': `${siteConfig.siteUrl}#organization`,
    },
  }
}

export function faqSchema(pathname, items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(pathname)}#faq`,
    url: absoluteUrl(pathname),
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}