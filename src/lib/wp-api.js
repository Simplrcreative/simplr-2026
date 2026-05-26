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

const servicesQuery = `
  query servicesQuery {
    page(id: "12", idType: DATABASE_ID) {
      acfServices {
        acfServices {
          acfDescription
          acfService
          acfTitle
          acfVideo {
            node {
              guid
            }
          }
        }
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

const worksQuery = `
  query WorksQuery {
    acfWorks {
      nodes {
        databaseId
        slug
        title
        acfWorkBuilder {
          acfFeaturedWork
          acfCategory {
            nodes {
              name
            }
          }
          acfClient {
            nodes {
              name
            }
          }
          acfType {
            nodes {
              name
            }
          }
          acfFeaturedThumbnail {
            node {
              mediaDetails {
                sizes {
                  name
                  sourceUrl
                }
              }
            }
          }
          acfFeaturedVideo {
            node {
              guid
            }
          }
          acfIntroduction
          acfSwag {
            acfPreUnit
            acfPostUnit
            acfNumber
            acfDetail
          }
          acfSections {
            acfLayout
            acfAlignment
            acfContent
            acfContent2
            acfImage1 {
              node {
                guid
                mediaDetails {
                  sizes {
                    name
                    sourceUrl
                  }
                }
              }
            }
            acfImage2 {
              node {
                guid
                mediaDetails {
                  sizes {
                    name
                    sourceUrl
                  }
                }
              }
            }
            acfVideo1 {
              node {
                guid
              }
            }
            acfVideo2 {
              node {
                guid
              }
            }
          }
          acfTestimonial {
            nodes {
              databaseId
            }
          }
        }
      }
    }
  }
`

const testimonialQuery = `
  query TestimonialQuery($id: ID!) {
    acfTestimonial(id: $id, idType: DATABASE_ID) {
      title
      acfClients {
        nodes {
          name
        }
      }
      acfTestimonials {
        acfRole
        acfTestimonial
      }
    }
  }
