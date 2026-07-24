import { buildNavigation, fallbackCollections, fallbackPages, routeDefinitions, siteConfig, wpConfig } from '../config/site.js'

const cache = new Map()

// Shared per-item SEO override fields (title/description/author/publisher/image).
// Same ACF field group is assigned to Page, Post, and AcfWork in WordPress, so
// this fragment is reused verbatim across all four content queries below.
const acfSeoBuilderFields = `
  acfSeoBuilder {
    acfSeoTitle
    acfSeoDescription
    acfSeoAuthor
    acfSeoPublisher
    acfSeoImage {
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
  }
`

const contentNodeFields = `
  id
  slug
  date
  modified
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
  ... on Page {
    ${acfSeoBuilderFields}
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

const servicesQuery = `
  query servicesQuery {
    page(id: "12", idType: DATABASE_ID) {
      acfServices {
        acfHeading
        acfIntroductionLead
        acfIntroduction
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
      date
      modified
      ${acfSeoBuilderFields}
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
          acfCta {
            target
            title
            url
          }
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
                acfName
                acfRole
                acfTestimonial
              }
            }
          }
        }
        acfCaseStudy {
          nodes {
            ... on AcfWork {
              slug
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
              guid
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
      acfAboutBuilder {
        acfLandingHeading
        acfLandingLead
        acfLandingIntroduction
        acfTeamIntroduction
        acfPrinciplesHeading
        acfPrinciples {
          acfHeading
          acfContent
          acfColour
        }
        acfValues {
          acfValue
          acfContent
          acfTitle
        }
        acfHowWeWork {
          acfHeading
          acfContent
          acfColour
          acfVideo {
            node {
              sourceUrl
            }
          }
          acfImage {
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
        }
        acfClients {
          acfClient
          acfLogo {
            node {
              sourceUrl
            }
          }
          acfLogoFormat
        }
        acfAwards {
          acfAward
          acfProjects {
            acfAwardDetails
            acfYear
            acfCaseStudy {
              nodes {
                ... on AcfWork {
                  slug
                  title
                  date
                  acfWorkBuilder {
                    acfClient {
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
        acfFaqs {
          acfQuestion
          acfAnswer
        }
      }
    }
  }
`

const beyondQuery = `
  query beyondQuery($first: Int = 100) {
    acfBeyonds(first: $first) {
      nodes {
        acfBeyondBuilder {
          acfImages {
            acfCaption
            acfImage {
              node {
                guid
                mimeType
                mediaDetails {
                  width
                  height
                  sizes {
                    name
                    width
                    height
                    mimeType
                    sourceUrl
                  }
                }
              }
            }
            acfVideo {
              node {
                guid
                mediaDetails {
                  width
                  height
                }
              }
            }
          }
        }
      }
    }
  }
`

const DEFAULT_WORKS_LIST_FIRST = 6
const NEXT_WORK_CANDIDATES_FIRST = 12
const MAX_WORKS_LIST_FIRST = 50
const DEFAULT_THINKING_POSTS_FIRST = 4
const MAX_THINKING_POSTS_FIRST = 50

const worksListQuery = `
  query WorksListQuery($first: Int = 12) {
    acfWorks(first: $first) {
      nodes {
        databaseId
        slug
        title
        acfWorkBuilder {
          acfOrder
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
          acfSecondaryThumbnail {
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

const workByUriQuery = `
  query WorkByUriQuery($uri: String!) {
    nodeByUri(uri: $uri) {
      __typename
      ... on AcfWork {
        slug
        title
        date
        modified
        ${acfSeoBuilderFields}
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
          acfSecondaryThumbnail {
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
          acfLinkToWebsite
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
                  width
                  height
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
                  width
                  height
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
            acfClickToPlayVideo1
            acfVideo2 {
              node {
                guid
              }
            }
            acfClickToPlayVideo2
            acfSliderImages {
              nodes {
                guid
                mediaDetails {
                  sizes {
                    name
                    sourceUrl
                  }
                }
              }
            }
            acfMakeSticky1
            acfMakeSticky2
            acfMakeStickyText1
            acfMakeStickyText2
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
        acfName
        acfRole
        acfTestimonial
      }
    }
  }
`

const postsQuery = `
  query PostQuery($first: Int = 6) {
    posts(first: $first, where: { status: PUBLISH }) {
      nodes {
        slug
        title(format: RENDERED)
        content
        date
        author {
          node {
            name
            acfUserBuilder {
              acfProfileImage {
                node {
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
          acfAuthor {
            nodes {
              name
              acfUserBuilder {
                acfProfileImage {
                  node {
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
          acfFeaturedImage {
            node {
              altText
              title
              guid
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
                      mediaDetails {
                        sizes {
                          name
                          sourceUrl
                        }
                      }
                    }
                  }
                  acfSecondaryThumbnail {
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
                }
              }
            }
          }
        }
      }
    }
  }
`

const thinkingEntryBySlugQuery = `
  query ThinkingEntryBySlugQuery($slug: String!) {
    posts(first: 1, where: { status: PUBLISH, name: $slug }) {
      nodes {
        slug
        title(format: RENDERED)
        content
        date
        modified
        ${acfSeoBuilderFields}
        author {
          node {
            name
            acfUserBuilder {
              acfProfileImage {
                node {
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
          acfAuthor {
            nodes {
              name
              acfUserBuilder {
                acfProfileImage {
                  node {
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
          acfFeaturedImage {
            node {
              altText
              title
              guid
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
                      mediaDetails {
                        sizes {
                          name
                          sourceUrl
                        }
                      }
                    }
                  }
                  acfSecondaryThumbnail {
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
                }
              }
            }
          }
        }
      }
    }
  }
`

const landingByUriQuery = `
  query LandingByUriQuery($slug: String!) {
  acfLandingPages(first: 1, where: {status: PUBLISH, name: $slug}) {
    nodes {
      slug
      title(format: RENDERED)
      acfLandingPageBuilder {
        acfHeadline
        featuredVideo {
          node {
            guid
            mediaItemUrl
          }
        }
        acfFeaturedImage {
          node {
            mediaDetails {
              sizes {
                name
                sourceUrl
              }
            }
          }
        }
        acfIntroduction
        acfShowForm
        acfSections {
          acfHeadline
          acfIntroduction
          acfContent
          acfContentAfter
          acfSteps {
            acfTitle
            acfContent
          }
          acfFeatures {
            acfTitle
            acfContent
            acfSwag {
              acfDetail
              acfNumber
              acfPostUnit
              acfPreUnit
            }
          }
          acfCta {
            target
            title
            url
          }
        }
      }
    }
  }
}
`

const homeCaseStudiesQuery = `
  query HomeCaseStudiesQuery {
    page(id: "5", idType: DATABASE_ID) {
      acfHomeBuilder {
        acfFeaturedCaseStudies {
          acfClientDetail
          acfCaseStudy {
            nodes {
              ... on AcfWork {
                title
                slug
                acfWorkBuilder {
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
                      sourceUrl
                      mediaDetails {
                        sizes {
                          name
                          sourceUrl
                        }
                      }
                    }
                  }
                  acfSecondaryThumbnail {
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
                acfName
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
                acfSecondaryThumbnail {
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
        acfFaqs {
          acfQuestion
          acfAnswer
        }
      }
    }
  }
`

const homeHeroMediaQuery = `
  query HomeHeroMediaQuery {
    page(id: "5", idType: DATABASE_ID) {
      acfHomeBuilder {
        acfHeroVideoLoop {
          node {
            guid
          }
        }
        acfHeroVideoPoster {
          node {
            guid
          }
        }
        acfHeroVideoFull {
          node {
            guid
          }
        }
      }
    }
  }
`

const homeWorkCountQuery = `
  query HomeWorkCountQuery {
    nodeByUri(uri: "/") {
      ... on Page {
        acfHomeBuilder {
          acfWorkCount
        }
      }
    }
  }
`
function normaliseHomeCaseStudy(study, index) {
  const caseStudy = study?.acfCaseStudy?.nodes?.[0]
  const client = caseStudy?.acfWorkBuilder?.acfClient?.nodes?.[0]?.name || 'Case study'
  const slug = caseStudy?.slug || `case-study-${index + 1}`
  const detail = study?.acfClientDetail || caseStudy?.title || client
  const featuredThumbnailNode = caseStudy?.acfWorkBuilder?.acfFeaturedThumbnail
  const secondaryThumbnailNode = caseStudy?.acfWorkBuilder?.acfSecondaryThumbnail
  const primaryThumbnail = getMediaSourceUrl(featuredThumbnailNode, 'large')
  const secondaryThumbnail = getMediaSourceUrl(secondaryThumbnailNode, 'large')
  const primaryLoaderImg = getMediaSourceUrl(featuredThumbnailNode, 'loader')
  const secondaryLoaderImg = getMediaSourceUrl(secondaryThumbnailNode, 'loader') || primaryLoaderImg
  const displayThumbnail = secondaryThumbnail || primaryThumbnail
  const displayLoaderImg = secondaryLoaderImg || primaryLoaderImg
  const categories = caseStudy?.acfWorkBuilder?.acfCategory?.nodes ?? []

  return {
    id: slug,
    slug,
    client,
    detail,
    loaderImg: displayLoaderImg,
    thumbnail: displayThumbnail,
    primaryThumbnail,
    secondaryThumbnail: secondaryThumbnail || primaryThumbnail,
    primaryLoaderImg,
    secondaryLoaderImg,
    categories,
  }
}

function normaliseHomeTestimonial(acfHomeBuilder) {
  const testimonial = acfHomeBuilder?.acfTestimonial?.nodes?.[0] ?? null
  const testimonialData = testimonial?.acfTestimonials ?? null
  const caseStudy = acfHomeBuilder?.acfCaseStudy?.nodes?.[0] ?? null
  const caseStudyBuilder = caseStudy?.acfWorkBuilder
  const featuredThumbnailNode = caseStudyBuilder?.acfFeaturedThumbnail
  const secondaryThumbnailNode = caseStudyBuilder?.acfSecondaryThumbnail

  const primaryLoaderImg = getMediaSourceUrl(featuredThumbnailNode, 'loader')
  const primaryImage = getMediaSourceUrl(featuredThumbnailNode, 'large')
  const secondaryLoaderImg = getMediaSourceUrl(secondaryThumbnailNode, 'loader') || primaryLoaderImg
  const secondaryImage = getMediaSourceUrl(secondaryThumbnailNode, 'large') || primaryImage

  if (!testimonial && !caseStudy) {
    return null
  }

  return {
    testimonial,
    testimonialData,
    caseStudy,
    caseStudyCategories: caseStudyBuilder?.acfCategory?.nodes ?? [],
    caseStudyLoaderImg: primaryLoaderImg,
    caseStudyImage: primaryImage,
    caseStudyLoaderImg2: secondaryLoaderImg,
    caseStudyImage2: secondaryImage,
  }
}

function normaliseFaqs(rawFaqs) {
  return (rawFaqs ?? [])
    .map((item) => ({
      question: String(item?.acfQuestion || '').trim(),
      answer: String(item?.acfAnswer || '').trim(),
    }))
    .filter((item) => item.question && item.answer)
}

function normaliseHomeFaqs(acfHomeBuilder) {
  return normaliseFaqs(acfHomeBuilder?.acfFaqs)
}

async function fetchHomeCaseStudiesData() {
  if (!wpConfig.endpoint) {
    return {
      caseStudies: [],
      testimonialBlock: null,
      faqs: [],
    }
  }

  try {
    const data = await remember('home:case-studies', () => graphQlRequest(homeCaseStudiesQuery))
    const acfHomeBuilder = data.page?.acfHomeBuilder
    const studies = acfHomeBuilder?.acfFeaturedCaseStudies ?? []

    return {
      caseStudies: studies.map(normaliseHomeCaseStudy).filter((study) => study.slug),
      testimonialBlock: normaliseHomeTestimonial(acfHomeBuilder),
      faqs: normaliseHomeFaqs(acfHomeBuilder),
    }
  } catch (error) {
    reportError('Unable to load home featured case studies', error)
    return {
      caseStudies: [],
      testimonialBlock: null,
      faqs: [],
    }
  }
}

/**
 * Home page FAQs, fetched standalone so the About page can use them as a
 * fallback when it has no FAQs of its own. Shares the same query + cache
 * entry as fetchHomeCaseStudiesData, so if the Home page has already been
 * loaded this session it's effectively free.
 */
export async function fetchHomeFaqsData() {
  if (!wpConfig.endpoint) {
    return { faqs: [] }
  }

  try {
    const data = await remember('home:case-studies', () => graphQlRequest(homeCaseStudiesQuery))
    const acfHomeBuilder = data.page?.acfHomeBuilder

    return { faqs: normaliseHomeFaqs(acfHomeBuilder) }
  } catch (error) {
    reportError('Unable to load home FAQs', error)
    return { faqs: [] }
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
    const result = await remember('home:hero-media', () => graphQlRequest(homeHeroMediaQuery))
    const acfHomeBuilder = result?.page?.acfHomeBuilder

    return {
      heroVideoLoop: acfHomeBuilder?.acfHeroVideoLoop?.node?.guid ?? '',
      heroVideoPoster: acfHomeBuilder?.acfHeroVideoPoster?.node?.guid ?? '',
      heroVideoPosterAlt: '',
      heroVideoFull: acfHomeBuilder?.acfHeroVideoFull?.node?.guid ?? '',
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

/**
 * Resolve a WP media node URL with a shared size fallback chain.
 * Desktop featured/case-study images use large → full → guid (not medium_large),
 * so Home case studies and Work Single heroes stay identical when "large" is missing.
 */
export function getMediaSourceUrl(media, preferredSize = 'large') {
  const node = media?.node ?? media
  if (!node) return ''

  const sizes = node?.mediaDetails?.sizes ?? []
  const chains = {
    loader: ['loader', 'thumbnail', 'medium'],
    thumbnail: ['thumbnail', 'loader', 'medium'],
    medium: ['medium', 'medium_large', 'large', 'full'],
    medium_large: ['medium_large', 'large', 'full'],
    large: ['large', 'full'],
    full: ['full', 'large'],
  }

  const chain = chains[preferredSize] ?? [preferredSize, 'large', 'full']

  for (const name of chain) {
    const url = sizes.find((size) => size?.name === name)?.sourceUrl
    if (url) return url
  }

  return node?.guid ?? node?.sourceUrl ?? ''
}

/**
 * Warm the Work index route: list + page + testimonials for the first batch.
 * Fire-and-forget; results land in the GraphQL remember() cache.
 */
export function prefetchWorkRoute() {
  Promise.all([fetchWorksData(), fetchPageData('work')])
    .then(([{ works }]) => {
      const testimonialIds = [
        ...new Set(
          (works ?? []).flatMap(
            (work) => work.acfWorkBuilder?.acfTestimonial?.nodes?.map((n) => n.databaseId) ?? [],
          ),
        ),
      ].filter(Boolean)

      return Promise.all(testimonialIds.map((id) => fetchTestimonialData(id)))
    })
    .catch(() => {})
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
    // Deliberately NOT falling back to `node.content` here: WordPress's
    // built-in "Page" post type doesn't support excerpts (WPGraphQL never
    // resolves `excerpt` for it), and these ACF-driven pages' generic WYSIWYG
    // body field is unused scaffolding (often a placeholder like "Fokkol"),
    // not real copy — it's the wrong thing to show as a meta description.
    excerpt: node.excerpt ? summarise(node.excerpt) : '',
    content: node.content || '',
    date: node.date || null,
    modified: node.modified || null,
    author: node.author?.node?.name || siteConfig.name,
    acfSeoBuilder: node.acfSeoBuilder || null,
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

function toPositiveInt(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

async function fetchHomeWorkCount() {
  if (!wpConfig.endpoint) {
    return 0
  }

  try {
    const data = await remember('home:work-count', () => graphQlRequest(homeWorkCountQuery))
    return toPositiveInt(data.nodeByUri?.acfHomeBuilder?.acfWorkCount)
  } catch (error) {
    reportError('Unable to load home work count', error)
    return 0
  }
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

export async function fetchNavigationData() {
  const workCount = await fetchHomeWorkCount()
  return buildNavigation({ work: workCount })
}

export async function fetchHomeData() {
  const [pagePayload, worksPayload, homeFeatureData, homeHeroMedia, peoplePayload] = await Promise.all([
    fetchPageData('home'),
    fetchWorksData({ first: 24 }),
    fetchHomeCaseStudiesData(),
    fetchHomeHeroMediaData(),
    fetchPeopleData(),
  ])

  const fallbackFeaturedWork = (worksPayload.works || []).slice(0, 3).map((work) => ({
    title: work?.title || '',
    uri: work?.slug ? buildEntryPath('work', work.slug) : buildCollectionPath('work'),
    date: undefined,
  }))

  const fallbackCaseStudies = (worksPayload.works || []).slice(0, 6).map((work, index) => {
    const featuredThumbnailNode = work?.acfWorkBuilder?.acfFeaturedThumbnail
    const secondaryThumbnailNode = work?.acfWorkBuilder?.acfSecondaryThumbnail
    const primaryLoaderImg = getMediaSourceUrl(featuredThumbnailNode, 'loader')
    const secondaryLoaderImg = getMediaSourceUrl(secondaryThumbnailNode, 'loader') || primaryLoaderImg
    const primaryThumbnail = getMediaSourceUrl(featuredThumbnailNode, 'large')
    const secondaryThumbnail = getMediaSourceUrl(secondaryThumbnailNode, 'large')
    const displayThumbnail = secondaryThumbnail || primaryThumbnail

    return {
      id: work?.slug || `case-study-${index + 1}`,
      slug: work?.slug || '',
      client: work?.acfWorkBuilder?.acfClient?.nodes?.[0]?.name || work?.title || 'Case study',
      detail: '',
      loaderImg: secondaryLoaderImg || primaryLoaderImg,
      thumbnail: displayThumbnail,
      primaryThumbnail,
      secondaryThumbnail: secondaryThumbnail || primaryThumbnail,
      primaryLoaderImg,
      secondaryLoaderImg,
      categories: work?.acfWorkBuilder?.acfCategory?.nodes ?? [],
    }
  })

  return {
    ...pagePayload,
    page: {
      ...pagePayload.page,
      ...homeHeroMedia,
      faqs: homeFeatureData.faqs.length ? homeFeatureData.faqs : (pagePayload.page?.faqs ?? []),
    },
    featuredWork: fallbackFeaturedWork,
    caseStudies: homeFeatureData.caseStudies.length ? homeFeatureData.caseStudies : fallbackCaseStudies,
    testimonialBlock: homeFeatureData.testimonialBlock,
    clients: peoplePayload?.aboutContent?.acfClients ?? [],
  }
}

export async function fetchPeopleData() {
  if (!wpConfig.endpoint) {
    return { people: [], aboutContent: [], faqs: [] }
  }

  try {
    const data = await remember('people', () => graphQlRequest(peopleQuery))
    const people = data.page?.acfPeople?.people ?? []
    const aboutContent = data.page?.acfAboutBuilder ?? []
    const faqs = normaliseFaqs(aboutContent?.acfFaqs)

    return { people, aboutContent, faqs }
  } catch (error) {
    reportError('Unable to load about page data', error)

    return { people: [], aboutContent: [], faqs: [] }
  }
}

/**
 * Fisher–Yates shuffle. Returns a new array — never mutates the input.
 */
function shuffleArray(array) {
  const shuffled = [...array]

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

export async function fetchBeyondData() {
  if (!wpConfig.endpoint) {
    return { beyondItems: [] }
  }

  try {
    // Do not memoize this endpoint with a static key; we want new CMS entries
    // to appear immediately while content is being edited.
    const data = await graphQlRequest(beyondQuery)
    const nodes = data.acfBeyonds?.nodes
      ?? data.acfBeyonds
      ?? data.beyonds?.nodes
      ?? []

    const beyondItems = nodes
      .flatMap((entry, entryIndex) => {
        const images = entry?.acfBeyondBuilder?.acfImages ?? []

        return images.map((item, imageIndex) => {
          const videoGuid = item?.acfVideo?.node?.guid   // string URL or undefined
          const imageNode = item?.acfImage               // { node: { guid, mediaDetails, ... } }

          if (!videoGuid && !imageNode?.node?.guid) return null

          const width = videoGuid
            ? Number(item?.acfVideo?.node?.mediaDetails?.width) || null
            : Number(imageNode?.node?.mediaDetails?.width) || null
          const height = videoGuid
            ? Number(item?.acfVideo?.node?.mediaDetails?.height) || null
            : Number(imageNode?.node?.mediaDetails?.height) || null

          return {
            id: `beyond-${entryIndex}-${imageIndex}`,
            type: videoGuid ? 'video' : 'image',
            // video: plain URL string consumed by <video src>
            // image: acfImage object { node: {...} } consumed by getThumbnail()
            source: videoGuid ?? imageNode,
            caption: item?.acfCaption || '',
            width,
            height,
            mimeType: imageNode?.node?.mimeType || null,
            ratio: width && height ? width / height : null,
          }
        })
      })
      .filter(Boolean)

    // Randomize display order — WP returns these in their default/authored
    // order, so shuffle here (each call, since this endpoint isn't cached)
    // to give a fresh mix of images every time this data is fetched.
    return { beyondItems: shuffleArray(beyondItems) }
  } catch (error) {
    reportError('Unable to load beyond data', error)
    return { beyondItems: [] }
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
    const services = data.page?.acfServices || []

    return { services }
  } catch (error) {
    reportError('Unable to load services data', error)

    return { 
      services: [] }
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

function normalizePathSegment(segment) {
  return String(segment ?? '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
}

export function joinRoutePath(...segments) {
  const parts = segments
    .flatMap((segment) => normalizePathSegment(segment).split('/'))
    .filter(Boolean)

  if (!parts.length) return '/'
  return `/${parts.join('/')}/`
}

export function buildCollectionPath(collectionKey) {
  return routeDefinitions[collectionKey]?.path ?? '/'
}

export function buildThinkingFilterPath(filterSlug) {
  return joinRoutePath(routeDefinitions.thinking.path, filterSlug)
}

export function buildEntryPath(collectionKey, slug, options = {}) {
  const basePath = routeDefinitions[collectionKey]?.path ?? '/'

  if (collectionKey === 'thinking') {
    const topicSlug = normalizePathSegment(options.topicSlug || 'news')
    return joinRoutePath(basePath, topicSlug, slug)
  }

  return joinRoutePath(basePath, slug)
}

/**
 * Prefetch work entry data to warm GraphQL cache.
 * Call on case study hover to speed up subsequent navigation.
 */
export function prefetchWorkEntry(slug) {
  if (!slug) return
  // Fire and forget — results are cached by the API layer
  Promise.all([
    fetchWorkEntryData(slug),
    fetchNextWorkData(slug),
  ]).catch(() => {}) // Silently ignore errors
}

/**
 * Pins works with a positive acfOrder (e.g. 1, 2) to the front, ordered
 * ascending by that value. Everything else (acfOrder blank/0/invalid) keeps
 * whatever order the API returned it in (its normal default/chronological
 * position), just shifted after the pinned items.
 */
function sortWorksByPinnedOrder(works) {
  const pinned = []
  const rest = []

  works.forEach((work) => {
    const order = Number(work?.acfWorkBuilder?.acfOrder)
    if (Number.isFinite(order) && order > 0) {
      pinned.push(work)
    } else {
      rest.push(work)
    }
  })

  pinned.sort((a, b) => Number(a.acfWorkBuilder.acfOrder) - Number(b.acfWorkBuilder.acfOrder))

  return pinned.length ? [...pinned, ...rest] : rest
}

export async function fetchWorksData(options = {}) {
  let first = DEFAULT_WORKS_LIST_FIRST

  if (options && typeof options === 'object') {
    const parsed = Number.parseInt(options.first, 10)
    if (Number.isFinite(parsed) && parsed > 0) {
      first = Math.min(parsed, MAX_WORKS_LIST_FIRST)
    }
  }

  if (!wpConfig.endpoint) {
    return { works: [] }
  }

  try {
    // Always fetch (and cache) the full pool up to MAX_WORKS_LIST_FIRST rather
    // than exactly `first`. A pinned (acfOrder) work can sit anywhere in the
    // underlying default/date order, so a narrower fetch could miss it
    // entirely — it would only "appear" pinned once a later, larger request
    // (e.g. load-more) happened to reach far enough back to include it.
    // Every caller shares this one cached pool and just slices to their own
    // `first`, so this also means there's only ever one network request.
    const data = await remember(`works:${MAX_WORKS_LIST_FIRST}`, () =>
      graphQlRequest(worksListQuery, { first: MAX_WORKS_LIST_FIRST }),
    )
    const works = sortWorksByPinnedOrder(data.acfWorks?.nodes ?? [])

    return { works: works.slice(0, first) }
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
    const { works } = await fetchWorksData({ first: NEXT_WORK_CANDIDATES_FIRST })
    const others = works.filter((w) => w.slug !== currentSlug)

    if (!others.length) return null

    const pick = others[Math.floor(Math.random() * others.length)]
    const featuredThumbnailNode = pick?.acfWorkBuilder?.acfFeaturedThumbnail
    const secondaryThumbnailNode = pick?.acfWorkBuilder?.acfSecondaryThumbnail
    //const sizes = featuredThumbnailNode?.mediaDetails?.sizes ?? []
    //const thumbnail = (
    //  sizes.find((s) => s.name === 'large')
    //  || sizes.find((s) => s.name === 'full')
    //)?.sourceUrl ?? featuredThumbnailNode?.guid ?? ''

    return {
      slug: pick.slug,
      title: pick.title,
      //thumbnail,
      featuredThumbnailNode,
      secondaryThumbnailNode,
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
    const cleanSlug = String(slug || '').trim().replace(/^\/+|\/+$/g, '')
    const workBaseUri = String(wpConfig.workUriBase || '/work/')
      .replace(/\/+$/g, '')

    const uriCandidates = [
      buildEntryPath('work', cleanSlug),
      joinRoutePath(workBaseUri, cleanSlug).replace(/\/$/, ''),
      `${workBaseUri}/${cleanSlug}/`,
      `${workBaseUri}/${cleanSlug}`,
      `/work/${cleanSlug}/`,
      `/work/${cleanSlug}`,
    ]

    let work = null

    for (const uri of uriCandidates) {
      try {
        const data = await remember(`work-entry:${uri}`, () =>
          graphQlRequest(workByUriQuery, { uri }),
        )

        if (data.nodeByUri) {
          work = data.nodeByUri
          break
        }
      } catch (candidateError) {
        reportError(`Unable to load work entry for URI "${uri}"`, candidateError)
      }
    }

    if (!work) {
      throw new Response('Not found', { status: 404 })
    }

    const featuredThumbnailNode = work?.acfWorkBuilder?.acfFeaturedThumbnail?.node
    const sizes = featuredThumbnailNode?.mediaDetails?.sizes ?? []
    const secondaryThumbnailNode = work?.acfWorkBuilder?.acfSecondaryThumbnail?.node
    const secondarySizes = secondaryThumbnailNode?.mediaDetails?.sizes ?? []
    const thumbnail = (
      sizes.find((s) => s.name === 'large')
      || sizes.find((s) => s.name === 'full')
    )?.sourceUrl ?? featuredThumbnailNode?.guid ?? ''
    const thumbnail2 = (
      secondarySizes.find((s) => s.name === 'large')
      || secondarySizes.find((s) => s.name === 'full')
    )?.sourceUrl ?? secondaryThumbnailNode?.guid ?? thumbnail

    return { work: { ...work, thumbnail, thumbnail2 } }
  } catch (error) {
    if (error instanceof Response) throw error
    reportError(`Unable to load work entry for ${slug}`, error)
    throw new Response('Not found', { status: 404 })
  }
}

export async function fetchThinkingPostsData(options = {}) {
  let first = DEFAULT_THINKING_POSTS_FIRST

  if (options && typeof options === 'object') {
    const parsed = Number.parseInt(options.first, 10)
    if (Number.isFinite(parsed) && parsed > 0) {
      first = Math.min(parsed, MAX_THINKING_POSTS_FIRST)
    }
  }

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
    const data = await remember(`thinking-posts:${first}`, () => graphQlRequest(postsQuery, { first }))
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
    const cleanSlug = String(slug).trim()
    const data = await remember(`thinking-entry:${cleanSlug}`, () =>
      graphQlRequest(thinkingEntryBySlugQuery, { slug: cleanSlug }),
    )
    const post = data.posts?.nodes?.[0] ?? null

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

export async function fetchLandingPageData(slug) {
  if (!wpConfig.endpoint) {
    return { slug, page: null }
  }

  try {
    const data = await remember(`landing-page:${slug}`, () =>
      graphQlRequest(landingByUriQuery, { slug }),
    )

    const node = data.acfLandingPages?.nodes?.[0] ?? null
    return {
      slug,
      page: node,
    }
  } catch (error) {
    reportError(`Unable to load landing page for ${slug}`, error)
    return { slug, page: null }
  }
}