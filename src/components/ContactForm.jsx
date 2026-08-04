import { useEffect, useId, useRef, useState } from 'react'
import emailjs from '@emailjs/browser'
import { createBtnHoverAnimation } from '../lib/animations/index.js'

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

const MIN_SUBMIT_MS = 2500
// Obscure name on purpose — "company" / "website" honeypots get autofilled and
// then silently fake-succeed without hitting EmailJS.
const HONEYPOT_NAME = 'ne_hp_field'

const ENQUIRY_TYPES = [
  { name: 'Strategy', value: 'strategy', bg: 'bg-strategy', text: 'text-coffee' },
  { name: 'Branding & Design', value: 'branding-design', bg: 'bg-branding-design', text: 'text-white' },
  { name: 'Web Design & Development', value: 'web-design-development', bg: 'bg-web-design-development', text: 'text-coffee' },
  { name: 'Motion', value: 'motion', bg: 'bg-motion', text: 'text-white' },
  { name: 'Templates', value: 'templates', bg: 'bg-templates', text: 'text-white' },
  { name: 'Creative AI', value: 'creative-ai', bg: 'bg-creative-ai', text: 'text-coffee' },
  { name: 'All Services', value: 'all-services', bg: 'bg-white', text: 'text-black/90' },
]

const FIELDS = [
  { label: 'Full Name*', name: 'name', type: 'text' },
  { label: 'Company Name*', name: 'company', type: 'text' },
  { label: 'Email Address*', name: 'email', type: 'email' },
  { label: 'Budget expectation', name: 'budget', type: 'text' },
]

const INITIAL_FORM = { name: '', company: '', email: '', budget: '', message: '', [HONEYPOT_NAME]: '' }

function validate(fields) {
  const errors = {}
  if (!fields.name.trim()) errors.name = 'Full name is required'
  if (!fields.company.trim()) errors.company = 'Company name is required'
  if (!fields.email.trim()) {
    errors.email = 'Email address is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = 'Please enter a valid email address'
  }
  return errors
}

