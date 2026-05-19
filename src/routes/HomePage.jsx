import { useEffect, useLayoutEffect, useRef, useState, lazy, Suspense } from 'react'
import { useLoaderData, useOutletContext, Await } from 'react-router-dom'
import Seo from '../components/Seo.jsx'
import { routeDefinitions } from '../config/site.js'
import { createHeroScrollAnimation, createServicesScrollAnimation, createBtnHoverAnimation, createCaseStudiesScrollAnimation, createSplitTextAnimation, refreshScrollTriggers, createClientsScrollAnimation, createSurfaceColorTransitions, createIntroHeroTitleAnimation, createIntroVideoAnimation, setIntroHeroInitialState } from '../lib/animations/index.js'
import { buildEntryPath } from '../lib/wp-api.js'
import {
  breadcrumbSchema,
  collectionSchema,
  faqSchema,
  serviceCatalogSchema,
  webPageSchema,
} from '../lib/seo.js'
import heroVideo from '../assets/vid/simplr-showreel-loop.mp4'
import caseStudyTwo from '../assets/img/case-study-example-2.jpg'
import { Link } from 'react-router-dom'
const LazyClientLogos = lazy(() => import('../components/ClientLogos.jsx'))

let homeIntroAnimationsPlayed = false
const HOME_SCROLL_INIT_DELAY_MS = 200
const HOME_SCROLL_INIT_AFTER_INTRO_MS = 2800

const LIGHT_TEXT_SLUGS = new Set(['strategy', 'web-design-development'])

