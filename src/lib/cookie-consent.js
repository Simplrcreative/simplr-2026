const STORAGE_KEY = 'simplr-cookie-consent'
export const COOKIE_CONSENT_EVENT = 'simplr:cookie-consent'

/** @typedef {'accepted' | 'rejected'} CookieConsentChoice */

export function getCookieConsent() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    if (value === 'accepted' || value === 'rejected') return value
  } catch {
    // Ignore private-mode / blocked storage.
  }
  return null
}

/** @param {CookieConsentChoice} choice */
export function setCookieConsent(choice) {
  try {
    window.localStorage.setItem(STORAGE_KEY, choice)
  } catch {
    // Ignore private-mode / blocked storage.
  }

  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_EVENT, { detail: { choice } }),
  )
}

export function hasAnsweredCookieConsent() {
  return getCookieConsent() !== null
}
