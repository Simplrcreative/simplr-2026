import { buildNavigation, fallbackCollections, fallbackPages, routeDefinitions, siteConfig, wpConfig } from '../config/site.js'

const cache = new Map()

const contentNodeFields = `
  id
  slug
  date
  ... on UniformResourceIdentifiable {
    uri
  }
  ... on NodeWithTitle {
    title(format: RENDERED)
  }
  ... on NodeWithExcerpt {
    excerpt(format: RENDERED)
  }
  ... on NodeWithContentEditor {
    content(format: RENDERED)
  }
  ... on NodeWithAuthor {
    author {
      node {
        name
      }
    }
  }
  ... on NodeWithFeaturedImage {
    featuredImage {
      node {
        sourceUrl(size: LARGE)
        altText
      }
    }
  }
`

const siteSettingsQuery = `
  query SiteSettings {
    generalSettings {
      title
      description
      url
    }
  }
`

const pageByUriQuery = `
  query PageByUri($uri: String!) {
    nodeByUri(uri: $uri) {
      __typename
      ... on ContentNode {
        ${contentNodeFields}
      }
    }
  }
`

const collectionQuery = `
  query CollectionContent($contentType: ContentTypeEnum!, $first: Int = 24) {
    contentNodes(first: $first, where: { contentTypes: [$contentType], status: PUBLISH }) {
      nodes {
        ${contentNodeFields}
      }
    }
  }
`

const collectionCountQuery = `
  query CollectionCount($contentType: ContentTypeEnum!, $first: Int = 500) {
    contentNodes(first: $first, where: { contentTypes: [$contentType], status: PUBLISH }) {
      nodes {
        id
      }
    }
  }
`

const peopleQuery = `
  query People {
    page(id: "10", idType: DATABASE_ID) {
      acfPeople {
        people {
          acfBio
          acfDivision
          acfName
          acfRole
          acfExperience
          acfLinkedIn
          acfFont
          acfAlign
          acfProfileImage {
            node {
              sourceUrl
            }
          }
        }
      }
    }
  }
`

function remember(key, producer) {
  if (!cache.has(key)) {
    cache.set(
      key,
      Promise.resolve()
        .then(producer)
        .catch((error) => {
          cache.delete(key)
          throw error
        }),
    )
  }

  return cache.get(key)
}

export function stripHtml(value = '') {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function summarise(value, maxLength = 170) {
  const text = stripHtml(value)

  if (!text) {
    return ''
  }

  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength).trimEnd()}...`
}

function normaliseUri(uri = '/') {
  if (!uri) {
    return '/'
  }

  const withLeadingSlash = uri.startsWith('/') ? uri : `/${uri}`

  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

function normaliseNode(node, collectionKey) {
  if (!node) {
    return null
  }

  return {
    id: node.id,
    slug: node.slug,
    uri: normaliseUri(node.uri),
    title: node.title || '',
    excerpt: summarise(node.excerpt || node.content || ''),
    content: node.content || '',
    date: node.date || null,
    author: node.author?.node?.name || siteConfig.name,
    image: node.featuredImage?.node
      ? {
          sourceUrl: node.featuredImage.node.sourceUrl,
          altText: node.featuredImage.node.altText || node.title || '',
        }
      : null,
    collectionKey,
  }
}

function mergePageContent(pageKey, livePage) {
  const fallbackPage = fallbackPages[pageKey]

  if (!livePage) {
    return {
      ...fallbackPage,
      uri: routeDefinitions[pageKey].uri,
      isFallback: true,
    }
  }

  return {
    ...fallbackPage,
    ...livePage,
    intro: livePage.excerpt || fallbackPage.intro,
    content: livePage.content || fallbackPage.content,
    image: livePage.image || fallbackPage.image,
    isFallback: false,
  }
}

function reportError(label, error) {
  if (import.meta.env.DEV) {
    console.warn(`${label}:`, error)
  }
}

function getCollectionContentType(collectionKey) {
  return collectionKey === 'work' ? wpConfig.workContentType : wpConfig.thinkingContentType
}

function getDefaultCollectionCount(collectionKey) {
  return routeDefinitions[collectionKey]?.count ?? 0
}

export async function graphQlRequest(query, variables = {}) {
  if (!wpConfig.endpoint) {
    throw new Error('VITE_WPGRAPHQL_ENDPOINT is not configured.')
  }

  const response = await fetch(wpConfig.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}.`)
  }

  const payload = await response.json()

  if (payload.errors?.length) {
    throw new Error(payload.errors.map(({ message }) => message).join(' | '))
  }

  return payload.data
}