function slugify(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function CategoryBadge({ name }) {
  const slug = slugify(name)
  const textClass = LIGHT_TEXT_SLUGS.has(slug) ? 'text-coffee' : 'text-white'

  return (
    <div className={`category bg-${slug} ${textClass} leading-none font-medium rounded-full`}>
      {name}
    </div>
  )
}

function HomePageContent({ page, featuredWork, caseStudies = [] }) {
  const heroRef = useRef(null)
  const heroVideoRef = useRef(null)
  const servicesRef = useRef(null)
  const caseStudiesRef = useRef(null)
  const clientsRef = useRef(null)
  const btnRef = useRef(null)
  const faqSliderRef = useRef(null)
  const faqButtonRefs = useRef([])
  const {
    introComplete = false,
    shouldRunHomeIntroAnimations = false,
  } = useOutletContext() || {}
  const faqs = page.faqs ?? []

  const [activeFaqIndex, setActiveFaqIndex] = useState(0)

  // Set up surface colour transitions immediately — elements exist now that HomePageContent
  // has mounted (homeData is deferred, so TransitionFrame's PAGE_TRANSITION_COMPLETE_EVENT
  // fires before this component renders and finds nothing).
  useEffect(() => {
    return createSurfaceColorTransitions(document.documentElement)
  }, [])

  // Stage hero title/video while loader is active so they don't flash before intro animation.
  useLayoutEffect(() => {
     if (!shouldRunHomeIntroAnimations || introComplete || homeIntroAnimationsPlayed) return
    setIntroHeroInitialState(heroRef.current)
  }, [introComplete, shouldRunHomeIntroAnimations])

  // Run animations only after the intro loader has finished
  useEffect(() => {
    if (!introComplete) return
    let destroyHeroAnimation = () => {}
    const shouldWaitForHeroIntro = shouldRunHomeIntroAnimations && !homeIntroAnimationsPlayed
    const timer = setTimeout(() => {
      destroyHeroAnimation = createHeroScrollAnimation(heroRef.current) ?? (() => {})
      createServicesScrollAnimation(servicesRef.current)
      createCaseStudiesScrollAnimation(caseStudiesRef.current)
      createClientsScrollAnimation(clientsRef.current)
      createBtnHoverAnimation(btnRef.current)
    }, shouldWaitForHeroIntro ? HOME_SCROLL_INIT_AFTER_INTRO_MS : HOME_SCROLL_INIT_DELAY_MS)
    return () => {
      clearTimeout(timer)
      destroyHeroAnimation()
    }
  }, [introComplete, shouldRunHomeIntroAnimations])

  // Run hero entrance animations exactly once after the intro sequence.
  useEffect(() => {
    if (!introComplete || !shouldRunHomeIntroAnimations || homeIntroAnimationsPlayed) return

    const destroyHeroTitleIntro = createIntroHeroTitleAnimation(heroRef.current)
    const destroyVideoIntro = createIntroVideoAnimation(heroRef.current)
    homeIntroAnimationsPlayed = true

    return () => {
      destroyHeroTitleIntro?.()
      destroyVideoIntro?.()
    }
  }, [introComplete, shouldRunHomeIntroAnimations])

  // SplitText animations — wait for intro to complete
  useEffect(() => {
    if (!introComplete) return
    return createSplitTextAnimation()
  }, [introComplete])

  // Refresh scroll triggers after animations initialize
  useEffect(() => {
    if (!introComplete) return
    const shouldWaitForHeroIntro = shouldRunHomeIntroAnimations && !homeIntroAnimationsPlayed
    const timer = setTimeout(
      () => refreshScrollTriggers(),
      shouldWaitForHeroIntro ? HOME_SCROLL_INIT_AFTER_INTRO_MS + 200 : 250,
    )
    return () => clearTimeout(timer)
  }, [introComplete, shouldRunHomeIntroAnimations])

  // Video pause/play on visibility change
  useEffect(() => {
    const video = heroVideoRef.current
    if (!video) return
    const onVisibilityChange = () => {
      if (document.hidden) {
        video.pause()
      } else {
        video.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  useEffect(() => {
    const slider = faqSliderRef.current
    const activeButton = faqButtonRefs.current[activeFaqIndex]

    if (!slider || !activeButton) {
      return
    }

    const targetLeft = activeButton.offsetLeft - (slider.clientWidth - activeButton.clientWidth) / 2

    slider.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: 'smooth',
    })
  }, [activeFaqIndex])

  const activeFaq = faqs[activeFaqIndex]

  function showPreviousFaq() {
    if (!faqs.length) {
      return
    }

    setActiveFaqIndex((currentIndex) =>
      currentIndex === 0 ? faqs.length - 1 : currentIndex - 1
    )
  }

  function showNextFaq() {
    if (!faqs.length) {
      return
    }

    setActiveFaqIndex((currentIndex) =>
      currentIndex === faqs.length - 1 ? 0 : currentIndex + 1
    )
  }

  return (
    <>
      <Seo
        title="Home"
        description={page.intro}
        pathname="/"
        type="website"
        schema={[
          webPageSchema({
            pathname: '/',
            title: page.title,
            description: page.intro,
            type: routeDefinitions.home.schemaType,
          }),
          breadcrumbSchema([{ name: 'Home', path: '/' }]),
          serviceCatalogSchema('/', page.services),
          collectionSchema({
            pathname: '/',
            title: page.workShowcase.title,
            description: page.workShowcase.intro,
            items: featuredWork,
          }),
          faqSchema('/', page.faqs),
        ]}
      />
      <div className="play-icon text-white bg-branding-design fixed z-[9999] w-[100px] h-[100px] rounded-full flex items-center justify-center pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="ms-2" width="22px" height="auto" viewBox="0 0 18 20" fill="currentColor">
          <path d="M18 10L0 20L9.08523e-07 0L18 10Z"></path>
        </svg>
      </div>
      
      <section ref={heroRef} className="landing relative w-full px-5 min-h-screen flex flex-col justify-end change-logo-back">
          <div className="grid grid-cols-12 items-start gap-x-5">
            <div className="col-start-1 col-span-6 pb-8 max-w-[85ch]"> 
              <h1 className="hero-title">Simplr is a <span>Brand Identity and Digital Design Agency</span> in <span><i>Cape Town.</i></span></h1>
            </div>
            <div className="hero-video-holder col-start-8 col-span-5 section-dark flex items-end justify-end pb-5"> 
              <video ref={heroVideoRef} className="hero-video block w-full aspect-[16/10] object-cover overflow-hidden" autoPlay muted playsInline>
                <source src={heroVideo} type="video/mp4"/>
              </video>
            </div>
          </div>
      </section>

      <section className="brands-grow px-5 bg-white py-20 section-light relative z-1 change-logo">
        <div className="grid grid-cols-12">
          <div className="trigger-split-text-coffee col-start-4 col-span-5 lead max-w-[47ch] "> 
              <div className="split-text-coffee">We help brands grow through creativity, craft, and intelligent design. From strategy and branding to digital experiences, motion, and presentation systems, we create work that connects purpose with performance.</div>
          </div>
        </div>
      </section>

      <section ref={servicesRef} className="services py-20 section-light overflow-x-scroll relative w-full light-to-coffee-outgoing">
         <div className="services-titles flex flex-nowrap items-center text-[5.5rem] gap-10">
          <div id="strategy" data-color="text-strategy" data-stat="62" data-detail="Successfully launched brands since 2015" className="services-title font-literata flex-shrink-0">
            Strategy
          </div>
          <svg className="flex-shrink-0 opacity-[0.2] mt-3" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
            <circle cx="6.5" cy="6.5" r="6.5" fill="#300F1D"/>
          </svg>
          <div id="branding-design" data-color="text-branding-design" data-stat="85" data-detail="Our branding is OK but wait till you see our websites" className="services-title font-light flex-shrink-0 mt-3">
            Branding&Design 
          </div>
          <svg className="flex-shrink-0 opacity-[0.2] mt-3" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
            <circle cx="6.5" cy="6.5" r="6.5" fill="#300F1D"/>
          </svg>
          <div id="web-design-development" data-color="text-web-design-development" data-stat="43" data-detail="Web design and development are the mostest bestest" className="services-title font-literata flex-shrink-0">
            Web Design&Development
          </div>
          <svg className="flex-shrink-0 opacity-[0.2] mt-3" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
            <circle cx="6.5" cy="6.5" r="6.5" fill="#300F1D"/>
          </svg>
           <div id="motion" data-color="text-motion" data-stat="16" data-detail="Awesome motion content to go in here." className="services-title font-light flex-shrink-0 mt-3">
            Motion
          </div>
          <svg className="flex-shrink-0 opacity-[0.2] mt-3" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
            <circle cx="6.5" cy="6.5" r="6.5" fill="#300F1D"/>
          </svg>
          <div id="templates" data-color="text-templates" data-stat="28" data-detail="Templates detail to be written for this." className="services-title font-literata flex-shrink-0">
            Templates
          </div>
          <div className="services-titles-end-spacer flex-none w-[100vw] text-white" aria-hidden="true" >.</div>
        </div>
        <div className="service-stats pt-20">
          <div className="stat-item flex gap-5 justify-between w-[65%]">
            <div data-initial="62" className="stat-no text-strategy text-[37.5rem]">0</div>
            <div className="flex flex-col">
              <div className="stat-plus mb-40 text-strategy text-[5rem]">+</div>
              <div className="stat-detail lead max-w-[22ch]">Successfully launched brands since 2015 </div>
            </div>
          </div>
        </div>
        <Link 
          to="services"
          ref={btnRef}
          className="btn absolute right-[1.25rem] bottom-[5rem]"
        >
          <span className="btn-fill" aria-hidden="true" />
          <span className="btn-inner">
            <span className="btn-text text-coffee">Explore our services</span>
            Explore our services
          </span>
        </Link>
      </section>

      <section ref={caseStudiesRef} className="case-studies px-5 py-30 section-dark light-to-coffee-incoming min-h-screen">
        
          <div className="grid grid-cols-12 items-emd slide-up pt-10">
            <div className="col-start-1 col-span-5 client-name-list text-white flex flex-col justify-center">
              {caseStudies.map((study) => {
                const path = buildEntryPath('work', study.slug)

                return (
                  <div
                    key={`name-${study.id}`}
                    data-client={study.slug}
                    className="client-name max-w-[55ch]"
                  >
                    <Link 
                      to={path} 
                      className="text-xl inline-block alt-transition-text"
                    >
                      {study.client}
                      <div className="client-detail font-literata text-5xl font-light pb-3">
                        <span className="client-detail-text">{study.detail}</span>
                      </div>
                    </Link>
                  </div>
                )
              })}

            </div>

            <div className="col-start-8 col-span-5 client-work-list min-h-screen overflow-y-hidden_ rounded-[10px] flex flex-col justify-center">
              {caseStudies.map((study) => {
                const path = buildEntryPath('work', study.slug)

                return (
                  <div key={`work-${study.id}`} id={study.slug} className="client-work">
                    <Link
                      to={path}
                      className="client-work-img overflow-hidden rounded-[10px] block alt-transition-img"
                    >
                      <picture className="ratio overflow-hidden" style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '90%' }}>
                        {study.thumbnail ? <img src={study.thumbnail} title={study.client} /> : null}
                      </picture>
                    </Link>
                    {study.categories?.length > 0 && (
                      <div className="categories mt-5 flex">
                        {study.categories.map(({ name }) => (
                          <CategoryBadge key={`${study.id}-${name}`} name={name} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

            </div>

          </div>
      </section>

      <Suspense fallback={<div ref={clientsRef} className="bg-coffee section-dark min-h-screen" />}>
        <LazyClientLogos innerRef={clientsRef} />
      </Suspense>

      <section className="testimonials p-5 section-light bg-white footer-off">
        <div id="testimonial-1" className="grid grid-cols-12">
          <div className="col-start-1 col-span-6 slide-up-from-left">
              <div className="client-work">
                  <picture className="ratio overflow-hidden rounded-[10px]" style={{'--aspect-ratio-desktop':'90%', '--aspect-ratio-mobile':'90%'}}>
                    <img src={caseStudyTwo} title="Satalia" />
                  </picture>
                  <div className="mt-3 flex">
                  Satalia
                  </div>
                  <div className="categories mt-3 flex">
                    <div className="category bg-branding-design text-text-white leading-none font-medium rounded-full">Branding & Design</div>
                    <div className="category bg-web-design-development text-text-coffee leading-none font-medium rounded-full">Web Design & Development</div>
                    <div className="category bg-motion text-text-white leading-none font-medium rounded-full">Motion</div>
                  </div>
              </div>

          </div>
          <div className="col-start-8 col-span-4 flex flex-col items-center justify-center trigger-split-text-coffee">
            <div className="testimonial lead max-w-[38ch]">
              <div className="split-text-coffee">
                <p className="mb-20">&ldquo;Simplr&apos;s creativity has brought Satalia&apos;s bold, utopian vision for AI to life. The result is a dynamic, flexible brand identity that reflects our commitment to innovation and inclusivity. Their work has given us a dynamic, forward-thinking brand presence, and we&apos;re excited to share it with the world.&rdquo;</p>
                <p><b>Daniel Hulme</b><br/>CEO Satalia</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="faqs ps-5 pt-60 bg-white section-light flex flex-col justify-center">
        <div className="grid grid-cols-1 gap-y-10 md:grid-cols-12 md:gap-x-5 md:gap-y-12 slide-up">
          <div className="trigger-split-text-coffee md:col-span-4">
            <div className="eyebrow">FAQs</div>
            <h1 className="split-text-coffee">Have questions?</h1>
          </div>

          {activeFaq && (
            <>
              <div className="md:col-span-12 flex">

                 <button
                    type="button"
                    onClick={showPreviousFaq}
                    className="faq-nav-button flex h-[3.125rem] w-[3.125rem] shrink-0 items-center justify-center rounded-full border border-coffee text-coffee transition-colors duration-200 hover:border-coffee hover:bg-coffee hover:text-white"
                    aria-label="Show previous frequently asked question"
                  >
                    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-[1.5rem] w-[1.5rem]">
                      <path d="M9.5 3.5 5 8l4.5 4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={showNextFaq}
                    className="faq-nav-button flex h-[3.125rem] w-[3.125rem] shrink-0 items-center justify-center rounded-full border border-coffee text-coffee transition-colors duration-200 hover:border-coffee hover:bg-coffee hover:text-white"
                    aria-label="Show next frequently asked question"
                  >
                    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-[1.5rem] w-[1.5rem]">
                      <path d="M6.5 3.5 11 8l-4.5 4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </svg>
                  </button>

                <div ref={faqSliderRef} className="faq-slider flex items-center overflow-x-auto pb-2">
                  
                 

                  {faqs.map((item, index) => {
                    const isActive = index === activeFaqIndex

                    return (
                      <button
                        key={item.question}
                        type="button"
                        ref={(element) => {
                          faqButtonRefs.current[index] = element
                        }}
                        onClick={() => setActiveFaqIndex(index)}
                        className={`lead faq-pill h-[3.125rem] shrink-0 rounded-full border px-5 flex items-center text-left text-base leading-tight transition-all duration-200 ${isActive ? 'border-coffee text-coffee shadow-[0_0_0_1px_rgba(48,15,29,0.08)]' : 'border-coffee/16 text-coffee/42 hover:border-coffee/28 hover:text-coffee/70'}`}
                        aria-pressed={isActive}
                      >
                        <span className="block whitespace-nowrap">{item.question}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="md:col-span-5">
                <div key={activeFaq.question} className="faq-answer-fade max-w-[32rem] text-[1.125rem] leading-[1.5] text-coffee">
                  {activeFaq.answer}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}

export default function HomePage() {
  const { homeData } = useLoaderData()
  return (
    <Suspense fallback={<section className="min-h-screen bg-white section-light" />}>
      <Await resolve={homeData}>
        {({ page, featuredWork, caseStudies }) => (
          <HomePageContent page={page} featuredWork={featuredWork} caseStudies={caseStudies} />
        )}
      </Await>
    </Suspense>
  )
}