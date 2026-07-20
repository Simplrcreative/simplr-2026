import { routeDefinitions, siteConfig } from '../config/site.js'
import { stripHtml } from './wp-api.js'
import {
  absoluteUrl,
  articleSchema,
  breadcrumbSchema,
  contactSchema,
  creativeWorkSchema,
  normaliseDescription,
  personSchema,
  serviceItemSchema,
  slugifyName,
  webPageSchema,
} from './seo.js'

export function normalizePathname(pathname) {
  if (!pathname || pathname === '/') return '/'
  return pathname.endsWith('/') ? pathname : `${pathname}/`
}

export function buildBreadcrumbSchema(items) {
  return breadcrumbSchema(
    items.map(({ name, path }) => ({
      name,
      path: normalizePathname(path),
    })),
  )
}

export function extractWorkDescription(work) {
  const intro = work?.acfWorkBuilder?.acfIntroduction
  const introText = Array.isArray(intro)
    ? intro.map((block) => stripHtml(block?.acfContent ?? block)).join(' ')
    : stripHtml(intro || '')

  return normaliseDescription(introText)
}

export function extractThinkingDescription(page) {
  // No `|| page?.content` fallback here on purpose: dumping raw, unedited
  // article body text into a meta description is risky (mid-sentence cuts,
  // placeholder copy). If there's no real excerpt, normaliseDescription()
  // already falls back to the generic site description.
  return normaliseDescription(page?.excerpt)
}

export function extractWorkImage(work) {
  return (
    work?.thumbnail2 ||
    work?.thumbnail ||
    work?.acfWorkBuilder?.acfFeaturedThumbnail?.node?.guid ||
    ''
  )
}

export function extractThinkingImage(page) {
  const node = page?.acfPostBuilder?.acfFeaturedImage?.node
  const sizes = node?.mediaDetails?.sizes ?? []

  return (
    sizes.find((size) => size.name === 'large')?.sourceUrl ??
    sizes.find((size) => size.name === 'medium_large')?.sourceUrl ??
    node?.guid ??
    ''
  )
}

// Reads the manual SEO override fields (acfSeoBuilder) present on Pages,
// Posts, and Work entries. These take priority over whatever title/description
// /image logic each content type would otherwise derive, since an editor set
// them deliberately. `description` is only stripped of HTML, not truncated —
// unlike the auto-derived fallback, we trust an editor-written meta description
// as-is.
export function extractSeoOverrides(node) {
  const seo = node?.acfSeoBuilder ?? {}
  const imageSizes = seo?.acfSeoImage?.node?.mediaDetails?.sizes ?? []
  const image =
    imageSizes.find((size) => size?.name === 'large')?.sourceUrl ??
    imageSizes.find((size) => size?.name === 'medium_large')?.sourceUrl ??
    imageSizes[0]?.sourceUrl ??
    seo?.acfSeoImage?.node?.guid ??
    ''

  return {
    title: stripHtml(seo?.acfSeoTitle || '') || null,
    description: stripHtml(seo?.acfSeoDescription || '') || null,
    image: image || null,
    author: stripHtml(seo?.acfSeoAuthor || '') || null,
    publisher: stripHtml(seo?.acfSeoPublisher || '') || null,
  }
}

// Team members are modelled once, on the About page's People repeater. This
// builds a Person schema for every one of them (used on About), enriching the
// two founders with the fixed jobTitle/LinkedIn kept in siteConfig.founders.
export function buildPeopleSchema(people = []) {
  return (people || [])
    .map((person) => {
      const name = person?.acfName
      if (!name) return null

      const founder = siteConfig.founders.find((f) => f.name === name)

      return personSchema({
        name,
        slug: founder?.aboutId,
        jobTitle: founder?.jobTitle,
        linkedin: founder?.linkedin || person?.acfLinkedIn,
      })
    })
    .filter(Boolean)
}

// Matches a Thinking post's WP-User author against the About page's People
// repeater by name, so the Article's author Person resolves to the same
// `@id` used on the About page. Falls back to a bare name if there's no match.
export function findAuthorPerson(people, authorName) {
  if (!authorName) return null

  const match = (people || []).find((person) => person?.acfName === authorName)
  const founder = siteConfig.founders.find((f) => f.name === authorName)

  if (!match && !founder) {
    return { name: authorName }
  }

  return {
    name: authorName,
    slug: founder?.aboutId || (match ? slugifyName(authorName) : undefined),
    jobTitle: founder?.jobTitle,
    linkedin: founder?.linkedin || match?.acfLinkedIn,
  }
}

