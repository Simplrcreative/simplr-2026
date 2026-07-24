import { buildEntryPath, fetchBeyondData, fetchDefaultPageData, fetchHomeData, fetchHomeFaqsData, fetchLandingPageData, fetchNavigationData, fetchNextWorkData, fetchPageData, fetchPeopleData, fetchServicesSinglePageData, fetchServicesData, fetchTestimonialData, fetchThinkingEntryData, fetchThinkingPostsData, fetchWorksData, fetchWorkEntryData, getThinkingTopicSlug, prefetchWorkEntry } from '../lib/wp-api.js'

// Cheap and cached; reused so the Thinking single page's author schema can
// resolve to the same Person `@id` as the About page's People repeater.
async function fetchPeopleForAuthorLookup() {
  const { people } = await fetchPeopleData()
  return people
}

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
    const [{ works }, pagePayload] = await Promise.all([
      fetchWorksData(),
      fetchPageData('work'),
    ])

    const testimonialIds = [
      ...new Set(
        works.flatMap(
          (w) => w.acfWorkBuilder?.acfTestimonial?.nodes?.map((n) => n.databaseId) ?? [],
        ),
      ),
    ].filter(Boolean)

    // Do not block route commit on N+1 testimonial requests — WorkPage resolves these.
    const testimonials = Promise.all(
      testimonialIds.map(async (id) => [id, await fetchTestimonialData(id)]),
    ).then((entries) => Object.fromEntries(entries))

    return {
      works,
      workCount: works.length,
      testimonials,
      page: pagePayload.page,
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
    const [peoplePayload, pagePayload, homeFaqsPayload] = await Promise.all([
      fetchPeopleData(),
      fetchPageData('about'),
      fetchHomeFaqsData(),
    ])

    // Prefer the About page's own FAQs (acfAboutBuilder.acfFaqs); fall back
    // to the Home page's FAQs if the About page hasn't been given its own.
    const faqs = peoplePayload.faqs?.length ? peoplePayload.faqs : homeFaqsPayload.faqs

    return {
      ...peoplePayload,
      page: pagePayload.page,
      faqs,
    }
  }
}

export function createServicesLoader() {
  return async function servicesLoader() {
    const [servicesPayload, pagePayload] = await Promise.all([
      fetchServicesData(),
      fetchPageData('services'),
    ])

    return {
      ...servicesPayload,
      page: pagePayload.page,
    }
  }
}

export function createServicesSinglePageLoader() {
  return async function ServicesSinglePageLoader({ params }) {
    return fetchServicesSinglePageData(params.slug)
  }
}

export function createThinkingPageLoader() {
  return async function ThinkingPageLoader() {
    const [postsPayload, pagePayload] = await Promise.all([
      fetchThinkingPostsData({ first: 8 }),
      fetchPageData('thinking'),
    ])

    return {
      ...postsPayload,
      page: pagePayload.page,
    }
  }
}

export function createThinkingSinglePageLoader() {
  return async function ThinkingSinglePageLoader({ params, request }) {
    const [entry, { posts }, people] = await Promise.all([
      fetchThinkingEntryData(params.slug),
      fetchThinkingPostsData({ first: 8 }),
      fetchPeopleForAuthorLookup(),
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

    return { ...entry, posts, topicSlug: canonicalTopicSlug, people }
  }
}

export function createContactPageLoader() {
  return async function ContactPageLoader() {
    const pagePayload = await fetchPageData('contact')
    return { page: pagePayload.page }
  }
}

export function createEst2014PageLoader() {
  return async function Est2014PageLoader() {
    const [data, pagePayload] = await Promise.all([
      fetchBeyondData(),
      fetchPageData('est2014'),
      import('../infinite-canvas/scene.jsx'),
    ])

    return {
      ...data,
      page: pagePayload.page,
    }
  }
}

export function createDefaultPageLoader() {
  return async function defaultPageLoader({ request }) {
    const slug = new URL(request.url).pathname.replace(/^\/|\/$/g, '')
    const data = await fetchDefaultPageData(slug)
    if (!data.page) {
      throw new Response('Not found', { status: 404 })
    }
    return data
  }
}

export function createLandingPageLoader() {
  return async function landingPageLoader({ params }) {
    const slug = String(params.slug ?? '').replace(/^\/|\/$/g, '')

    // Only single-segment root slugs — nested paths fall through to NotFound.
    if (!slug || slug.includes('/')) {
      throw new Response('Not found', { status: 404 })
    }

    const data = await fetchLandingPageData(slug)
    if (!data.page) {
      throw new Response('Not found', { status: 404 })
    }
    return data
  }
}