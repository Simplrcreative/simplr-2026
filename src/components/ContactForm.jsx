import { useEffect, useRef, useState } from 'react'
import emailjs from '@emailjs/browser'
import { createBtnHoverAnimation } from '../lib/animations/index.js'

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

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

const INITIAL_FORM = { name: '', company: '', email: '', budget: '', message: '' }

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

export default function ContactForm({ style='light', heading='' }) {
  let textColor = 'text-white'
  let inputColor = 'border-white/40'
  let checkColor = 'bg-white/20 peer-checked:bg-white peer-checked:border-white'
  if(style === 'dark') {
    textColor = 'text-coffee'
    inputColor = 'border-coffee/40'
    checkColor = 'bg-coffee/20 peer-checked:bg-coffee peer-checked:border-coffee'
  }
  const btnRef = useRef(null)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [enquiry, setEnquiry] = useState([])
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // 'idle' | 'submitting' | 'success' | 'error'

  useEffect(() => {
    if (btnRef.current) return createBtnHoverAnimation(btnRef.current)
  }, [])
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  const handleEnquiryChange = (value) => {
    if (value === 'all-services') {
      setEnquiry(prev => prev.includes('all-services') ? [] : ['all-services'])
    } else {
      setEnquiry(prev => {
        const filtered = prev.filter(v => v !== 'all-services' && v !== value)
        return prev.includes(value) ? filtered : [...filtered, value]
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setStatus('submitting')
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: formData.name,
          company: formData.company,
          reply_to: formData.email,
          budget: formData.budget || 'Not specified',
          enquiry_types: enquiry.length ? enquiry.join(', ') : 'Not specified',
          message: formData.message || 'No message provided',
        },
        { publicKey: EMAILJS_PUBLIC_KEY },
      )
      setStatus('success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('EmailJS error:', err)
      setStatus('error')
    }
  }

  return (
    <div className={`contact-form ${style}`}>
      {status === 'success' ? (
        <div className={`flex flex-col gap-6 py-10 ${textColor}`}>
          <p className="text-[22px] leading-6 font-medium">Thank you — we&apos;ll be in touch shortly.</p>
          <p className="opacity-60 max-w-[48ch]">Your enquiry has been received. Someone from the Simplr team will reach out to you shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className={`flex flex-col gap-9 ${textColor}`}>
          {heading &&(
            <p className="text-[22px] leading-6">
              <strong className="font-medium">{heading}</strong>
            </p>
          )}

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
                    className={`bg-transparent border-b  outline-none pb-2 w-full ${inputColor} ${textColor}`}
                  />
                </div>
                {errors[name] && (
                  <p className="text-sm text-red-400 mt-1">{errors[name]}</p>
                )}
              </div>
            ))}

            <div className="flex gap-[50px] items-start">
              <span className="text-base shrink-0">Type of enquiry</span>
              <div className="flex flex-col gap-[5px]">
                {ENQUIRY_TYPES.map(({ name, value, bg, text }) => (
                  <label key={value} className="flex items-center cursor-pointer">
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
                className={`bg-transparent border-b outline-none text-coffee resize-none h-[100px] w-full ${inputColor}`}
              />
            </div>
          </div>

          {status === 'error' && (
            <p className="text-sm text-red-400">Something went wrong — please try again or email us directly at <a href="mailto:hello@simplr.co.za" className="underline">hello@simplr.co.za</a>.</p>
          )}

          <div className="flex justify-end">
            <button
              ref={btnRef}
              type="submit"
              disabled={status === 'submitting'}
              className="btn relative disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{status === 'submitting' ? 'Sending…' : 'Send enquiry'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}