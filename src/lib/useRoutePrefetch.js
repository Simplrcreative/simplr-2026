// useRoutePrefetch.js
// Prefetches route data on hover/focus for all main routes
import { useCallback } from 'react'
import { fetchHomeData, fetchNavigationData, fetchPeopleData, fetchServicesSinglePageData, fetchServicesData, fetchTestimonialData, fetchWorksData, fetchWorkEntryData } from '../lib/wp-api.js'

// Map route paths to their prefetch functions
const prefetchMap = {
  '/': fetchHomeData,
  '/work': fetchWorksData,
  '/about': fetchPeopleData,
  '/services': fetchServicesData,
  // For dynamic routes, you can extend this to accept params
  // '/services/:slug': (slug) => fetchServicesSinglePageData(slug),
  '/thinking': () => {}, // Add as needed
  '/contact': () => {}, // Add as needed
  '/est-2014': () => {}, // Add as needed
}

export function useRoutePrefetch(path) {
  return useCallback(() => {
    const prefetch = prefetchMap[path]
    if (prefetch) prefetch()
  }, [path])
}
