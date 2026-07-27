import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getCookieConsent,
  setCookieConsent,
} from '../lib/cookie-consent.js'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (getCookieConsent() === null) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const choose = (choice) => {
    setCookieConsent(choice)
    setVisible(false)
  }

  return (
    <div className="cookie-consent" role="dialog" aria-label="Cookie consent">
      <p className="cookie-consent__text">
        Select &lsquo;Accept All&rsquo; to agree to our use of cookies and similar
        technologies to enhance your browsing experience, security, analytics and
        customisation. Review our{' '}
        <Link to="/privacy-policy/" className="cookie-consent__link">
          Cookie Policy
        </Link>{' '}
        here.
      </p>
      <div className="cookie-consent__actions">
        <button
          type="button"
          className="cookie-consent__accept"
          onClick={() => choose('accepted')}
        >
          Accept All
        </button>
        <button
          type="button"
          className="cookie-consent__reject"
          onClick={() => choose('rejected')}
        >
          No Thanks
        </button>
      </div>
    </div>
  )
}
