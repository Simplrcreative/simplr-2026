import { fetchHomeData, fetchNavigationData, fetchPeopleData, fetchServicesSinglePageData, fetchServicesData, fetchTestimonialData, fetchWorksData, fetchWorkEntryData } from '../lib/wp-api.js'

export function createRootLoader() {
  return async function rootLoader() {
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
      testimonials: Object.fromEntries(testimonialEntries),
    }
  }
}

export function createWorkSingleLoader() {
  return async function workEntryLoader({ params }) {
    return fetchWorkEntryData(params.slug)
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
  }
}

export function createThinkingSinglePageLoader() {
  return async function ThinkingSinglePageLoader() {
  }
}

export function createContactPageLoader() {
  return async function ContactPageLoader() {
  }
}

export function createEst2014PageLoader() {
  return async function Est2014PageLoader() {
  }
}