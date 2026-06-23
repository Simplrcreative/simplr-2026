// useRoutePrefetch.js
// Prefetches route data on hover/focus for all main routes
import { useCallback } from 'react'
import { fetchHomeData, fetchPeopleData, fetchServicesData, fetchWorksData } from '../lib/wp-api.js'

// Map route paths to their prefetch functions
const prefetchMap = {
  '/': fetchHomeData,
  '/work/': fetchWorksData,
  '/about/': fetchPeopleData,
  '/services/': fetchServicesData,
  '/thinking/': () => {},
  '/contact/': () => {},
  '/est-2014/': () => {},
}

export function useRoutePrefetch(path) {
  return useCallback(() => {
    const prefetch = prefetchMap[path]
    if (prefetch) prefetch()
  }, [path])
}