function loadRecaptchaScript() {
  if (typeof window === 'undefined' || !RECAPTCHA_SITE_KEY) return Promise.resolve()
  if (window.grecaptcha?.render) return Promise.resolve()

  const existing = document.querySelector('script[data-simplr-recaptcha="true"]')
  if (existing) {
    return new Promise((resolve) => {
      if (window.grecaptcha?.render) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.dataset.simplrRecaptcha = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA'))
    document.head.appendChild(script)
  })
}

export default function ContactForm({
  variant = 'light',
  // Back-compat: LandingPage historically passed `style="dark"`.
  style: legacyStyle,
  heading = '',
  buttonClassName = 'btn relative disabled:opacity-50 disabled:cursor-not-allowed',
}) {
  const tone = legacyStyle || variant
  let textColor = 'text-white'
  let inputColor = 'border-white/40'
  let checkColor = 'bg-white/20 peer-checked:bg-white peer-checked:border-white'
  if (tone === 'dark') {
    textColor = 'text-coffee'
    inputColor = 'border-coffee/40'
    checkColor = 'bg-coffee/20 peer-checked:bg-coffee peer-checked:border-coffee'
  }

  const btnRef = useRef(null)
  const mountedAtRef = useRef(Date.now())
  const recaptchaContainerRef = useRef(null)
  const recaptchaWidgetIdRef = useRef(null)
  const honeypotId = useId()
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [enquiry, setEnquiry] = useState([])
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // 'idle' | 'submitting' | 'success' | 'error'
  const [recaptchaReady, setRecaptchaReady] = useState(!RECAPTCHA_SITE_KEY)
  const showForm = status !== 'success'

  useEffect(() => {
    if (btnRef.current) return createBtnHoverAnimation(btnRef.current)
  }, [status])

  useEffect(() => {
    mountedAtRef.current = Date.now()
  }, [])

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || !showForm) return undefined

    let cancelled = false

    const clearWidget = () => {
      if (recaptchaContainerRef.current) {
        recaptchaContainerRef.current.innerHTML = ''
      }
      recaptchaWidgetIdRef.current = null
    }

    loadRecaptchaScript()
      .then(() => {
        if (cancelled || !recaptchaContainerRef.current || !window.grecaptcha) return

        const renderWidget = () => {
          if (cancelled || recaptchaWidgetIdRef.current !== null) return
          if (!recaptchaContainerRef.current) return

          // Fresh node each render — grecaptcha throws if the element was used before.
          clearWidget()

          try {
            recaptchaWidgetIdRef.current = window.grecaptcha.render(recaptchaContainerRef.current, {
              sitekey: RECAPTCHA_SITE_KEY,
              theme: tone === 'dark' ? 'light' : 'dark',
            })
            setRecaptchaReady(true)
          } catch (err) {
            console.error(err)
            clearWidget()
            if (!cancelled) setRecaptchaReady(false)
          }
        }

        if (window.grecaptcha.render) {
          renderWidget()
          return
        }

        window.grecaptcha.ready(renderWidget)
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setRecaptchaReady(false)
      })

    return () => {
      cancelled = true
      clearWidget()
    }
  }, [tone, showForm])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleEnquiryChange = (value) => {
    if (value === 'all-services') {
      setEnquiry((prev) => (prev.includes('all-services') ? [] : ['all-services']))
    } else {
      setEnquiry((prev) => {
        const filtered = prev.filter((v) => v !== 'all-services' && v !== value)
        return prev.includes(value) ? filtered : [...filtered, value]
      })
    }
  }

  const resetRecaptcha = () => {
    if (recaptchaWidgetIdRef.current !== null && window.grecaptcha?.reset) {
      window.grecaptcha.reset(recaptchaWidgetIdRef.current)
    }
  }

  const fakeSuccess = () => {
    setStatus('success')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // Honeypot / timing traps: look successful to bots, never hit EmailJS.
    const filledTooFast = Date.now() - mountedAtRef.current < MIN_SUBMIT_MS
    const honeypotFilled = Boolean(formData[HONEYPOT_NAME]?.trim())
    if (honeypotFilled || filledTooFast) {
      if (import.meta.env.DEV) {
        console.warn('[ContactForm] Bot trap triggered — skipping EmailJS', {
          honeypotFilled,
          filledTooFast,
        })
      }
      fakeSuccess()
      return
    }

    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.error('[ContactForm] Missing EmailJS env vars')
      setStatus('error')
      return
    }

    let recaptchaToken = ''
    if (RECAPTCHA_SITE_KEY) {
      recaptchaToken = window.grecaptcha?.getResponse?.(recaptchaWidgetIdRef.current) || ''
      if (!recaptchaToken) {
        setErrors((prev) => ({ ...prev, recaptcha: 'Please confirm you are not a robot.' }))
        return
      }
    }

    setStatus('submitting')
    setErrors((prev) => ({ ...prev, recaptcha: undefined }))

    try {
      const payload = {
        from_name: formData.name,
        company: formData.company,
        reply_to: formData.email,
        budget: formData.budget || 'Not specified',
        enquiry_types: enquiry.length ? enquiry.join(', ') : 'Not specified',
        message: formData.message || 'No message provided',
      }

      if (recaptchaToken) {
        payload['g-recaptcha-response'] = recaptchaToken
      }

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        payload,
        { publicKey: EMAILJS_PUBLIC_KEY },
      )
      setStatus('success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('EmailJS error:', err)
      setStatus('error')
      resetRecaptcha()
    }
  }

  return (
    <div className={`contact-form ${tone}`}>
      {status === 'success' ? (
        <div className={`flex flex-col gap-6 py-10 ${textColor}`}>
          <p className="text-[22px] leading-6 font-medium">Thank you — we&apos;ll be in touch shortly.</p>
          <p className="opacity-60 max-w-[48ch]">Your enquiry has been received. Someone from the Simplr team will reach out to you shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className={`relative flex flex-col gap-9 ${textColor}`} autoComplete="on">
          {heading ? (
            <p className="text-[22px] leading-6 md:text-[22px]">
              {typeof heading === 'string' ? (
                <strong className="font-medium">{heading}</strong>
              ) : (
                heading
              )}
            </p>
          ) : null}

          {/* Honeypot — hidden from people; obscure name avoids browser autofill */}
          <div
            aria-hidden="true"
            className="absolute -left-[10000px] top-auto h-0 w-0 overflow-hidden opacity-0"
          >
            <label htmlFor={honeypotId}>Leave blank</label>
            <input
              id={honeypotId}
              type="text"
              name={HONEYPOT_NAME}
              value={formData[HONEYPOT_NAME]}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <div className="flex flex-col gap-7">
            {FIELDS.map(({ label, name, type }) => (
              <div key={name}>
                <div className="relative pt-5 my-2 input-wrapper">
                  <label htmlFor={name} className="input-label text-base">{label}</label>
                  <input
                    type={type}
                    id={name}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    placeholder=" "
                    className={`bg-transparent border-b outline-none pb-2 w-full ${inputColor} ${textColor}`}
                  />
                </div>
                {errors[name] && (
                  <p className="text-sm text-red-400 mt-1">{errors[name]}</p>
                )}
              </div>
            ))}

            <div className="flex flex-col md:flex-row gap-[50px] items-start">
              <span className="text-base shrink-0">Type of enquiry</span>
              <div className="flex flex-col gap-[5px]">
                {ENQUIRY_TYPES.map(({ name, value, bg, text }) => (
                  <label key={value} className="flex items-center cursor-pointer gap-1">
                    <input
                      type="checkbox"
                      name="enquiry"
                      value={value}
                      checked={enquiry.includes(value)}
                      onChange={() => handleEnquiryChange(value)}
                      className="sr-only peer"
                    />
                    <span className={`w-[26.5px] h-[26.5px] rounded-full border border-none shrink-0 transition-colors ${checkColor}`} />
                    <span className={`category ${bg} ${text} rounded-full leading-none font-medium`}>{name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="relative pt-5 input-wrapper">
              <label htmlFor="message" className="input-label text-base">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder=" "
                className={`bg-transparent border-b outline-none resize-none h-[100px] w-full ${inputColor} ${textColor}`}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between">

          {RECAPTCHA_SITE_KEY ? (
            <div className="flex flex-col gap-2 mb-5 md:mb-0">
              <div ref={recaptchaContainerRef} />
              {!recaptchaReady && (
                <p className={`text-sm opacity-60 ${textColor}`}>Loading verification…</p>
              )}
              {errors.recaptcha && (
                <p className="text-sm text-red-400">{errors.recaptcha}</p>
              )}
            </div>
          ) : null}

          {status === 'error' && (
            <p className="text-sm text-red-400">Something went wrong — please try again or email us directly at <a href="mailto:hello@simplr.co.za" className="underline">hello@simplr.co.za</a>.</p>
          )}

          
            <button
              ref={btnRef}
              type="submit"
              disabled={status === 'submitting' || (Boolean(RECAPTCHA_SITE_KEY) && !recaptchaReady)}
              className={buttonClassName}
            >
              <span>{status === 'submitting' ? 'Sending…' : 'Send enquiry'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
