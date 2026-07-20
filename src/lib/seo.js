import { siteConfig } from '../config/site.js'
import { stripHtml } from './wp-api.js'

export const ROBOTS_INDEX =
  'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
export const ROBOTS_NOINDEX = 'noindex,nofollow'

export function getDefaultRobots() {
  return siteConfig.allowIndexing ? ROBOTS_INDEX : ROBOTS_NOINDEX
}

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

// Builds a `#service` @id that's shared between the Organization's
// hasOfferCatalog, the Home/Services ItemList entries, and each Service
// single page's own Service entity, so all references resolve to one entity.
export function serviceId(slug) {
  return `${absoluteUrl(`/services/${slug}/`)}#service`
}

export function speakableSchema(cssSelector = ['main']) {
  return {
    '@type': 'SpeakableSpecification',
    cssSelector,
  }
}

export function slugifyName(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

// Builds a `Person` entity for a team member, matching the `@id` convention
// used on the About page (`#first-last`) so the same person referenced from
// elsewhere (e.g. an Article author) resolves to one entity.
export function personSchema({ name, slug, jobTitle, linkedin, pathname = '/about/' }) {
  if (!name) return null

  const personSlug = slug || slugifyName(name)

  return {
    '@type': 'Person',
    '@id': `${absoluteUrl(pathname)}#${personSlug}`,
    name,
    url: absoluteUrl(pathname),
    ...(jobTitle ? { jobTitle } : {}),
    ...(linkedin ? { sameAs: [linkedin] } : {}),
    worksFor: { '@id': `${siteConfig.siteUrl}#organization` },
  }
}

export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': `${siteConfig.siteUrl}#organization`,
    name: siteConfig.legalName,
    url: siteConfig.siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: siteConfig.logo.url,
      width: siteConfig.logo.width,
      height: siteConfig.logo.height,
    },
    slogan: siteConfig.slogan,
    description: siteConfig.description,
    foundingDate: siteConfig.foundingDate,
    email: siteConfig.contact.email,
    ...(siteConfig.contact.phone ? { telephone: siteConfig.contact.phone } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.contact.streetAddress,
      addressLocality: siteConfig.contact.city,
      addressRegion: siteConfig.contact.region,
      postalCode: siteConfig.contact.postalCode,
      addressCountry: siteConfig.contact.countryCode,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'New business enquiries',
      email: siteConfig.contact.email,
      areaServed: siteConfig.areaServed,
      availableLanguage: ['English'],
    },
    areaServed: siteConfig.areaServed.map((name) => ({ '@type': 'Place', name })),
    founder: siteConfig.founders.map((founder) =>
      personSchema({
        name: founder.name,
        slug: founder.aboutId,
        jobTitle: founder.jobTitle,
        linkedin: founder.linkedin,
      }),
    ),
    knowsAbout: siteConfig.knowsAbout,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Brand and Digital Design Services',
      itemListElement: siteConfig.services.map((service) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          '@id': serviceId(service.slug),
          name: service.name,
          url: absoluteUrl(`/services/${service.slug}/`),
        },
      })),
    },
    sameAs: Object.values(siteConfig.social),
  }
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': `${siteConfig.siteUrl}#website`,
    url: siteConfig.siteUrl,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: {
      '@id': `${siteConfig.siteUrl}#organization`,
    },
    inLanguage: siteConfig.inLanguage,
  }
}

export function webPageSchema({
  pathname,
  title,
  description,
  type = 'WebPage',
  dateModified,
  speakable,
  // Defaults to the Organization; pass an @id string to point elsewhere
  // (e.g. a Service single page pointing at its own Service entity), or
  // `null` to omit `about` entirely (e.g. Work singles, which already have
  // their own CreativeWork entity to carry that relationship).
  about = `${siteConfig.siteUrl}#organization`,
}) {
  return {
    '@type': type,
    '@id': `${absoluteUrl(pathname)}#webpage`,
    url: absoluteUrl(pathname),
    name: title,
    description,
    isPartOf: {
      '@id': `${siteConfig.siteUrl}#website`,
    },
    ...(about ? { about: { '@id': about } } : {}),
    ...(dateModified ? { dateModified } : {}),
    inLanguage: siteConfig.inLanguage,
    ...(speakable ? { speakable: speakableSchema(speakable) } : {}),
  }
}

