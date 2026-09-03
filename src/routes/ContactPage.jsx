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
            <div className="grid grid-cols-12">
              <div className="col-span-12 xl:col-span-3 col-start-1 eyebrow">
                Our Office
              </div>
              <div className="col-span-12 xl:col-span-5 xl:col-start-4">
                <p>
                  Unit AS02, The Forum<br/>
                  Lifestyle House, Northbank Lane<br/>
                  Century City, Cape Town
                </p>
                <p className="mt-3 md:mt-8">
                  <a href="https://maps.app.goo.gl/fACbYwowfLYkTBay5" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
                      <path d="M6 0C4.40928 0.00196598 2.88425 0.66484 1.75943 1.84321C0.634624 3.02159 0.00188039 4.61924 3.76592e-06 6.28571C-0.00145878 7.64748 0.423117 8.97223 1.20873 10.0571C1.20873 10.0571 1.37237 10.2829 1.39909 10.3154L6 16L10.6031 10.3126C10.6271 10.2823 10.7913 10.0571 10.7913 10.0571L10.7918 10.0554C11.5769 8.97091 12.0013 7.64683 12 6.28571C11.9981 4.61924 11.3654 3.02159 10.2406 1.84321C9.11576 0.66484 7.59072 0.00196598 6 0ZM6 8.57143C5.56848 8.57143 5.14665 8.43737 4.78785 8.18622C4.42905 7.93506 4.1494 7.57808 3.98426 7.16042C3.81913 6.74276 3.77592 6.28318 3.86011 5.83979C3.94429 5.39641 4.15209 4.98913 4.45722 4.66947C4.76236 4.34981 5.15112 4.13211 5.57435 4.04392C5.99758 3.95572 6.43627 4.00099 6.83495 4.17399C7.23362 4.34699 7.57437 4.63996 7.81412 5.01584C8.05386 5.39172 8.18182 5.83364 8.18182 6.28571C8.1811 6.89169 7.95099 7.47263 7.54198 7.90112C7.13297 8.32961 6.57843 8.57067 6 8.57143Z" fill="white"/>
                    </svg>
                    <span>View on Google Maps</span>
                  </a>
                </p>
              </div>
              </div>
            <div className="grid grid-cols-12 mt-10 md:mt-20 contact-info">
              <div className="col-span-12 xl:col-span-3 col-start-1 eyebrow">
                Contact
              </div>
              <div className="col-span-12 lg:col-span-3 lg:col-start-1 xl:col-start-4">
                <p>
                  <span className="font-literata"><i>Say hello</i></span><br/>
                 <a href="mailto:hello@simplr.co.za">hello@simplr.co.za</a>
                </p>
              </div>
              <div className="col-span-12 lg:col-span-3 lg:col-start-5 xl:col-start-7">
                <p>
                  <span className="font-literata"><i>Start a project</i></span><br/>
                 <a href="mailto:newbiz@simplr.co.za">newbiz@simplr.co.za</a>
                </p>
              </div>
              <div className="col-span-12 lg:col-span-3 lg:col-start-1 xl:col-start-4 mt-3 md:mt-5">
                <p>
                  <span className="font-literata"><i>Join the team</i></span><br/>
                 <a href="mailto:careers@simplr.co.za">careers@simplr.co.za</a>
                </p>
              </div>
              <div className="col-span-12 lg:col-span-3 lg:col-start-5 xl:col-start-7 mt-3 md:mt-5">
                <p>
                  <span className="font-literata"><i>Say hello</i></span><br/>
                 +27 87 702 6641
                </p>
              </div>
            </div>
          </div>
          <div className="col-start-1 col-span-12 lg:col-start-7 lg:col-span-6 xl:col-start-8 xl:col-span-5 pt-10 md:pt-20">
            <ContactForm
              variant="light"
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
