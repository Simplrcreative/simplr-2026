import { useEffect, useRef, useState } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import CategoryBadge from '../components/CategoryBadge.jsx'
import RichHeading from '../components/RichHeading.jsx'
import RichText from '../components/RichText.jsx'
import Seo from '../components/Seo.jsx'
import { createSplitTextAnimation, refreshScrollTriggers, createSlideUpAnimations, createParallaxAnimations, createBtnHoverAnimation, createWorkThumbHoverAnimation, scrollToTopImmediate } from '../lib/animations/index.js'
import { buildServiceSingleSeo } from '../lib/page-seo.js'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PictureImg from '../components/PictureImg.jsx'
import { buildCollectionPath, buildEntryPath } from '../lib/wp-api.js'

gsap.registerPlugin(ScrollTrigger)

function initBottomMenu() {
  const menu = document.querySelector('.bottom-menu')
  const trigger = document.querySelector('.bottom-menu-trigger')
  if (!menu || !trigger) return null

  gsap.set(menu, { y: 50, opacity: 0 })

  const tl = gsap.timeline()
  tl.to(menu, {
    y: 0,
    opacity: 1,
    duration: 0.75,
    ease: 'power4.inOut',
  })

  const scrollTrigger = ScrollTrigger.create({
    trigger,
    start: 'top 100%',
    animation: tl,
    toggleActions: 'play reverse play reverse',
  })

  return { menu, scrollTrigger }
}

function getThumbnail(acfFeaturedThumbnail, preferredSize = 'large', fallbackSize = 'medium_large') {
  const thumbnailNode = acfFeaturedThumbnail?.node
  const sizes = thumbnailNode?.mediaDetails?.sizes ?? []

  return (
    sizes.find((s) => s.name === preferredSize)?.sourceUrl ??
    sizes.find((s) => s.name === fallbackSize)?.sourceUrl ??
    thumbnailNode?.guid ??
    ''
  )
}

const SERVICE_COLORS = {
  strategy: 'var(--color-strategy)',
  branding: 'var(--color-branding-design)',
  web: 'var(--color-web-design-development)',
  motion: 'var(--color-motion)',
  template: 'var(--color-templates)',
}

function getServiceColor(serviceName = '') {
  const lower = serviceName.toLowerCase()
  const key = Object.keys(SERVICE_COLORS).find((k) => lower.includes(k))
  return key ? SERVICE_COLORS[key] : 'var(--color-coffee)'
}

function ServiceLabelIcon({ color }) {
  return (
    <span className="service-label-icon" style={{ '--service-accent': color }}>
      <span className="service-label-icon__circle service-label-icon__circle--left" />
      <span className="service-label-icon__circle service-label-icon__circle--right" />
    </span>
  )
}

function killBottomMenuScrollTrigger() {
  ScrollTrigger.getAll().forEach((instance) => {
    if (instance.trigger?.matches?.('.bottom-menu-trigger')) {
      instance.kill()
    }
  })
}

function setupBottomMenuScrollTrigger() {
  killBottomMenuScrollTrigger()

  const menu = document.querySelector('.bottom-menu')
  if (menu) {
    gsap.killTweensOf(menu)
  }

  return initBottomMenu()
}

