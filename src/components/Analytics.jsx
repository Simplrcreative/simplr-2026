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
    if (!isAnalyticsConfigured()) return undefined

    if (getCookieConsent() === 'accepted') {
      setEnabled(true)
      loadGoogleAnalytics()
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
    loadGoogleAnalytics()
    trackPageView(`${location.pathname}${location.search}`)
  }, [enabled, location.pathname, location.search])

  return null
}
