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
  if (typeof window === 'undefined') return
  if (window.__PRERENDER__) return
  if (!isAnalyticsConfigured()) return
  if (window.__simplrGaLoaded) return

  window.__simplrGaLoaded = true
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args) {
    window.dataLayer.push(args)
  }

  window.gtag('js', new Date())
  // SPA: we send page_view manually on route changes.
  window.gtag('config', MEASUREMENT_ID, {
    anonymize_ip: true,
    send_page_view: false,
  })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  script.dataset.simplrGa = 'true'
  document.head.appendChild(script)
}

export function trackPageView(path) {
  if (typeof window === 'undefined' || !window.gtag || !isAnalyticsConfigured()) return

  const pagePath = path || `${window.location.pathname}${window.location.search}`

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: document.title,
    page_location: window.location.href,
  })
}
