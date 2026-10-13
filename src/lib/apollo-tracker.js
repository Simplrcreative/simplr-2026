// Public, account-level tracker ID from Apollo → Settings → Website Visitors.
const APOLLO_APP_ID = '69de49480a8486001904962b'
const TRACKER_SRC = 'https://assets.apollo.io/micro/website-tracker/tracker.iife.js'

/**
 * Load Apollo's website tracker once. Safe to call repeatedly.
 * Skips prerender so the tag never gets captured into the static HTML.
 */
export function loadApolloTracker() {
  if (typeof window === 'undefined') return false
  if (window.__PRERENDER__) return false
  if (window.__simplrApolloLoaded) return true
  if (document.querySelector('script[data-simplr-apollo="true"]')) return true

  window.__simplrApolloLoaded = true

  const script = document.createElement('script')
  // Apollo's snippet busts cache per load so fixes ship without a stale copy.
  script.src = `${TRACKER_SRC}?nocache=${Math.random().toString(36).substring(7)}`
  script.async = true
  script.defer = true
  script.dataset.simplrApollo = 'true'

  script.onload = () => {
    window.trackingFunctions?.onLoad?.({ appId: APOLLO_APP_ID })
  }

  script.onerror = () => {
    // Blocked or offline — drop the tag so a later consent event can retry.
    window.__simplrApolloLoaded = false
    script.remove()
  }

  document.head.appendChild(script)
  return true
}
