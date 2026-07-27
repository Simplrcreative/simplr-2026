import { useEffect } from 'react'
import { useLoaderData } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Seo from '../components/Seo.jsx'
import ContactForm from '../components/ContactForm.jsx'
import { buildContactPageSeo } from '../lib/page-seo.js'
import { createSplitTextAnimation } from '../lib/animations/index.js'

gsap.registerPlugin(ScrollTrigger)

export default function ContactPage() {
  const { page } = useLoaderData() ?? {}
  const seo = buildContactPageSeo(page)

  useEffect(() => createSplitTextAnimation(), [])

  return (
    <>
      <Seo {...seo} />

      <section className="page-hero px-3 md:px-5 py-5 md:py-20 bg-coffee section-dark min-h-[75vh] flex md:items-end">
        <div className="grid grid-cols-12 w-full grid-rows-[30px_auto]">
          <div className="col-span-12 change-logo-back" aria-hidden="true" />
          <div className="col-span-12 lg:col-span-6 xl:col-span-7 mt-30 md:mt-20 text-white change-logo">
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
          <div className="col-start-1 col-span-12 lg:col-start-7 lg:col-span-6 xl:col-start-8 xl:col-span-5 pt-10 md:pt-20">
            <ContactForm
              style="light"
              buttonClassName="btn alt relative disabled:opacity-50 disabled:cursor-not-allowed"
              heading={
                <>
                  <strong className="font-medium">Tell us about your project.&nbsp;&nbsp;</strong>
                  <span className="font-normal">We&apos;ll take it from there.</span>
                </>
              }
            />
          </div>
        </div>
      </section>

    </>
  )
}
