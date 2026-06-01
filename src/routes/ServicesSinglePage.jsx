import { useEffect, useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import CategoryBadge from '../components/CategoryBadge.jsx'
import RichHeading from '../components/RichHeading.jsx'
import RichText from '../components/RichText.jsx'
import Seo from '../components/Seo.jsx'
import { createSplitTextAnimation, refreshScrollTriggers, createSlideUpAnimations } from '../lib/animations/index.js'
import { breadcrumbSchema, webPageSchema } from '../lib/seo.js'

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

export default function ServicesSinglePage() {
  const { slug, page } = useLoaderData() ?? {}
  const service = page?.acfServiceBuilder ?? null
  const { acfHeading, acfSections } = service ?? {}
  const title = page?.title || service?.acfTitle || service?.acfService || slug || ''
  const featuredVideo = page?.acfServiceBuilder?.acfFeaturedVideo?.node?.guid || ''
  const featuredImage = page?.acfServiceBuilder?.acfFeaturedImage?.node?.guid || ''
  const accentColor = getServiceColor(service?.acfService || title || slug)
  const pathname = `/services/${slug}`
  const description = acfHeading || ''
  const [openAccordions, setOpenAccordions] = useState({})
  const testimonial = service?.acfTestimonial?.nodes?.[0] || ''
  const testimonialData = testimonial?.acfTestimonials || ''
  const caseStudies = service?.acfCaseStudy?.nodes || []
  const caseStudy = caseStudies[0] || ''
  const caseStudyData = caseStudy?.acfWorkBuilder || ''
  const caseStudyImage = caseStudyData?.acfFeaturedThumbnail?.node?.guid || ''
  const caseStudyClient = caseStudyData?.acfClient?.nodes?.[0]?.name || ''
  const caseStudyCategories = caseStudyData?.acfCategory?.nodes ?? []

  useEffect(() => {
    const cleanupSlideUp = createSlideUpAnimations(document.body)
    const cleanupSplitText = createSplitTextAnimation()
    refreshScrollTriggers()

    return () => {
      cleanupSlideUp?.()
      cleanupSplitText?.()
    }
  }, [acfSections, testimonial])

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
    <>
      <Seo
        title={title}
        description={description}
        pathname={pathname}
        schema={[
          webPageSchema({
            pathname,
            title,
            description,
            type: 'WebPage',
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
            { name: title, path: pathname },
          ]),
        ]}
      />

      <section className="page-hero px-5 pb-5 mb-15 bg-white section-light min-h-screen flex items-end">
        <div className="grid grid-cols-12 w-full">
          <div className="col-span-12 change-logo-back" />
          <div className="col-span-6 text-coffee change-logo">
            <div className="service-card__label mb-5">
                <ServiceLabelIcon color={accentColor} />
                <span className="service-card__label-text">{title}</span>
            </div>
            <h1 className="hero-title">{acfHeading}</h1>
          </div>
          <div className="col-start-8 col-span-5">
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

      {acfSections?.map((section, sectionIndex) => {
        const sectionHeading = section?.acfSectionHeading || ''
        const sectionContent = section?.acfSectionContent || ''
        const sectionAccordion = section?.acfAccordion || []

        if (!sectionHeading && !sectionContent && sectionAccordion.length === 0) {
          return null
        }

        return (
          <section key={`section-${sectionIndex}`} className="px-5 py-20 bg-white section-light">
            <div className="grid grid-cols-12 ">
              {sectionHeading && (
                <div className="col-span-9 pe-40 slide-up-subtle">
                  <RichHeading as="h2" html={sectionHeading} className="service-section-heading" />
                </div>
              )}
              {sectionContent && (
                <div className="col-start-4 col-span-5 slide-up-subtle">
                  <RichText html={sectionContent} className="service-richtext pt-20" />
                </div>
              )}
              {sectionAccordion.length > 0 && (
                <div className="col-start-4 col-span-5 pt-20 service-accordion-list">
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
                    <picture className="ratio overflow-hidden rounded-[10px]" style={{'--aspect-ratio-desktop':'90%', '--aspect-ratio-mobile':'90%'}}>
                      <img src={caseStudyImage} title="Satalia" />
                    </picture>
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
            <div className="col-start-1 md:col-start-8 col-span-12 md:col-span-4 order-1 md:order-2 flex flex-col items-center justify-center trigger-split-text-coffee">
              <div className="testimonial lead max-w-[38ch]">
                <div className="split-text-coffee trigger-split-text-coffee">
                  <div className="mb-20"><RichText html={testimonialData.acfTestimonial} /></div>
                  <div><b>{testimonial.title}</b><br/>{testimonialData.acfRole}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
