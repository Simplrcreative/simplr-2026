import { fetchCollectionData, fetchEntryData, fetchHomeData, fetchNavigationData, fetchPageData, fetchPeopleData } from '../lib/wp-api.js'

export function createRootLoader() {
  return async function rootLoader() {
    return {
      navigation: await fetchNavigationData(),
    }
  }
}

export function createHomeLoader() {
  return async function homeLoader() {
    return fetchHomeData()
  }
}

export function createAboutLoader() {
  return async function aboutLoader() {
    return fetchPeopleData()
  }
}

export function createStaticPageLoader(pageKey) {
  return async function staticPageLoader() {
    return fetchPageData(pageKey)
  }
}

export function createCollectionLoader(collectionKey) {
  return async function collectionLoader() {
    return fetchCollectionData(collectionKey)
  }
}

export function createEntryLoader(collectionKey) {
  return async function entryLoader({ params }) {
    return fetchEntryData(collectionKey, params.slug)
  }
}