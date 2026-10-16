const MEASUREMENT_ID = String(import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim()

const DEBUG_QUERY_PARAM = 'debug_mode'
const DEBUG_STORAGE_KEY = 'simplr-ga-debug'

export function isAnalyticsConfigured() {
  return /^G-[A-Z0-9]+$/i.test(MEASUREMENT_ID)
}

export function getGaMeasurementId() {
  return isAnalyticsConfigured() ? MEASUREMENT_ID : ''
}

/**
 * DebugView opt-in. `?debug_mode=1` latches into localStorage so the flag
 * survives SPA navigation, `?debug_mode=0` clears it.
 */
function isDebugMode() {
  if (typeof window === 'undefined') return false

  try {
    const param = new URLSearchParams(window.location.search).get(DEBUG_QUERY_PARAM)
    if (param === '1' || param === 'true') {
      window.localStorage.setItem(DEBUG_STORAGE_KEY, '1')
      return true
    }
    if (param === '0' || param === 'false') {
      window.localStorage.removeItem(DEBUG_STORAGE_KEY)
      return false
    }
    return window.localStorage.getItem(DEBUG_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function pushToDataLayer() {
  // Google’s snippet requires `arguments`, not a rest-parameter Array.
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments)
}

/**
 * Load gtag.js once. Safe to call repeatedly.
 *
 * Runs on every page load regardless of cookie consent — Consent Mode v2
 * defaults everything to `denied`, so no cookies are written and no
 * identifiable data is sent until grantAnalyticsConsent() runs. Gating the
 * script itself made the tag invisible to Google's tag checks, which is what
 * produced the "data collection isn't active" warning.
 */
export function loadGoogleAnalytics() {
  if (typeof window === 'undefined') return false
  if (window.__PRERENDER__) return false
  if (!isAnalyticsConfigured()) {
    if (import.meta.env.DEV) {
      console.info('[GA] Skipped — set VITE_GA_MEASUREMENT_ID (and restart Vite).')
    }
    return false
  }

  if (!window.__simplrGaLoaded) {
    window.__simplrGaLoaded = true
    window.dataLayer = window.dataLayer || []
    if (typeof window.gtag !== 'function') {
      window.gtag = pushToDataLayer
    }

    // Consent defaults must be queued before `config` so the first hit is
    // already consent-aware. index.html also sends this; repeating it is safe.
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted',
      wait_for_update: 500,
    })

    try {
      if (window.localStorage.getItem('simplr-cookie-consent') === 'accepted') {
        window.gtag('consent', 'update', {
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
          analytics_storage: 'granted',
          functionality_storage: 'granted',
          personalization_storage: 'granted',
        })
      }
    } catch {
      // private-mode / blocked storage — stay on the denied default
    }

    window.gtag('js', new Date())
    window.gtag('config', MEASUREMENT_ID, {
      // SPA: every page view is sent explicitly via trackPageView().
      send_page_view: false,
      ...(isDebugMode() ? { debug_mode: true } : {}),
    })
  }

  if (!document.querySelector('script[data-simplr-ga="true"]')) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
    script.dataset.simplrGa = 'true'
    document.head.appendChild(script)
  }

  return true
}

/** Promote storage to granted once the visitor accepts cookies. */
export function grantAnalyticsConsent() {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('consent', 'update', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
    functionality_storage: 'granted',
    personalization_storage: 'granted',
  })
}

/** Explicit decline — keeps cookieless pings only. */
export function denyAnalyticsConsent() {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
  })
}

let lastPageView = { key: '', at: 0 }

export function trackPageView(path) {
  if (typeof window === 'undefined' || !window.gtag || !isAnalyticsConfigured()) return

  const pagePath = path || `${window.location.pathname}${window.location.search}`
  const key = `${pagePath}|${window.location.href}`
  const now = Date.now()
  // React Strict Mode remounts effects in dev; collapse the duplicate hit.
  if (lastPageView.key === key && now - lastPageView.at < 1000) return
  lastPageView = { key, at: now }

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: document.title,
    page_location: window.location.href,
  })

  if (import.meta.env.DEV) {
    console.info('[GA] page_view', pagePath)
  }
}

/**
 * Send a GA4 event. Drops empty params so GA4 doesn't record blank dimensions.
 * Never pass form field values, names, email addresses or phone numbers.
 */
export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined' || !window.gtag || !isAnalyticsConfigured()) return

  const payload = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )

  window.gtag('event', name, payload)

  if (import.meta.env.DEV) {
    console.info('[GA] event', name, payload)
  }
}
