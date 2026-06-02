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
          acfLinkToService {
            nodes {
              ... on Page {
                acfServiceBuilder {
                 acfFeaturedVideo {
                    node {
                      guid
                    }
                  }
                  acfFeaturedImage {
                    node {
                      guid
                      altText
                      mimeType
                      altText
                      mimeType
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

const serviceSinglePageQuery = `
  query ServiceSinglePage($id: ID!) {
    page(id: $id, idType: URI) {
      slug
      uri
      title(format: RENDERED)
      acfServiceBuilder {
        acfHeading
        acfFeaturedVideo {
          node {
            guid
          }
        }
        acfFeaturedImage {
          node {
            guid
            altText
            mimeType
          }
        }
        acfSections {
          acfSectionHeading
          acfSectionContent
          acfAccordion {
            acfTitle
            acfContent
          }
        }
        acfTestimonial {
          nodes {
            ... on AcfTestimonial {
              title
              acfTestimonials {
                acfRole
                acfTestimonial
              }
            }
          }
        }
        acfCaseStudy {
          nodes {
            ... on AcfWork {
              acfWorkBuilder {
                acfClient {
                  nodes {
                    name
                  }
                }
                acfCategory {
                  nodes {
                    name
                  }
                }
                acfFeaturedThumbnail {
                  node {
                    guid
                    altText
                    mimeType
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
  query WorksQuery($first: Int = 100) {
    acfWorks(first: $first) {
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
              guid
              altText
              mimeType
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
                altText
                mimeType
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
                altText
                mimeType
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
        topics {
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
              altText
              mimeType
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
                      altText
                      mimeType
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
                      guid
                      altText
                      mimeType
                      sourceUrl
                      mediaDetails {
                        sizes {
                          name
                          sourceUrl
                        }
                      }
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
        acfTestimonial {
          nodes {
            ... on AcfTestimonial {
              title
              acfTestimonials {
                acfRole
                acfTestimonial
              }
            }
          }
        }
        acfCaseStudy {
          nodes {
            slug
            ... on AcfWork {
              acfWorkBuilder {
                acfClient {
                  nodes {
                    name
                  }
                }
                acfCategory {
                  nodes {
                    name
                  }
                }
                acfFeaturedThumbnail {
                  node {
                    guid
                    altText
                    mimeType
                    sourceUrl
                    mediaDetails {
                      sizes {
                        name
                        sourceUrl
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
  }
`

const homeHeroVideoLoopQuery = `
  query HomeHeroVideoLoopQuery {
    page(id: "5", idType: DATABASE_ID) {
      acfHomeBuilder {
        acfHeroVideoLoop {
          node {
            guid
          }
        }
      }
    }
  }
`

const homeHeroVideoPosterQuery = `
  query HomeHeroVideoPosterQuery {
    page(id: "5", idType: DATABASE_ID) {
      acfHomeBuilder {
        acfHeroVideoPoster {
          node {
            guid
          }
        }
      }
    }
  }
`

const homeHeroVideoFullQuery = `
  query HomeHeroVideoFullQuery {
    page(id: "5", idType: DATABASE_ID) {
      acfHomeBuilder {
        acfHeroVideoFull {
          node {
            guid
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
  const featuredThumbnailNode = caseStudy?.acfWorkBuilder?.acfFeaturedThumbnail?.node
  const sizes = featuredThumbnailNode?.mediaDetails?.sizes ?? []
  const thumbnail = (
    sizes.find((s) => s.name === 'large')
    || sizes.find((s) => s.name === 'full')
  )?.sourceUrl ?? featuredThumbnailNode?.sourceUrl ?? featuredThumbnailNode?.guid ?? ''
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

function normaliseHomeTestimonial(acfHomeBuilder) {
  const testimonial = acfHomeBuilder?.acfTestimonial?.nodes?.[0] ?? null
  const testimonialData = testimonial?.acfTestimonials ?? null
  const caseStudy = acfHomeBuilder?.acfCaseStudy?.nodes?.[0] ?? null
  const caseStudyBuilder = caseStudy?.acfWorkBuilder
  const featuredThumbnailNode = caseStudyBuilder?.acfFeaturedThumbnail?.node
  const sizes = featuredThumbnailNode?.mediaDetails?.sizes ?? []
  const thumbnail = (
    sizes.find((s) => s.name === 'large')
    || sizes.find((s) => s.name === 'full')
  )?.sourceUrl ?? featuredThumbnailNode?.sourceUrl ?? featuredThumbnailNode?.guid ?? ''

  if (!testimonial && !caseStudy) {
    return null
  }

  return {
    testimonial,
    testimonialData,
    caseStudy,
    caseStudyClient: caseStudyBuilder?.acfClient?.nodes?.[0]?.name ?? '',
    caseStudyCategories: caseStudyBuilder?.acfCategory?.nodes ?? [],
    caseStudyImage: thumbnail,
  }
}

function normaliseHomeHeroMedia(acfHomeBuilder) {
  const posterNode = acfHomeBuilder?.acfHeroVideoPoster?.node
  const poster = posterNode?.guid ?? ''
  const loopVideo = acfHomeBuilder?.acfHeroVideoLoop?.node?.guid
    ?? ''
  const fullVideo = acfHomeBuilder?.acfHeroVideoFull?.node?.guid
    ?? ''

  return {
    heroVideoPoster: poster,
    heroVideoPosterAlt: '',
    heroVideoLoop,
    heroVideoFull,
  }
}

async function fetchHomeCaseStudiesData() {
  if (!wpConfig.endpoint) {
    return {
      caseStudies: [],
      testimonialBlock: null,
    }
  }

  try {
    const data = await remember('home:case-studies', () => graphQlRequest(homeCaseStudiesQuery))
    const acfHomeBuilder = data.page?.acfHomeBuilder
    const studies = acfHomeBuilder?.acfFeaturedCaseStudies ?? []

    return {
      caseStudies: studies.map(normaliseHomeCaseStudy).filter((study) => study.slug),
      testimonialBlock: normaliseHomeTestimonial(acfHomeBuilder),
    }
  } catch (error) {
    reportError('Unable to load home featured case studies', error)
    return {
      caseStudies: [],
      testimonialBlock: null,
    }
  }
}

async function fetchHomeHeroMediaData() {
  if (!wpConfig.endpoint) {
    return {
      heroVideoPoster: '',
      heroVideoPosterAlt: '',
      heroVideoLoop: '',
      heroVideoFull: '',
    }
  }

  try {
    const [loopResult, posterResult, fullResult] = await Promise.all([
      remember('home:hero-media:loop', () => graphQlRequest(homeHeroVideoLoopQuery)).catch((error) => {
        reportError('Unable to load home hero loop video', error)
        return null
      }),
      remember('home:hero-media:poster', () => graphQlRequest(homeHeroVideoPosterQuery)).catch((error) => {
        reportError('Unable to load home hero poster image', error)
        return null
      }),
      remember('home:hero-media:full', () => graphQlRequest(homeHeroVideoFullQuery)).catch((error) => {
        reportError('Unable to load home hero full video', error)
        return null
      }),
    ])

    return {
      heroVideoLoop: loopResult?.page?.acfHomeBuilder?.acfHeroVideoLoop?.node?.guid ?? '',
      heroVideoPoster: posterResult?.page?.acfHomeBuilder?.acfHeroVideoPoster?.node?.guid ?? '',
      heroVideoPosterAlt: '',
      heroVideoFull: fullResult?.page?.acfHomeBuilder?.acfHeroVideoFull?.node?.guid ?? '',
    }
  } catch (error) {
    reportError('Unable to load home hero media', error)
    return {
      heroVideoPoster: '',
      heroVideoPosterAlt: '',
      heroVideoLoop: '',
      heroVideoFull: '',
    }
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
  const [pagePayload, workPayload, homeFeatureData, homeHeroMedia] = await Promise.all([
    fetchPageData('home'),
    fetchCollectionData('work'),
    fetchHomeCaseStudiesData(),
    fetchHomeHeroMediaData(),
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
    page: {
      ...pagePayload.page,
      ...homeHeroMedia,
    },
    featuredWork: (workPayload.items || []).slice(0, 3),
    caseStudies: homeFeatureData.caseStudies.length ? homeFeatureData.caseStudies : fallbackCaseStudies,
    testimonialBlock: homeFeatureData.testimonialBlock,
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

  const cleanSlug = String(slug || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/^services\//, '')

  if (!cleanSlug) {
    return { slug, page: null }
  }

  const uriCandidates = [
    cleanSlug,
    `/${cleanSlug}/`,
    `services/${cleanSlug}`,
    `/services/${cleanSlug}/`,
  ]

  for (const uriId of uriCandidates) {
    try {
      const data = await remember(`service-page:${uriId}`, () =>
        graphQlRequest(serviceSinglePageQuery, { id: uriId }),
      )
      const page = data.page ?? null

      if (page) {
        return { slug, page}
      }
    } catch (error) {
      reportError(`Unable to load service page for URI id "${uriId}"`, error)
    }
  }

  return { slug, page: null }
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

export function getThinkingTopicSlug(entry) {
  const rawTopicSlug = entry?.topics?.nodes?.[0]?.slug
  const normalizedTopicSlug = String(rawTopicSlug || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalizedTopicSlug || 'news'
}

export function buildEntryPath(collectionKey, slug, options = {}) {
  const basePath = routeDefinitions[collectionKey].path

  if (collectionKey === 'thinking') {
    const topicSlug = String(options.topicSlug || 'news')
    return `${basePath}/${topicSlug}/${slug}`
  }

  return `${basePath}/${slug}`
}

export async function fetchWorksData() {
  if (!wpConfig.endpoint) {
    return { works: [] }
  }

  try {
    const data = await remember('works', () => graphQlRequest(worksQuery, { first: 100 }))
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
    const featuredThumbnailNode = pick?.acfWorkBuilder?.acfFeaturedThumbnail?.node
    const sizes = featuredThumbnailNode?.mediaDetails?.sizes ?? []
    const thumbnail = (
      sizes.find((s) => s.name === 'large')
      || sizes.find((s) => s.name === 'full')
    )?.sourceUrl ?? featuredThumbnailNode?.guid ?? ''

    return {
      slug: pick.slug,
      title: pick.title,
      thumbnail,
      featuredThumbnailNode,
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

    const featuredThumbnailNode = work?.acfWorkBuilder?.acfFeaturedThumbnail?.node
    const sizes = featuredThumbnailNode?.mediaDetails?.sizes ?? []
    const thumbnail = (
      sizes.find((s) => s.name === 'large')
      || sizes.find((s) => s.name === 'full')
    )?.sourceUrl ?? featuredThumbnailNode?.guid ?? ''

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
        topics: { nodes: [] },
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
        topics: { nodes: [] },
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