export function buildStaticPageSeo(pageKey, page, extraSchema = [], { speakable } = {}) {
  const route = routeDefinitions[pageKey]
  const pathname = normalizePathname(route.path)
  const overrides = extractSeoOverrides(page)
  const title = overrides.title || page?.title || route.label
  const description = overrides.description || normaliseDescription(page?.intro || page?.excerpt)
  const image = overrides.image || page?.image?.sourceUrl

  return {
    title,
    description,
    pathname,
    image,
    schema: [
      webPageSchema({
        pathname,
        title,
        description,
        type: route.schemaType,
        dateModified: page?.modified,
        speakable,
      }),
      buildBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: route.label, path: pathname },
      ]),
      ...extraSchema,
    ],
  }
}

export function buildContactPageSeo(page) {
  const route = routeDefinitions.contact
  const pathname = normalizePathname(route.path)
  const overrides = extractSeoOverrides(page)
  const title = overrides.title || page?.title || route.label
  const description = overrides.description || normaliseDescription(page?.intro || page?.excerpt)
  const image = overrides.image || page?.image?.sourceUrl

  return {
    title,
    description,
    pathname,
    image,
    schema: [
      contactSchema(pathname, page?.modified),
      webPageSchema({ pathname, title, description, type: route.schemaType, dateModified: page?.modified }),
      buildBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: title, path: pathname },
      ]),
    ],
  }
}

export function buildWorkSingleSeo(work, pathname) {
  const overrides = extractSeoOverrides(work)
  const title = overrides.title || work?.title || 'Work'
  const description = overrides.description || extractWorkDescription(work)
  const image = overrides.image || extractWorkImage(work)
  const client = work?.acfWorkBuilder?.acfClient?.nodes?.[0]?.name
  const keywords = (work?.acfWorkBuilder?.acfCategory?.nodes ?? [])
    .map((node) => node?.name)
    .filter(Boolean)
  const normalizedPath = normalizePathname(pathname)

  return {
    title,
    description,
    pathname: normalizedPath,
    image,
    schema: [
      creativeWorkSchema({
        pathname: normalizedPath,
        title,
        description,
        image,
        datePublished: work?.date,
        dateModified: work?.modified,
        client,
        keywords,
        publisher: overrides.publisher,
      }),
      webPageSchema({
        pathname: normalizedPath,
        title,
        description,
        dateModified: work?.modified,
        // The CreativeWork entity above already carries the "about" relationship.
        about: null,
      }),
      buildBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Work', path: routeDefinitions.work.path },
        { name: title, path: normalizedPath },
      ]),
    ],
  }
}

export function buildThinkingSingleSeo(page, pathname, people = []) {
  const overrides = extractSeoOverrides(page)
  const title = overrides.title || page?.title || 'Thinking'
  const description = overrides.description || extractThinkingDescription(page)
  const image = overrides.image || extractThinkingImage(page)
  const normalizedPath = normalizePathname(pathname)
  const authorName =
    overrides.author ||
    page?.acfPostBuilder?.acfAuthor?.nodes?.[0]?.name ||
    page?.author?.node?.name
  const author = findAuthorPerson(people, authorName)
  const articleSection = page?.topics?.nodes?.[0]?.name

  return {
    title,
    description,
    pathname: normalizedPath,
    image,
    schema: [
      articleSchema({
        pathname: normalizedPath,
        title,
        description,
        image,
        datePublished: page?.date,
        dateModified: page?.modified,
        author,
        articleSection,
        publisher: overrides.publisher,
      }),
      buildBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Thinking', path: routeDefinitions.thinking.path },
        { name: title, path: normalizedPath },
      ]),
    ],
  }
}

export function buildServiceSingleSeo(page, slug, pathname) {
  const service = page?.acfServiceBuilder ?? {}
  const overrides = extractSeoOverrides(page)
  const title = overrides.title || page?.title || service?.acfTitle || service?.acfService || slug || 'Service'
  const description = overrides.description || normaliseDescription(page?.excerpt || service?.acfHeading || '')
  const image = overrides.image || page?.acfServiceBuilder?.acfFeaturedImage?.node?.guid || ''
  const normalizedPath = normalizePathname(pathname)

  return {
    title,
    description,
    pathname: normalizedPath,
    image,
    schema: [
      serviceItemSchema({
        pathname: normalizedPath,
        title,
        description,
        serviceType: service?.acfService,
      }),
      webPageSchema({
        pathname: normalizedPath,
        title,
        description,
        dateModified: page?.modified,
        speakable: ['main'],
        about: `${absoluteUrl(normalizedPath)}#service`,
      }),
      buildBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Services', path: routeDefinitions.services.path },
        { name: title, path: normalizedPath },
      ]),
    ],
  }
}
