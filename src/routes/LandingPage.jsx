import { useEffect, useRef, useState } from 'react'
import { Link, useLoaderData, useLocation } from 'react-router-dom'
import Seo from '../components/Seo.jsx'
import { createSplitTextAnimation, refreshScrollTriggers, createSlideUpAnimations, createParallaxAnimations, createBtnHoverAnimation } from '../lib/animations/index.js'
import RichText from '../components/RichText.jsx'
import RichHeading from '../components/RichHeading.jsx'
import ContactForm from '../components/ContactForm.jsx'

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
    const cleanupSlideUp = createSlideUpAnimations(pageRef.current)
    const cleanupParallax = createParallaxAnimations(pageRef.current)
    const cleanupSplitText = createSplitTextAnimation()
    refreshScrollTriggers()

    return () => {
      cleanupSlideUp?.()
      cleanupSplitText?.()
      cleanupParallax?.()
    }
  }, [])

  return (
    <div ref={pageRef}>
      <Seo
        title={title || 'Thinking'}
        description=""
        pathname={pathname}
      />

      <section className="post-hero px-3 md:px-5 py-10 md:py-20 bg-white section-light min-h-[80vh] flex items-end">
        <div className="grid grid-cols-12 w-full">
          <div className="col-span-12 change-logo-back" />
          <div className="col-span-12 md:col-span-5 text-coffee change-logo mt-30 md:mt-20 change-logo max-w-[90ch]">
              <div className="eyebrow">{title}</div>
              <h1 className="hero-title"><span>{headline}</span></h1>
              <div className="mt-10 max-w-[70ch]">
                <RichText html={introduction} />
              </div>
          </div>
          <div className="col-start-6 col-span-7 parallax">
            <div className="featured-image">
              {featuredVideo ? (
                <div
                  className="ratio overflow-hidden rounded-[10px]"
                  style={{ '--aspect-ratio-desktop': '54%', '--aspect-ratio-mobile': '54%' }}
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
              ) : featuredImage ? (
                <picture
                  className="ratio overflow-hidden rounded-[10px]"
                  style={{ '--aspect-ratio-desktop': '54%', '--aspect-ratio-mobile': '54%' }}
                >
                  <source srcSet={`${featuredImage}.webp`} type="image/webp" />
                  <img src={`${featuredImage}.webp`} alt={title} />
                </picture>
              ) : null}
            </div>
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
          <section key={`section-${sectionIndex}`} className="px-3 md:px-5 py-10 md:py-20 bg-white section-light">
            <div className="grid grid-cols-12 w-full">
              {sectionHeading && (
                <div className="col-span-12 lg:col-span-6 max-w-[70ch] mb-5 lg:mb-0 slide-up-subtle">
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
        <section className="px-3 md:px-5 pt-10 md:pt-20">
          <div className="grid grid-cols-12 w-full">
            <div className="col-start-1 col-span-12 md:col-start-8 md:col-span-5 slide-up-subtle">
              <ContactForm style="dark" heading="This is a cool heading" />
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
