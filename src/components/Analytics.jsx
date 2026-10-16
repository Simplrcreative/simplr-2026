import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  COOKIE_CONSENT_EVENT,
  getCookieConsent,
} from '../lib/cookie-consent.js'
import {
  denyAnalyticsConsent,
  grantAnalyticsConsent,
  isAnalyticsConfigured,
  loadGoogleAnalytics,
  trackPageView,
} from '../lib/analytics.js'
import { getPageType, trackContactClick } from '../lib/analytics-events.js'
import { loadApolloTracker } from '../lib/apollo-tracker.js'

/** Our own inboxes, mapped to a reporting label — the address is never sent. */
function getLeadTypeFromMailto(href) {
  const mailbox = href.replace(/^mailto:/i, '').split('@')[0].toLowerCase()
  if (mailbox === 'newbiz') return 'new_business'
  if (mailbox === 'careers') return 'careers'
  return 'general'
}

/** Coarse placement label from the nearest known ancestor. */
function getCtaLocation(anchor) {
  if (anchor.closest('.contact-form')) return 'contact_form'
  if (anchor.closest('.contact-info')) return 'contact_details'
  if (anchor.closest('footer')) return 'footer'
  if (anchor.closest('header')) return 'header'
  return 'body'
}

/**
 * Loads GA4 on every page with Consent Mode v2 defaults denied, promotes
 * consent when the banner is accepted, tracks SPA navigations, and reports
 * email/telephone clicks. The Apollo tracker stays fully consent-gated because
 * it has no cookieless mode.
 */
export default function Analytics() {
  const location = useLocation()

  useEffect(() => {
    if (import.meta.env.DEV && !isAnalyticsConfigured()) {
      console.info('[GA] Not configured — check VITE_GA_MEASUREMENT_ID and restart Vite.')
    }

    // Always load the tag — Consent Mode keeps it cookieless until accepted.
    loadGoogleAnalytics()

    const consent = getCookieConsent()
    if (consent === 'accepted') {
      grantAnalyticsConsent()
      loadApolloTracker()
    } else if (consent === 'rejected') {
      denyAnalyticsConsent()
    }

    const onConsent = (event) => {
      if (event.detail?.choice === 'accepted') {
        grantAnalyticsConsent()
        loadApolloTracker()
        return
      }
      denyAnalyticsConsent()
    }

    window.addEventListener(COOKIE_CONSENT_EVENT, onConsent)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent)
  }, [])

  // Delegated so WordPress rich-text links are covered without extra wiring.
  useEffect(() => {
    const onClick = (event) => {
      const anchor = event.target.closest?.('a[href^="mailto:"], a[href^="tel:"]')
      if (!anchor) return

      const href = anchor.getAttribute('href') || ''
      const isPhone = href.toLowerCase().startsWith('tel:')

      trackContactClick({
        contactMethod: isPhone ? 'phone' : 'email',
        pageType: getPageType(),
        ctaLocation: getCtaLocation(anchor),
        leadType: isPhone ? 'general' : getLeadTypeFromMailto(href),
      })
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    if (!isAnalyticsConfigured()) return
    if (!loadGoogleAnalytics()) return
    trackPageView(`${location.pathname}${location.search}`)
  }, [location.pathname, location.search])

  return null
}
