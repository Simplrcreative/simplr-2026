import { useEffect, useRef } from 'react'
import { Link, useLoaderData, useLocation } from 'react-router-dom'
import Seo from '../components/Seo.jsx'
import { createSplitTextAnimation, refreshScrollTriggers, createSlideUpAnimations, createParallaxAnimations, createBtnHoverAnimation } from '../lib/animations/index.js'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import RichText from '../components/RichText.jsx'
import RichHeading from '../components/RichHeading.jsx'
import ContactForm from '../components/ContactForm.jsx'

gsap.registerPlugin(ScrollTrigger)

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

export default function LandingPage() {
  const pageRef = useRef(null)
  const { page } = useLoaderData() ?? {}
  const { pathname } = useLocation()
  const title = page?.title || 'Untitled'
  const landingPageContent = page?.acfLandingPageBuilder || ''
  const headline = landingPageContent.acfHeadline || ''
  const showForm = landingPageContent.acfShowForm || false
  const formHeading = landingPageContent.acfContactFormHeading || ''
  const introduction = landingPageContent.acfIntroduction || ''
  const featuredVideo =
    landingPageContent.featuredVideo?.node?.mediaItemUrl
    || landingPageContent.featuredVideo?.node?.guid
    || ''
  const featuredImage = getThumbnail(landingPageContent.acfFeaturedImage)
  const acfSections = landingPageContent?.acfSections || []
  const ctaBtnRefs = useRef({})

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
    let cleanups = []

    const initPageAnimations = () => {
      cleanups.forEach((cleanup) => cleanup())
      cleanups = []

      // Match ServicesSinglePage: tear down any previous fill pin, then reset
      // the featured media so a new scrub starts from identity transforms.
      ScrollTrigger.getById('parallax-fill')?.kill()

      const featuredMedia = pageRef.current?.querySelector('[data-transition-dock="service-featured-media"]')
      if (featuredMedia) {
        gsap.set(featuredMedia, {
          x: 0,
          y: 0,
          scale: 1,
          clearProps: 'transform,willChange,borderRadius,zIndex,position',
        })
      }

      const cleanupSlideUp = createSlideUpAnimations(pageRef.current)
      const cleanupParallax = createParallaxAnimations(pageRef.current)
      const cleanupSplitText = createSplitTextAnimation()

      if (cleanupSlideUp) cleanups.push(cleanupSlideUp)
      if (cleanupParallax) cleanups.push(cleanupParallax)
      if (cleanupSplitText) cleanups.push(cleanupSplitText)

      refreshScrollTriggers()
    }

    const onTransitionComplete = () => {
      requestAnimationFrame(() => initPageAnimations())
    }

    if (document.documentElement.classList.contains('page-transitioning')) {
      window.addEventListener('page-transition:complete', onTransitionComplete, { once: true })
    } else {
      initPageAnimations()
    }

    return () => {
      window.removeEventListener('page-transition:complete', onTransitionComplete)
      cleanups.forEach((cleanup) => cleanup())
      ScrollTrigger.getById('parallax-fill')?.kill()
    }
  }, [pathname, featuredVideo, featuredImage, acfSections])

  return (
    <div ref={pageRef} className="relative">
      <Seo
        title={title || 'Thinking'}
        description=""
        pathname={pathname}
      />

      <section className="page-hero parallax-fill-section relative w-full px-3 md:px-5 py-5 md:pt-0 md:pb-5 bg-white min-h-[80vh]__ md:min-h-screen flex flex-col justify-end">
        <div className="grid grid-cols-12 w-full grid-rows-[30px_auto]">
          <div className="col-span-12 change-logo-back" aria-hidden="true" />
          <div className="col-start-1 col-span-12 md:col-span-10 lg:col-span-5 text-coffee mt-30 lg:mt-0 mb-12 lg:mb-0">
            <div className="eyebrow max-w-[36ch]">{title}</div>
            <h1 className="hero-title w-[22ch]"><span>{headline}</span></h1>
            
          </div>
          <div className="col-start-1 col-span-12 lg:col-start-8 lg:col-span-5">
            <div className="featured-image">
              {featuredVideo ? (
                <div
                  className="ratio service-featured-media parallax-fill rounded-[10px]"
                  style={{ '--aspect-ratio-desktop': '54%', '--aspect-ratio-mobile': '54%' }}
                  data-transition-dock="service-featured-media"
                >
                  <video
                    src={featuredVideo}
                    poster={featuredImage ? `${featuredImage}.webp` : undefined}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                </div>
              ) : (
                <picture
                  className="ratio service-featured-media parallax-fill rounded-[10px]"
                  style={{ '--aspect-ratio-desktop': '54%', '--aspect-ratio-mobile': '54%' }}
                  data-transition-dock="service-featured-media"
                >
                  {featuredImage ? <source srcSet={`${featuredImage}.webp`} type="image/webp" /> : null}
                  {featuredImage ? <img src={`${featuredImage}.webp`} alt={title} /> : null}
                </picture>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-3 md:px-5 pt-10 lg:pt-20 bg-white section-light change-logo">
        <div className="grid grid-cols-12 w-full">
          <div className="col-start-1 col-span-12 md:col-span-10 lg:col-span-5 slide-up-subtle">
           <RichText html={introduction} />
          </div>
        </div>
      </section>

      {acfSections?.map((section, sectionIndex) => {
        const sectionHeading = section?.acfHeadline || ''
        const sectionIntroduction = section?.acfIntroduction || ''
        const sectionContent = section?.acfContent || ''
        const sectionContentAfter = section?.acfContentAfter || ''
        const sectionSteps = section?.acfSteps || []
        const sectionFeatures = section?.acfFeatures || []
        const sectionCta = section?.acfCta || ''

        if (!sectionHeading) {
          return null
        }

        return (
          <section
            key={`section-${sectionIndex}`}
            className={`px-3 md:px-5 py-10 md:py-20 bg-white section-light${sectionIndex === 0 ? ' change-logo__' : ''}`}
          >
            <div className="grid grid-cols-12 w-full">
              {sectionHeading && (
                <div className="col-span-12 lg:col-span-5 max-w-[70ch] mb-5 lg:mb-0 slide-up-subtle">
                  <RichHeading as="h2" html={sectionHeading} className="font-literata section-heading"/>
                  <div className="mt-10 slide-up-subtle">
                    {sectionIntroduction && (
                      <RichText html={sectionIntroduction} />
                    )}
                  </div>
                </div>
              )}
              {sectionContent && (
                <div className="col-start-1 col-span-12 lg:col-start-7 lg:col-span-6 section-content slide-up-subtle">
                  <RichText html={sectionContent} />
                </div>
              )}
              {sectionSteps.length > 0 && (
                <div className="col-start-1 col-span-12 md:col-start-7 md:col-span-5 step-list">
                  {sectionSteps.map((step, stepIndex) => {
                    const stepTitle = step?.acfTitle || ''
                    const stepContent = step?.acfContent || ''
                    const stepKey = `section-${sectionIndex}-step-${stepIndex}`

                    if (!stepTitle && !stepContent) {
                      return null
                    }

                    return (
                      <div key={stepKey} className="step-item slide-up-subtle">
                        <div className="step-title"><span>Step {stepIndex + 1}</span> {stepTitle}</div>
                        <div className="step-content">
                            <RichText html={stepContent} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {sectionFeatures.length > 0 && (
                <div className="col-start-1 col-span-12 md:col-start-7 md:col-span-5 feature-list">
                  {sectionFeatures.map((feature, featureIndex) => {
                    const featureTitle = feature?.acfTitle || ''
                    const featureContent = feature?.acfContent || ''
                    const swags = feature?.acfSwag || ''
                    const featureKey = `section-${sectionIndex}-feature-${featureIndex}`

                    return (
                      <div key={featureKey} className="feature-item slide-up-subtle">
                        <div className="feature-title">{featureTitle}</div>
                        <div className="feature-content">
                            <RichText html={featureContent} />
                        </div>
                        {swags && (
                          <div className="swags my-20">
                          {swags.map((swag, index) => {
                            const preUnit = swag.acfPreUnit ?? ''
                            const postUnit = swag.acfPostUnit ?? ''
                            const number = swag.acfNumber ?? ''
                            const detail = swag.acfDetail ?? ''

                            return (
                              <div
                                key={`swag-${index}`}
                                className="swag landing-page flex slide-up-subtle"
                              >
                                <div className="swag-numbers flex justify-start items-start">
                                  {preUnit && (
                                    <span className="swag-unit pre">{preUnit}</span>
                                  )}
                                  {number && (
                                    <span className="swag-number">{number}</span>
                                  )}
                                  {postUnit && (
                                    <span className="swag-unit">{postUnit}</span>
                                  )}
                                  {detail && (
                                    <span className="ps-5 pt-2 swag-detail">
                                      {detail}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {sectionContentAfter && (
                <div className="col-start-1 col-span-12 md:col-start-7 md:col-span-6 section-content slide-up-subtle">
                  <RichText html={sectionContentAfter} />
                </div>
              )}
              {sectionCta && (
                <div className="button-wrapper md:col-start-7 col-span-6 slide-up-subtle md:mt-4">
                  <Link
                    to={sectionCta.url}
                    ref={(el) => { ctaBtnRefs.current[sectionIndex] = el }}
                    title={sectionCta.title}
                    target={sectionCta.target}
                    className="btn relative mt-10"
                  >
                    <span>{sectionCta.title}</span>
                  </Link>
                </div>
              )}
            </div>
          </section>
        )
      })}

      {showForm && (
        <section className={`px-3 md:px-5 pt-10 md:pt-20${!acfSections?.length ? ' change-logo' : ''}`}>
          <div className="grid grid-cols-12 w-full">
            <div className="col-start-1 col-span-12 md:col-start-7 md:col-span-5 slide-up-subtle">
              <ContactForm style="dark" heading={formHeading} />
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
