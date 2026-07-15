import { useEffect, useRef, useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Seo from '../components/Seo.jsx'
import { buildContactPageSeo } from '../lib/page-seo.js'
import { createSplitTextAnimation, createBtnHoverAnimation } from '../lib/animations/index.js'

gsap.registerPlugin(ScrollTrigger)

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

export default function ContactPage() {
  const btnRef = useRef(null)
  const { page } = useLoaderData() ?? {}
  const seo = buildContactPageSeo(page)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [enquiry, setEnquiry] = useState([])
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // 'idle' | 'submitting' | 'success' | 'error'

  useEffect(() => createSplitTextAnimation(), [])
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
    <>
      <Seo {...seo} />

      <section className="page-hero px-5 py-5 md:py-20 bg-coffee section-dark min-h-[80vh] flex md:items-end">
        <div className="grid grid-cols-12 w-full grid-rows-[30px_auto]">
          <div className="col-span-12 change-logo-back" aria-hidden="true" />
          <div className="col-span-12 lg:col-span-6 xl:col-span-7 mt-50 md:mt-20 text-white change-logo">
            <h1 className="hero-title large mb-10 md:mb-20">Let's make it simplr.<br/><span>Come say <i>hello.</i></span></h1>
            <div className="xl:flex gap-20">
              <div className="eyebrow">Our Office</div>
              <div className="md:text-[22px]">
              <p className="font-bold">Cape Town</p>
              <p>
                Unit AS02, The Forum<br/>
                Lifestyle House, Northbank Lane<br/>
                Century City, Cape Town
              </p>
            </div>
            </div>
          </div>
          <div className="contact-form col-start-1 col-span-12 lg:col-start-7 lg:col-span-6 xl:col-start-8 xl:col-span-5 pt-10 md:pt-20">
            {status === 'success' ? (
              <div className="flex flex-col gap-6 text-white py-10">
                <p className="md:text-[22px] font-medium">Thank you — we&apos;ll be in touch shortly.</p>
                <p className="opacity-60 max-w-[48ch]">Your enquiry has been received. Someone from the Simplr team will reach out to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-9 text-white">
                <p className="md:text-[22px]">
                  <strong className="font-medium">Tell us about your project.&nbsp;&nbsp;</strong>
                  <span className="font-normal">We&apos;ll take it from there.</span>
                </p>

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
                          className="bg-transparent border-b border-white/40 outline-none text-white pb-2 w-full"
                        />
                      </div>
                      {errors[name] && (
                        <p className="text-sm text-red-400 mt-1">{errors[name]}</p>
                      )}
                    </div>
                  ))}

                  <div className="flex gap-[50px] items-start flex-col md:flex-row">
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
                          <span className="w-[26.5px] h-[26.5px] rounded-full border border-none bg-white/20 shrink-0 transition-colors peer-checked:bg-white peer-checked:border-white" />
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
                      className="bg-transparent border-b border-white/40 outline-none text-white resize-none h-[100px] w-full"
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
                    className="btn alt relative disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{status === 'submitting' ? 'Sending…' : 'Send enquiry'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

    </>
  )
}