`

const postsQuery = `
  query PostQuery {
    posts(first: 10, where: { status: PUBLISH }) {
      nodes {
        databaseId
        slug
        title(format: RENDERED)
        content
        date
        acfClients {
          nodes {
            name
          }
        }
        categories {
          nodes {
            name
            link
            slug
          }
        }
        acfPostBuilder {
          acfFeaturedImage {
            node {
              altText
              title
              guid
              mediaDetails {
                sizes {
                  name
                  sourceUrl
                }
              }
            }
          }
          acfLinkedWork {
            nodes {
              ... on AcfWork {
                slug
                title
                acfWorkBuilder {
                  acfCategory {
                    nodes {
                      name
                    }
                  }
                  acfClient {
                    nodes {
                      name
                    }
                  }
                  acfFeaturedThumbnail {
                    node {
                      guid
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

const homeCaseStudiesQuery = `
  query HomePageQuery {
    page(id: "5", idType: DATABASE_ID) {
      acfHomeBuilder {
        acfFeaturedCaseStudies {
          acfClient {
            nodes {
              name
            }
          }
          acfClientDetail
          acfCaseStudy {
            nodes {
              slug
              ... on AcfWork {
                acfWorkBuilder {
                  acfFeaturedThumbnail {
                    node {
                      sourceUrl
                    }
                  }
                  acfCategory {
                    nodes {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

function normaliseHomeCaseStudy(study, index) {
  const caseStudy = study?.acfCaseStudy?.nodes?.[0]
  const client = study?.acfClient?.nodes?.[0]?.name || 'Case study'
  const slug = caseStudy?.slug || `case-study-${index + 1}`
  //const sizes = caseStudy?.acfWorkBuilder?.acfFeaturedThumbnail?.node?.mediaDetails?.sizes ?? []
  const thumbnail = caseStudy?.acfWorkBuilder?.acfFeaturedThumbnail?.node?.sourceUrl || ''
  const categories = caseStudy?.acfWorkBuilder?.acfCategory?.nodes ?? []

  return {
    id: slug,
    slug,
    client,
    detail: study?.acfClientDetail || '',
    thumbnail,
    categories,
  }
}

async function fetchHomeCaseStudiesData() {
  if (!wpConfig.endpoint) {
    return []
  }

  try {
    const data = await remember('home:case-studies', () => graphQlRequest(homeCaseStudiesQuery))
    const studies = data.page?.acfHomeBuilder?.acfFeaturedCaseStudies ?? []

    return studies.map(normaliseHomeCaseStudy).filter((study) => study.slug)
  } catch (error) {
    reportError('Unable to load home featured case studies', error)
    return []
  }
}

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

export async function fetchNavigationData() {
  // Return navigation immediately using static counts from routeDefinitions so
  // the root loader never blocks the initial render on a slow GraphQL request.
  // The WorkPage loader fetches the live count independently when that route loads.
  return buildNavigation()
}

export async function fetchHomeData() {
  const [pagePayload, workPayload, homeCaseStudies] = await Promise.all([
    fetchPageData('home'),
    fetchCollectionData('work'),
    fetchHomeCaseStudiesData(),
  ])

  const fallbackCaseStudies = (workPayload.items || []).slice(0, 6).map((item, index) => ({
    id: item.slug || `case-study-${index + 1}`,
    slug: item.slug,
    client: item.title,
    detail: item.excerpt,
    thumbnail: item.image?.sourceUrl || '',
    categories: [],
  }))

  return {
    ...pagePayload,
    featuredWork: (workPayload.items || []).slice(0, 3),
    caseStudies: homeCaseStudies.length ? homeCaseStudies : fallbackCaseStudies,
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

export async function fetchServicesSinglePageData(slug) {
  if (!wpConfig.endpoint) {
    return { slug, page: null }
  }

  try {
    const uri = `/services/${slug}/`
    const data = await remember(`service-page:${slug}`, () =>
      graphQlRequest(pageByUriQuery, { uri }),
    )

    const node = data.nodeByUri
    return {
      slug,
      page: node ? { title: node.title || slug, description: '' } : null,
    }
  } catch (error) {
    reportError(`Unable to load service page for ${slug}`, error)
    return { slug, page: null }
  }
}

export async function fetchServicesData() {
  if (!wpConfig.endpoint) {
    return { services: [] }
  }

  try {
    const data = await remember('services', () => graphQlRequest(servicesQuery))
    const services = data.page?.acfServices?.acfServices ?? []

    return { services }
  } catch (error) {
    reportError('Unable to load services data', error)

    return { services: [] }
  }
}

export function buildEntryPath(collectionKey, slug) {
  return `${routeDefinitions[collectionKey].path}/${slug}`
}

export async function fetchWorksData() {
  if (!wpConfig.endpoint) {
    return { works: [] }
  }

  try {
    const data = await remember('works', () => graphQlRequest(worksQuery))
    const works = data.acfWorks?.nodes ?? []

    return { works }
  } catch (error) {
    reportError('Unable to load works data', error)

    return { works: [] }
  }
}

export async function fetchTestimonialData(databaseId) {
  if (!wpConfig.endpoint || !databaseId) {
    return null
  }

  try {
    const data = await remember(`testimonial:${databaseId}`, () =>
      graphQlRequest(testimonialQuery, { id: String(databaseId) }),
    )

    return data.acfTestimonial ?? null
  } catch (error) {
    reportError(`Unable to load testimonial ${databaseId}`, error)

    return null
  }
}

export async function fetchNextWorkData(currentSlug) {
  if (!wpConfig.endpoint) return null

  try {
    const { works } = await fetchWorksData()
    const others = works.filter((w) => w.slug !== currentSlug)

    if (!others.length) return null

    const pick = others[Math.floor(Math.random() * others.length)]
    const sizes = pick?.acfWorkBuilder?.acfFeaturedThumbnail?.node?.mediaDetails?.sizes ?? []
    const thumbnail = (
      sizes.find((s) => s.name === 'large')
      || sizes.find((s) => s.name === 'full')
      || sizes[0]
    )?.sourceUrl ?? ''

    return {
      slug: pick.slug,
      title: pick.title,
      thumbnail,
      client: pick.acfWorkBuilder?.acfClient?.nodes?.[0]?.name ?? '',
      categories: pick.acfWorkBuilder?.acfCategory?.nodes ?? [],
    }
  } catch (error) {
    reportError('Unable to load next work', error)
    return null
  }
}

export async function fetchWorkEntryData(slug) {
  if (!slug) {
    throw new Response('Not found', { status: 404 })
  }

  try {
    const { works } = await fetchWorksData()
    const work = works.find((w) => w.slug === slug) ?? null

    if (!work) {
      throw new Response('Not found', { status: 404 })
    }

    const sizes = work?.acfWorkBuilder?.acfFeaturedThumbnail?.node?.mediaDetails?.sizes ?? []
    const thumbnail = (
      sizes.find((s) => s.name === 'large')
      || sizes.find((s) => s.name === 'full')
      || sizes[0]
    )?.sourceUrl ?? ''

    return { work: { ...work, thumbnail } }
  } catch (error) {
    if (error instanceof Response) throw error
    reportError(`Unable to load work entry for ${slug}`, error)
    throw new Response('Not found', { status: 404 })
  }
}

export async function fetchThinkingPostsData() {
  if (!wpConfig.endpoint) {
    return {
      posts: fallbackCollections.thinking.map((item) => ({
        databaseId: item.id,
        slug: item.slug,
        title: item.title,
        date: item.date,
        acfClients: { nodes: [] },
        categories: { nodes: [] },
        featuredImage: {
          node: item.image
            ? {
                sourceUrl: item.image.sourceUrl,
                altText: item.image.altText,
                title: item.title,
                mediaDetails: { sizes: [] },
              }
            : null,
        },
      })),
    }
  }

  try {
    const data = await remember('thinking-posts', () => graphQlRequest(postsQuery))
    const posts = data.posts?.nodes ?? []

    return { posts }
  } catch (error) {
    reportError('Unable to load thinking posts', error)

    return {
      posts: fallbackCollections.thinking.map((item) => ({
        databaseId: item.id,
        slug: item.slug,
        title: item.title,
        date: item.date,
        acfClients: { nodes: [] },
        categories: { nodes: [] },
        featuredImage: {
          node: item.image
            ? {
                sourceUrl: item.image.sourceUrl,
                altText: item.image.altText,
                title: item.title,
                mediaDetails: { sizes: [] },
              }
            : null,
        },
      })),
    }
  }
}

export async function fetchDefaultPageData(slug) {
  if (!wpConfig.endpoint) {
    return { slug, page: null }
  }

  try {
    const uri = `/${slug}/`
    const data = await remember(`default-page:${slug}`, () =>
      graphQlRequest(pageByUriQuery, { uri }),
    )

    const node = data.nodeByUri
    return {
      slug,
      page: node ? { title: node.title || slug, content: node.content || '' } : null,
    }
  } catch (error) {
    reportError(`Unable to load default page for ${slug}`, error)
    return { slug, page: null }
  }
}

export async function fetchThinkingEntryData(slug) {
  if (!slug) {
    throw new Response('Not found', { status: 404 })
  }

  try {
    const { posts } = await fetchThinkingPostsData()
    const post = posts.find((p) => p.slug === slug) ?? null

    if (!post) {
      throw new Response('Not found', { status: 404 })
    }
    return { slug, page: post }
  } catch (error) {
    if (error instanceof Response) throw error
    reportError(`Unable to load thinking entry for ${slug}`, error)
    throw new Response('Not found', { status: 404 })
  }
}