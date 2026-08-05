import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  COOKIE_CONSENT_EVENT,
  getCookieConsent,
} from '../lib/cookie-consent.js'
import {
  isAnalyticsConfigured,
  loadGoogleAnalytics,
  trackPageView,
} from '../lib/analytics.js'

/**
 * Loads GA4 only after cookie consent is accepted, then tracks SPA navigations.
 */
export default function Analytics() {
  const location = useLocation()
  const [enabled, setEnabled] = useState(() => getCookieConsent() === 'accepted')

  useEffect(() => {
    if (!isAnalyticsConfigured()) {
      if (import.meta.env.DEV) {
        console.info('[GA] Not configured — check VITE_GA_MEASUREMENT_ID and restart Vite.')
      }
      return undefined
    }

    const consent = getCookieConsent()
    if (consent === 'accepted') {
      setEnabled(true)
      loadGoogleAnalytics()
    } else if (import.meta.env.DEV) {
      console.info(
        '[GA] Waiting for cookie consent (Accept All). Current:',
        consent ?? 'not answered',
      )
    }

    const onConsent = (event) => {
      if (event.detail?.choice === 'accepted') {
        setEnabled(true)
        loadGoogleAnalytics()
        return
      }
      setEnabled(false)
    }

    window.addEventListener(COOKIE_CONSENT_EVENT, onConsent)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent)
  }, [])

  useEffect(() => {
    if (!enabled || !isAnalyticsConfigured()) return
    if (!loadGoogleAnalytics()) return
    trackPageView(`${location.pathname}${location.search}`)
  }, [enabled, location.pathname, location.search])

  return null
}
