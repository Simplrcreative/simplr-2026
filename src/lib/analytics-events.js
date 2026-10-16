import { trackEvent } from './analytics.js'

/**
 * GA4 lead + engagement event model.
 *
 * PII rule: only enumerated, non-identifying values are ever passed through
 * here — never field values, names, email addresses or phone numbers. The
 * `contact_*` helpers deliberately take a channel label, not the address.
 */

const KNOWN_PAGE_TYPES = {
  '': 'home',
  work: 'work',
  about: 'about',
  services: 'services',
  thinking: 'thinking',
  contact: 'contact',
  'est-2014': 'est_2014',
  'privacy-policy': 'privacy_policy',
  'site-map': 'site_map',
}

const SINGLETON_PAGES = new Set(['home', 'about', 'contact', 'est_2014', 'privacy_policy', 'site_map'])

const VIDEO_PROGRESS_MARKS = [25, 50, 75]

/**
 * Coarse page grouping for reporting — `work_single` vs `work_index` etc.
 * Falls back to `landing` for the catch-all `/:slug/` route.
 */
export function getPageType(pathname = window.location.pathname) {
  const segments = pathname.split('/').filter(Boolean)
  const [first, ...rest] = segments

  if (!first) return 'home'

  const base = KNOWN_PAGE_TYPES[first]
  if (!base) return 'landing'
  if (!rest.length) return SINGLETON_PAGES.has(base) ? base : `${base}_index`

  // /thinking/:topic/:slug is a post; /thinking/:filterSlug is still an index.
  if (first === 'thinking' && rest.length === 1) return 'thinking_index'

  return `${base}_single`
}

/** Fired once per form, when the visitor first engages with any field. */
export function trackFormStart({ formName, pageType, ctaLocation, leadType }) {
  trackEvent('form_start', {
    form_name: formName,
    page_type: pageType,
    cta_location: ctaLocation,
    lead_type: leadType,
  })
}

/**
 * Fired when something prevents submission.
 * `errorType` is an enumerated reason, never the invalid value itself.
 */
export function trackFormError({ formName, pageType, ctaLocation, leadType, errorType }) {
  trackEvent('form_error', {
    form_name: formName,
    page_type: pageType,
    cta_location: ctaLocation,
    lead_type: leadType,
    error_type: errorType,
  })
}

/** Primary key event — only after the enquiry is genuinely delivered. */
export function trackGenerateLead({ formName, pageType, ctaLocation, leadType, service }) {
  trackEvent('generate_lead', {
    form_name: formName,
    page_type: pageType,
    cta_location: ctaLocation,
    lead_type: leadType,
    service,
  })
}

/** Email or telephone click. `contactMethod` is 'email' | 'phone'. */
export function trackContactClick({ contactMethod, pageType, ctaLocation, leadType }) {
  trackEvent('contact_click', {
    contact_method: contactMethod,
    page_type: pageType,
    cta_location: ctaLocation,
    lead_type: leadType,
  })
}

/**
 * One session per hero-modal open. Tracks open / start / 25-50-75 / complete
 * / close. Duration is sent as whole seconds on close — never a media URL.
 */
export function createVideoSession({ title, location }) {
  const seen = new Set()
  let opened = false
  let started = false
  const base = {
    video_title: title,
    video_location: location,
    video_provider: 'self_hosted',
  }

  const percentOf = (currentTime, duration) => {
    if (!duration || duration <= 0) return 0
    return Math.min(100, Math.max(0, Math.round((currentTime / duration) * 100)))
  }

  return {
    open() {
      if (opened) return
      opened = true
      trackEvent('video_open', base)
    },
    start() {
      if (started) return
      started = true
      trackEvent('video_start', base)
    },
    progress(currentTime, duration) {
      const percent = percentOf(currentTime, duration)
      VIDEO_PROGRESS_MARKS.forEach((mark) => {
        if (percent >= mark && !seen.has(mark)) {
          seen.add(mark)
          trackEvent('video_progress', { ...base, video_percent: mark })
        }
      })
    },
    complete() {
      if (seen.has(100)) return
      seen.add(100)
      trackEvent('video_complete', { ...base, video_percent: 100 })
    },
    close(currentTime, duration) {
      trackEvent('video_close', {
        ...base,
        video_seconds: Math.max(0, Math.round(currentTime || 0)),
        video_percent: percentOf(currentTime, duration),
      })
    },
  }
}
