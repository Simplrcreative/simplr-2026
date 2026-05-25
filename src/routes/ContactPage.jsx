import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Seo from '../components/Seo.jsx'
import { breadcrumbSchema, webPageSchema } from '../lib/seo.js'
import { createSplitTextAnimation, createBtnHoverAnimation } from '../lib/animations/index.js'

gsap.registerPlugin(ScrollTrigger)

const ENQUIRY_TYPES = [
  { name: 'Strategy', value: 'strategy', bg: 'bg-strategy', text: 'text-coffee' },
  { name: 'Branding & Design', value: 'branding-design', bg: 'bg-branding-design', text: 'text-white' },
  { name: 'Web Design & Development', value: 'web-design-development', bg: 'bg-web-design-development', text: 'text-coffee' },
  { name: 'Motion', value: 'motion', bg: 'bg-motion', text: 'text-white' },
  { name: 'Templates', value: 'templates', bg: 'bg-templates', text: 'text-white' },
  { name: 'Creative AI', value: 'creative-ai', bg: 'bg-creative-ai', text: 'text-coffee' },
  { name: 'All Services', value: 'all-services', bg: 'bg-white', text: 'text-black/90' },
]

export default function ContactPage() {
  useEffect(() => createSplitTextAnimation(), [])
  useEffect(() => createBtnHoverAnimation(btnRef.current), [])
  const btnRef = useRef(null)
  const [enquiry, setEnquiry] = useState([])

  const handleEnquiryChange = (value) => {
    if (value === 'all-services') {
      // Toggle All Services — selecting it clears everything else
      setEnquiry(prev => prev.includes('all-services') ? [] : ['all-services'])
    } else {
      // Any other option deselects All Services if active
      setEnquiry(prev => {
        const filtered = prev.filter(v => v !== 'all-services' && v !== value)
        return prev.includes(value) ? filtered : [...filtered, value]
      })
    }
  }
  const pathname = '/contact'
  const title = 'Contact'
  const description = 'Contact Page'

  return (
    <>
      <Seo
        title={title}
        description={description}
        pathname={pathname}
        schema={[
          webPageSchema({ pathname, title, description, type: 'WorkPage' }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: title, path: pathname },
          ]),
        ]}
      />

      <section className="page-hero px-5 pb-40 bg-coffee section-dark min-h-screen flex items-end">
        <div className="grid grid-cols-12 w-full">
          <div className="col-span-12 change-logo-back mb-[9rem]" />
          <div className="col-span-7 text-white change-logo">
            
            <h1 className="hero-title large my-10">Let’s make it simplr.<br/><span>Come say <i>hello.</i></span></h1>
            <div className="flex gap-20">
              <div className="eyebrow">Our Office</div>
              <div className="text-[22px]">
              <p className="font-bold">Cape Town</p>
              <p>
                Unit AS02, The Forum<br/>
                Lifestyle House, Northbank Lane<br/>
                Century City, Cape Town
              </p>
            </div>
            </div>
            
          </div>
          <div className="contact-form col-start-8 col-span-5 pt-20">
            <form className="flex flex-col gap-9 text-white">
              <p className="text-[22px] leading-6">
                <strong className="font-medium">Tell us about your project.&nbsp;&nbsp;</strong>
                <span className="font-normal">We&apos;ll take it from there.</span>
              </p>

              <div className="flex flex-col gap-7">
                {[
                  { label: 'Full Name*', name: 'name', type: 'text', required: true },
                  { label: 'Company Name*', name: 'company', type: 'text', required: true },
                  { label: 'Email Address*', name: 'email', type: 'email', required: true },
                  { label: 'Budget expectation', name: 'budget', type: 'text' },
                ].map(({ label, name, type, required }) => (
                  <div key={name} className="relative pt-5 my-2 input-wrapper">
                    <label htmlFor={name} className="input-label text-base">{label}</label>
                    <input
                      type={type}
                      id={name}
                      name={name}
                      required={required || undefined}
                      placeholder=" "
                      className="bg-transparent border-b border-white/40 outline-none text-white pb-2 w-full"
                    />
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
                        <span className="w-[26.5px] h-[26.5px] rounded-full border border-none bg-white/20 shrink-0 transition-colors peer-checked:bg-white peer-checked:border-white" />
                        <span className={`category ${bg} ${text} rounded-full leading-none font-medium`}>{name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="relative pt-5 input-wrapper">
                  <label htmlFor="message" className="input-label text-base">Message</label>
                  <textarea
                    name="message"
                    className="bg-transparent border-b border-white/40 outline-none text-white resize-none h-[100px] w-full"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                ref={btnRef}
                className="btn relative"
                >
                  <span className="btn-fill" aria-hidden="true" />
                  <span className="btn-inner">
                    <span className="btn-text text-coffee">Send enquiry</span>
                    Send enquiry
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

    </>
  )
}