export async function getSiteSettings() {
  if (!wpConfig.endpoint) {
    return {
      title: siteConfig.name,
      description: siteConfig.description,
      url: siteConfig.siteUrl,
    }
  }

  try {
    const data = await remember('site-settings', () => graphQlRequest(siteSettingsQuery))

    return {
      title: data.generalSettings?.title || siteConfig.name,
      description: data.generalSettings?.description || siteConfig.description,
      url: data.generalSettings?.url || siteConfig.siteUrl,
    }
  } catch (error) {
    reportError('Unable to read site settings from WordPress', error)

    return {
      title: siteConfig.name,
      description: siteConfig.description,
      url: siteConfig.siteUrl,
    }
  }
}

export async function fetchPageData(pageKey) {
  const siteSettings = await getSiteSettings()

  if (!wpConfig.endpoint) {
    return {
      pageKey,
      page: mergePageContent(pageKey, null),
      siteSettings,
    }
  }

  try {
    const data = await remember(`page:${pageKey}`, () =>
      graphQlRequest(pageByUriQuery, { uri: routeDefinitions[pageKey].uri }),
    )

    return {
      pageKey,
      page: mergePageContent(pageKey, normaliseNode(data.nodeByUri, pageKey)),
      siteSettings,
    }
  } catch (error) {
    reportError(`Unable to load page for ${pageKey}`, error)

    return {
      pageKey,
      page: mergePageContent(pageKey, null),
      siteSettings,
    }
  }
}

export async function fetchCollectionData(collectionKey) {
  const pagePayload = await fetchPageData(collectionKey)
  const contentType = getCollectionContentType(collectionKey)

  if (!wpConfig.endpoint) {
    return {
      ...pagePayload,
      collectionKey,
      items: fallbackCollections[collectionKey],
    }
  }

  try {
    const data = await remember(`collection:${collectionKey}`, () =>
      graphQlRequest(collectionQuery, { contentType }),
    )

    const items = data.contentNodes?.nodes
      ?.map((node) => normaliseNode(node, collectionKey))
      .filter(Boolean)

    return {
      ...pagePayload,
      collectionKey,
      items: items?.length ? items : fallbackCollections[collectionKey],
    }
  } catch (error) {
    reportError(`Unable to load collection for ${collectionKey}`, error)

    return {
      ...pagePayload,
      collectionKey,
      items: fallbackCollections[collectionKey],
    }
  }
}

export async function fetchCollectionCount(collectionKey) {
  const fallbackCount = getDefaultCollectionCount(collectionKey)

  if (!wpConfig.endpoint) {
    return fallbackCount
  }

  try {
    const contentType = getCollectionContentType(collectionKey)
    const data = await remember(`collection-count:${collectionKey}`, () =>
      graphQlRequest(collectionCountQuery, { contentType }),
    )

    return data.contentNodes?.nodes?.length ?? fallbackCount
  } catch (error) {
    reportError(`Unable to load collection count for ${collectionKey}`, error)

    return fallbackCount
  }
}

export async function fetchNavigationData() {
  const workCount = await fetchCollectionCount('work')

  return buildNavigation({ work: workCount })
}

export async function fetchHomeData() {  const [pagePayload, workPayload] = await Promise.all([
    fetchPageData('home'),
    fetchCollectionData('work'),
  ])

  return {
    ...pagePayload,
    featuredWork: (workPayload.items || []).slice(0, 3),
  }
}

export async function fetchPeopleData() {
  if (!wpConfig.endpoint) {
    return { people: [] }
  }

  try {
    const data = await remember('people', () => graphQlRequest(peopleQuery))
    const people = data.page?.acfPeople?.people ?? []

    return { people }
  } catch (error) {
    reportError('Unable to load people data', error)

    return { people: [] }
  }
}

export async function fetchEntryData(collectionKey, slug) {
  const siteSettings = await getSiteSettings()
  const fallbackItem = fallbackCollections[collectionKey].find((item) => item.slug === slug)

  if (!slug) {
    throw new Response('Not found', { status: 404 })
  }

  if (wpConfig.endpoint) {
    const baseUri = collectionKey === 'work' ? wpConfig.workUriBase : wpConfig.thinkingUriBase
    const entryUri = `${normaliseUri(baseUri)}${slug}/`

    try {
      const data = await remember(`entry:${collectionKey}:${slug}`, () =>
        graphQlRequest(pageByUriQuery, { uri: entryUri }),
      )

      const entry = normaliseNode(data.nodeByUri, collectionKey)

      if (entry) {
        return {
          collectionKey,
          entry: {
            ...fallbackItem,
            ...entry,
            isFallback: false,
          },
          siteSettings,
        }
      }
    } catch (error) {
      reportError(`Unable to load entry for ${collectionKey}/${slug}`, error)
    }
  }

  if (!fallbackItem) {
    throw new Response('Not found', { status: 404 })
  }

  return {
    collectionKey,
    entry: {
      ...fallbackItem,
      isFallback: true,
    },
    siteSettings,
  }
}

export function buildEntryPath(collectionKey, slug) {
  return `${routeDefinitions[collectionKey].path}/${slug}`
}

export function createPagePath(pageKey) {
  return routeDefinitions[pageKey].path
}