import { buildEntryPath, fetchBeyondData, fetchDefaultPageData, fetchHomeData, fetchNavigationData, fetchNextWorkData, fetchPeopleData, fetchServicesSinglePageData, fetchServicesData, fetchTestimonialData, fetchThinkingEntryData, fetchThinkingPostsData, fetchWorksData, fetchWorkEntryData, getThinkingTopicSlug } from '../lib/wp-api.js'

export function createRootLoader() {
  return async function rootLoader() {
    // Keep root route non-blocking so app shell + intro overlay render immediately.
    // Route-specific loaders fetch their own data.

    return {
      navigation: await fetchNavigationData(),
    }
  }
}

export function createHomeLoader() {
  return function homeLoader() {
    return { homeData: fetchHomeData() }
  }
}

export function createWorkLoader() {
  return async function workLoader() {
    const { works } = await fetchWorksData()

    const testimonialIds = [
      ...new Set(
        works.flatMap(
          (w) => w.acfWorkBuilder?.acfTestimonial?.nodes?.map((n) => n.databaseId) ?? [],
        ),
      ),
    ]

    const testimonialEntries = await Promise.all(
      testimonialIds.map(async (id) => [id, await fetchTestimonialData(id)]),
    )

    return {
      works,
      workCount: works.length,
      testimonials: Object.fromEntries(testimonialEntries),
    }
  }
}

export function createWorkSingleLoader() {
  return async function workEntryLoader({ params }) {
    const result = await fetchWorkEntryData(params.slug)
    const testimonialId = result.work?.acfWorkBuilder?.acfTestimonial?.nodes?.[0]?.databaseId
    const [testimonial, nextWork] = await Promise.all([
      testimonialId ? fetchTestimonialData(testimonialId) : Promise.resolve(null),
      fetchNextWorkData(params.slug),
    ])

    return { ...result, testimonial, nextWork }
  }
}

export function createAboutLoader() {
  return async function aboutLoader() {
    return fetchPeopleData()
  }
}

export function createServicesLoader() {
  return async function servicesLoader() {
    return fetchServicesData()
  }
}

export function createServicesSinglePageLoader() {
  return async function ServicesSinglePageLoader({ params }) {
    return fetchServicesSinglePageData(params.slug)
  }
}

export function createThinkingPageLoader() {
  return async function ThinkingPageLoader() {
    return fetchThinkingPostsData({ first: 8 })
  }
}

export function createThinkingSinglePageLoader() {
  return async function ThinkingSinglePageLoader({ params, request }) {
    const [entry, { posts }] = await Promise.all([
      fetchThinkingEntryData(params.slug),
      fetchThinkingPostsData({ first: 8 }),
    ])

    const canonicalTopicSlug = getThinkingTopicSlug(entry.page)
    const canonicalPath = buildEntryPath('thinking', params.slug, { topicSlug: canonicalTopicSlug })
    const requestedTopicSlug = params.topic
    const requestUrl = new URL(request.url)
    const search = requestUrl.search || ''

    if (requestedTopicSlug !== canonicalTopicSlug) {
      throw new Response(null, {
        status: 302,
        headers: {
          Location: `${canonicalPath}${search}`,
        },
      })
    }

    return { ...entry, posts, topicSlug: canonicalTopicSlug }
  }
}

export function createContactPageLoader() {
  return async function ContactPageLoader() {
  }
}

export function createEst2014PageLoader() {
  return async function Est2014PageLoader() {
    return fetchBeyondData()
  }
}

export function createDefaultPageLoader() {
  return async function defaultPageLoader({ request }) {
    const slug = new URL(request.url).pathname.replace(/^\/|\/$/g, '')
    return fetchDefaultPageData(slug)
  }
}