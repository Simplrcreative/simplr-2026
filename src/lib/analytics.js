const MEASUREMENT_ID = String(import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim()

export function isAnalyticsConfigured() {
  return /^G-[A-Z0-9]+$/i.test(MEASUREMENT_ID)
}

export function getGaMeasurementId() {
  return isAnalyticsConfigured() ? MEASUREMENT_ID : ''
}

/**
 * Load gtag.js once. Safe to call repeatedly.
 * Skips prerender and when no Measurement ID is configured.
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

  // Already bootstrapped — still ensure the script tag exists.
  if (!window.__simplrGaLoaded) {
    window.__simplrGaLoaded = true
    window.dataLayer = window.dataLayer || []
    // Google’s snippet requires `arguments`, not a rest-parameter Array.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments)
    }

    window.gtag('js', new Date())
    // SPA: first + subsequent page views are sent via trackPageView().
    window.gtag('config', MEASUREMENT_ID, {
      send_page_view: false,
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

export function trackPageView(path) {
  if (typeof window === 'undefined' || !window.gtag || !isAnalyticsConfigured()) return

  const pagePath = path || `${window.location.pathname}${window.location.search}`

  // GA4 SPA pattern: re-config with the new path (fires a page_view).
  window.gtag('config', MEASUREMENT_ID, {
    page_path: pagePath,
    page_title: document.title,
    page_location: window.location.href,
  })

  if (import.meta.env.DEV) {
    console.info('[GA] page_view', pagePath)
  }
}
