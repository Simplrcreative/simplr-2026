// useRoutePrefetch.js
// Prefetches route data on hover/focus for all main routes
import { useCallback } from 'react'
import {
  fetchHomeData,
  fetchPeopleData,
  fetchServicesData,
  prefetchWorkRoute,
} from '../lib/wp-api.js'

// Map route paths to their prefetch functions
const prefetchMap = {
  '/': fetchHomeData,
  '/work/': prefetchWorkRoute,
  '/about/': fetchPeopleData,
  '/services/': fetchServicesData,
  '/thinking/': () => {},
  '/contact/': () => {},
  '/est-2014/': () => {},
}

export function prefetchRoute(path) {
  const prefetch = prefetchMap[path]
  if (prefetch) prefetch()
}

export function useRoutePrefetch(path) {
  return useCallback(() => {
    prefetchRoute(path)
  }, [path])
}