export default function ServicesSinglePage() {
  const pageRef = useRef(null)
  const bottomMenuRef = useRef(null)
  const { slug, page } = useLoaderData() ?? {}
  const service = page?.acfServiceBuilder ?? null
  const { acfHeading, acfSections } = service ?? {}
  const title = page?.title || service?.acfTitle || service?.acfService || slug || ''
  const featuredVideo = page?.acfServiceBuilder?.acfFeaturedVideo?.node?.guid || ''
  const featuredImage = page?.acfServiceBuilder?.acfFeaturedImage?.node?.guid || ''
  const accentColor = getServiceColor(service?.acfService || title || slug)
  const pathname = buildEntryPath('services', slug)
  const seo = buildServiceSingleSeo(page, slug, pathname)
  const [openAccordions, setOpenAccordions] = useState({})
  const testimonial = service?.acfTestimonial?.nodes?.[0] || ''
  const testimonialData = testimonial?.acfTestimonials || ''
  const caseStudies = service?.acfCaseStudy?.nodes || []
  const caseStudy = caseStudies[0] || ''
  const caseStudySlug = caseStudy?.slug || ''
  const caseStudyData = caseStudy?.acfWorkBuilder || ''
  console.log(caseStudy);
  //const caseStudyImage = caseStudyData?.acfFeaturedThumbnail?.node?.guid || ''
  //NEW SOURCES
  const featuredThumbnail = caseStudyData?.acfFeaturedThumbnail
  const loaderSrc = getThumbnail(featuredThumbnail, 'loader')
  const mobileSrc = getThumbnail(featuredThumbnail, 'medium')
  const desktopSrc = getThumbnail(featuredThumbnail, 'large')
  const secondaryThumbnail = caseStudyData?.acfSecondaryThumbnail || featuredThumbnail
  const secondaryLoaderSrc = getThumbnail(secondaryThumbnail, 'loader')
  const secondaryMobileSrc = getThumbnail(secondaryThumbnail, 'medium')
  const secondaryDesktopSrc = getThumbnail(secondaryThumbnail, 'large')
  //END NEW SOURCES
  const caseStudyClient = caseStudyData?.acfClient?.nodes?.[0]?.name || ''
  const caseStudyCategories = caseStudyData?.acfCategory?.nodes ?? []
  const ctaBtnRefs = useRef({})

  useEffect(() => {
    const cleanupSlideUp = createSlideUpAnimations(pageRef.current)
    const cleanupParallax = createParallaxAnimations(pageRef.current)
    const cleanupSplitText = createSplitTextAnimation()
    const cleanupWorkThumbHover = createWorkThumbHoverAnimation()
    refreshScrollTriggers()

    return () => {
      cleanupSlideUp?.()
      cleanupSplitText?.()
      cleanupParallax?.()
      cleanupWorkThumbHover?.()
    }
  }, [acfSections, testimonial])

  useEffect(() => {
    const cleanups = []

    Object.values(ctaBtnRefs.current).forEach((btn) => {
      if (btn) {
        const cleanup = createBtnHoverAnimation(btn)
        if (cleanup) cleanups.push(cleanup)
      }
    })

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [acfSections])

  useEffect(() => {
    bottomMenuRef.current = setupBottomMenuScrollTrigger()

    const syncBottomMenuAfterTransition = (event) => {
      if (!event.detail?.fromBottomMenuNav) return

      scrollToTopImmediate()

      requestAnimationFrame(() => {
        const menu = document.querySelector('.bottom-menu')
        if (menu) {
          gsap.killTweensOf(menu)
          gsap.set(menu, { clearProps: 'all' })
          gsap.set(menu, { y: 50, opacity: 0, visibility: 'visible' })
        }

        bottomMenuRef.current = setupBottomMenuScrollTrigger()
        ScrollTrigger.refresh()
      })
    }

    window.addEventListener('page-transition:complete', syncBottomMenuAfterTransition)

    return () => {
      window.removeEventListener('page-transition:complete', syncBottomMenuAfterTransition)
      bottomMenuRef.current?.scrollTrigger?.kill()
      const menu = document.querySelector('.bottom-menu')
      if (menu) gsap.killTweensOf(menu)
    }
  }, [])

  function isAccordionOpen(sectionIndex, accordionIndex) {
    const openIndex = openAccordions[sectionIndex]

    if (openIndex === null) {
      return false
    }

    if (openIndex === undefined) {
      return false
    }

    return openIndex === accordionIndex
  }

  function toggleAccordion(sectionIndex, accordionIndex) {
    setOpenAccordions((prev) => {
      const current = prev[sectionIndex]

      return {
        ...prev,
        [sectionIndex]: current === accordionIndex ? null : accordionIndex,
      }
    })
  }


  return (
    <div ref={pageRef} className="relative">
      <Seo {...seo} />

      <div className="bottom-menu hidden md:block fixed z-10 right-5 bottom-5">
        <Link
          to={buildEntryPath('services', 'strategy')}
          className={`category border leading-none font-medium rounded-full ${pathname === buildEntryPath('services', 'strategy') ? 'border-strategy bg-strategy text-coffee pointer-events-none' : 'border-coffee bg-white text-coffee'}`}
        >
        Strategy
        </Link>
        <Link
          to={buildEntryPath('services', 'branding-design')}
          className={`category border leading-none font-medium rounded-full ${pathname === buildEntryPath('services', 'branding-design') ? 'border-branding-design bg-branding-design text-white pointer-events-none' : 'border-coffee bg-white text-coffee'}`}
        >
        Branding & Design
        </Link>
        <Link
          to={buildEntryPath('services', 'web-design-development')}
          className={`category border leading-none font-medium rounded-full ${pathname === buildEntryPath('services', 'web-design-development') ? 'border-web-design-development bg-web-design-development text-coffee pointer-events-none' : 'border-coffee bg-white text-coffee'}`}
        >
        Web Design & Development
        </Link>
        <Link
          to={buildEntryPath('services', 'motion')}
          className={`category border leading-none font-medium rounded-full ${pathname === buildEntryPath('services', 'motion') ? 'border-motion bg-motion text-white pointer-events-none' : 'border-coffee bg-white text-coffee'}`}
        >
        Motion
        </Link>
        <Link
          to={buildEntryPath('services', 'templates')}
          className={`category border leading-none font-medium rounded-full ${pathname === buildEntryPath('services', 'templates') ? 'border-templates bg-templates text-white pointer-events-none' : 'border-coffee bg-white text-coffee'}`}
        >
        Templates
        </Link>
      </div>

      <section className="page-hero px-5 pb-5 mb-15 bg-white section-light min-h-[90vh] md:min-h-screen flex items-end">
        <div className="grid grid-cols-12 w-full">
          <div className="col-span-12 change-logo-back" />
          <div className="col-start-1 col-span-12 md:col-span-5 text-coffee mb-10 md:mb-0 change-logo">
            <div className="service-card__label mb-5">
                <ServiceLabelIcon color={accentColor} />
                <span className="service-card__label-text">{title}</span>
            </div>
            <h1 className="service-card__title">{acfHeading}</h1>
          </div>
          <div className="col-start-1 md:col-start-7 col-span-12 md:col-span-6 parallax">
            <div className="featured-image">
              {featuredVideo ? (
                  <div
                    className="ratio service-featured-media overflow-hidden rounded-[10px]"
                    style={{ '--aspect-ratio-desktop': '54%', '--aspect-ratio-mobile': '54%' }}
                    data-transition-dock="service-featured-media"
                  >
                    <video
                      src={featuredVideo}
                      poster={featuredImage + '.webp' || undefined}
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  </div>
                ) : (
                  <picture
                    className="ratio service-featured-media overflow-hidden rounded-[10px]"
                    style={{ '--aspect-ratio-desktop': '54%', '--aspect-ratio-mobile': '54%' }}
                    data-transition-dock="service-featured-media"
                  >
                    {featuredImage && <source srcSet={featuredImage + '.webp'} type="image/webp" />}
                    {featuredImage && <img src={featuredImage + '.webp'} alt={title} />}
                  </picture>
                )}
            </div>
          </div>
        </div>
      </section>

      <div className="bottom-menu-trigger">

      {acfSections?.map((section, sectionIndex) => {
        const sectionHeading = section?.acfSectionHeading || ''
        const sectionContent = section?.acfSectionContent || ''
        const sectionCta = section?.acfCta || ''
        const sectionAccordion = section?.acfAccordion || []

        if (!sectionHeading && !sectionContent && sectionAccordion.length === 0) {
          return null
        }

        return (
          <section key={`section-${sectionIndex}`} className="px-5 pb-20 md:py-20 bg-white section-light">
            <div className="grid grid-cols-12 ">
              {sectionHeading && (
                <div className="col-start-1 col-span-12 md:col-span-9 md:pe-40 slide-up-subtle">
                  <RichHeading as="h2" html={sectionHeading} className="section-heading" />
                </div>
              )}
              {sectionContent && (
                <div className="col-start-1 md:col-start-4 col-span-12 md:col-span-5 slide-up-subtle">
                  <RichText html={sectionContent} className="service-richtext pt-10 md:pt-20" />
                </div>
              )}
              {sectionCta && (
                <div className="button-wrapper col-start-1 md:col-start-4 col-span-12 md:col-span-5 slide-up-subtle my-4">
                  <Link 
                    to={sectionCta.url}
                    ref={(el) => { ctaBtnRefs.current[sectionIndex] = el }}
                    title={sectionCta.title}
                    target={sectionCta.target}
                    className="btn relative mt-10"
                  >
                    <span className="btn-fill" aria-hidden="true" />
                    <span className="btn-inner">
                      <span className="btn-text text-coffee">{sectionCta.title}</span>
                      {sectionCta.title}
                    </span>
                  </Link>
                </div>
              )}
              {sectionAccordion.length > 0 && (
                <div className="col-start-1 md:col-start-4 col-span-12 md:col-span-5 pt-10 md:pt-20 service-accordion-list">
                  {sectionAccordion.map((accordion, accordionIndex) => {
                    const accordionTitle = accordion?.acfTitle || ''
                    const accordionContent = accordion?.acfContent || ''
                    const accordionKey = `section-${sectionIndex}-accordion-${accordionIndex}`
                    const isOpen = isAccordionOpen(sectionIndex, accordionIndex)

                    if (!accordionTitle && !accordionContent) {
                      return null
                    }

                    return (
                      <div key={accordionKey} className={`service-accordion-item slide-up-subtle ${isOpen ? 'is-open' : ''}`}>
                        <button
                          type="button"
                          className="service-accordion-trigger"
                          onClick={() => toggleAccordion(sectionIndex, accordionIndex)}
                          aria-expanded={isOpen}
                        >
                          <span className="service-accordion-title">{accordionTitle}</span>
                          <span className="service-accordion-symbol" aria-hidden="true">{isOpen ? '-' : '+'}</span>
                        </button>
                        <div className="service-accordion-panel" aria-hidden={!isOpen}>
                          <div className="service-accordion-content">
                            <RichText html={accordionContent} className="service-richtext" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        )
      })}

      {testimonial && (
        <section className="testimonials p-5 section-light bg-white footer-off">
                <div id="testimonial-1" className="grid grid-cols-12">
            <div className="col-start-1 col-span-12 md:col-span-6 order-2 md:order-1 slide-up-from-left">
                {caseStudy && (
                <div className="client-work">
                  <Link
                    to={buildEntryPath('work', caseStudySlug)}
                    className="alt-transition-img thumb-swap-trigger"
                    data-card-key=''
                    data-transition-source="media"
                    data-transition-variant="work-card"
                    data-transition-snapshot-state="hover"
                  >
                      <div className="ratio overflow-hidden rounded-[10px] block thumb-swap" style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '90%' }}>
                        <PictureImg
                          loaderSrc = {loaderSrc + '.webp'}
                          mobileSrc = {mobileSrc + '.webp'}
                          desktopSrc = {desktopSrc + '.webp'}
                          imgClass = 'thumb-primary rounded-[10px]'
                          altText = {caseStudyClient}
                        />
                        <PictureImg
                          loaderSrc = {secondaryLoaderSrc + '.webp'}
                          mobileSrc = {secondaryMobileSrc + '.webp'}
                          desktopSrc = {secondaryDesktopSrc + '.webp'}
                          imgClass = 'thumb-secondary rounded-[10px]'
                          altText = ''
                        />
                      </div>
                    </Link>
                    <div className="mt-3 flex">
                    {caseStudyClient}
                    </div>
                    <div className="categories mt-3 flex">
                    {caseStudyCategories.map(({ name }) => {
                      return (
                       <CategoryBadge key={name} name={name} />
                      )
                    })}
                    </div>
                </div>
                )}

            </div>
            <div className="col-start-1 md:col-start-8 col-span-12 md:col-span-4 order-1 md:order-2 flex flex-col items-center justify-center trigger-split-text-coffee  mb-15 md:mb-0 ">
              <div className="testimonial lead max-w-[38ch]">
                <div className="split-text-coffee trigger-split-text-coffee">
                  <div className="mb-10 md:mb-20"><RichText html={testimonialData.acfTestimonial} /></div>
                  <div><b>{testimonial.title}</b><br/>{testimonialData.acfRole}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
       
      </div>

    </div>
  )
}