export function breadcrumbSchema(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function collectionSchema({ pathname, title, description, items = [] }) {
  return {
    '@type': 'CollectionPage',
    '@id': `${absoluteUrl(pathname)}#collection`,
    url: absoluteUrl(pathname),
    name: title,
    description,
    isPartOf: {
      '@id': `${siteConfig.siteUrl}#website`,
    },
    ...(items.length
      ? {
          hasPart: items.map((item) => ({
            '@type': 'CreativeWork',
            headline: item.title,
            url: absoluteUrl(item.uri || pathname),
            datePublished: item.date || undefined,
          })),
        }
      : {}),
  }
}

export function articleSchema({
  pathname,
  title,
  description,
  image,
  datePublished,
  dateModified,
  author,
  articleSection,
  // Defaults to the Organization; pass a name string (e.g. from an editor's
  // manual SEO override) to publish under a different named publisher instead.
  publisher,
}) {
  const authorEntity =
    author && typeof author === 'object'
      ? personSchema(author) || { '@type': 'Person', name: siteConfig.name }
      : { '@type': 'Person', name: author || siteConfig.name }

  return {
    '@type': 'Article',
    '@id': `${absoluteUrl(pathname)}#article`,
    headline: title,
    description,
    url: absoluteUrl(pathname),
    datePublished,
    dateModified: dateModified || datePublished,
    image: image ? [absoluteUrl(image)] : [absoluteUrl(siteConfig.defaultSocialImage)],
    author: authorEntity,
    publisher: publisher
      ? { '@type': 'Organization', name: publisher }
      : { '@id': `${siteConfig.siteUrl}#organization` },
    mainEntityOfPage: absoluteUrl(pathname),
    ...(articleSection ? { articleSection } : {}),
    isPartOf: {
      '@id': `${siteConfig.siteUrl}#website`,
    },
    inLanguage: siteConfig.inLanguage,
    isAccessibleForFree: true,
    speakable: speakableSchema(['article', 'main']),
  }
}

export function creativeWorkSchema({
  pathname,
  title,
  description,
  image,
  datePublished,
  dateModified,
  client,
  keywords = [],
  // Optional named publisher override (from an editor's manual SEO fields);
  // `creator` always stays the Organization, this just adds a distinct
  // `publisher` entry when one is explicitly set.
  publisher,
}) {
  return {
    '@type': 'CreativeWork',
    '@id': `${absoluteUrl(pathname)}#project`,
    name: title,
    headline: title,
    url: absoluteUrl(pathname),
    description,
    datePublished: datePublished || undefined,
    dateModified: dateModified || datePublished || undefined,
    image: image ? absoluteUrl(image) : absoluteUrl(siteConfig.defaultSocialImage),
    creator: {
      '@id': `${siteConfig.siteUrl}#organization`,
    },
    ...(publisher ? { publisher: { '@type': 'Organization', name: publisher } } : {}),
    ...(client
      ? {
          about: {
            '@type': 'Organization',
            name: client,
          },
        }
      : {}),
    ...(keywords.length ? { keywords } : {}),
    genre: 'Case study',
    mainEntityOfPage: absoluteUrl(pathname),
    inLanguage: siteConfig.inLanguage,
  }
}

export function serviceItemSchema({ pathname, title, description, serviceType }) {
  return {
    '@type': 'Service',
    '@id': `${absoluteUrl(pathname)}#service`,
    name: title,
    ...(serviceType ? { serviceType } : {}),
    description,
    url: absoluteUrl(pathname),
    provider: {
      '@id': `${siteConfig.siteUrl}#organization`,
    },
    areaServed: siteConfig.areaServed.map((name) => ({ '@type': 'Place', name })),
  }
}

// `items` is an array of `{ name, slug, description }`; defaults to the fixed
// five core services so the ItemList's Service `@id`s (`#service`) always
// match the ones each single service page emits.
export function serviceCatalogSchema(pathname, items = siteConfig.services) {
  return {
    '@type': 'ItemList',
    '@id': `${absoluteUrl(pathname)}#services`,
    name: `${siteConfig.name} services`,
    itemListElement: items.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        '@id': serviceId(service.slug),
        name: service.name,
        url: absoluteUrl(`/services/${service.slug}/`),
        ...(service.description ? { description: service.description } : {}),
        provider: {
          '@id': `${siteConfig.siteUrl}#organization`,
        },
      },
    })),
  }
}

export function contactSchema(pathname, dateModified) {
  return {
    '@type': 'ContactPage',
    '@id': `${absoluteUrl(pathname)}#contact`,
    url: absoluteUrl(pathname),
    mainEntity: {
      '@id': `${siteConfig.siteUrl}#organization`,
    },
    ...(dateModified ? { dateModified } : {}),
  }
}

export function faqSchema(pathname, items = [], speakable) {
  return {
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(pathname)}#faq`,
    url: absoluteUrl(pathname),
    ...(speakable ? { speakable: speakableSchema(speakable) } : {}),
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
