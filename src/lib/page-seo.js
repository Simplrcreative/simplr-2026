import { routeDefinitions } from '../config/site.js'
import { stripHtml } from './wp-api.js'
import {
  articleSchema,
  breadcrumbSchema,
  contactSchema,
  creativeWorkSchema,
  normaliseDescription,
  serviceItemSchema,
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
  return normaliseDescription(page?.excerpt || page?.content || '')
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

export function buildStaticPageSeo(pageKey, page, extraSchema = []) {
  const route = routeDefinitions[pageKey]
  const pathname = normalizePathname(route.path)
  const title = page?.title || route.label
  const description = normaliseDescription(page?.intro || page?.excerpt)

  return {
    title,
    description,
    pathname,
    image: page?.image?.sourceUrl,
    schema: [
      webPageSchema({
        pathname,
        title,
        description,
        type: route.schemaType,
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
  const title = page?.title || route.label
  const description = normaliseDescription(page?.intro || page?.excerpt)

  return {
    title,
    description,
    pathname,
    image: page?.image?.sourceUrl,
    schema: [
      contactSchema(pathname),
      webPageSchema({ pathname, title, description, type: route.schemaType }),
      buildBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: title, path: pathname },
      ]),
    ],
  }
}

export function buildWorkSingleSeo(work, pathname) {
  const title = work?.title || 'Work'
  const description = extractWorkDescription(work)
  const image = extractWorkImage(work)
  const client = work?.acfWorkBuilder?.acfClient?.nodes?.[0]?.name
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
        client,
      }),
      webPageSchema({ pathname: normalizedPath, title, description }),
      buildBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Work', path: routeDefinitions.work.path },
        { name: title, path: normalizedPath },
      ]),
    ],
  }
}

export function buildThinkingSingleSeo(page, pathname) {
  const title = page?.title || 'Thinking'
  const description = extractThinkingDescription(page)
  const image = extractThinkingImage(page)
  const normalizedPath = normalizePathname(pathname)
  const author =
    page?.acfPostBuilder?.acfAuthor?.nodes?.[0]?.name || page?.author?.node?.name

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
        author,
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
  const title = page?.title || service?.acfTitle || service?.acfService || slug || 'Service'
  const description = normaliseDescription(page?.excerpt || service?.acfHeading || '')
  const image = page?.acfServiceBuilder?.acfFeaturedImage?.node?.guid || ''
  const normalizedPath = normalizePathname(pathname)

  return {
    title,
    description,
    pathname: normalizedPath,
    image,
    schema: [
      serviceItemSchema({ pathname: normalizedPath, title, description }),
      webPageSchema({ pathname: normalizedPath, title, description }),
      buildBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Services', path: routeDefinitions.services.path },
        { name: title, path: normalizedPath },
      ]),
    ],
  }
}
