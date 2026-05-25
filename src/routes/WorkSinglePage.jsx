import { Fragment, useEffect } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import Seo from '../components/Seo.jsx'
import RichText from '../components/RichText.jsx'
import CategoryBadge from '../components/CategoryBadge.jsx'
import { createSplitTextAnimation, createWorkImagesAnimation, createSlideUpAnimations, createNextWorkAnimation } from '../lib/animations/index.js'


export default function WorkSinglePage() {
  const { work } = useLoaderData() ?? {}
  const title = work?.title || 'Work'
  const pathname = work?.slug ? `/work/${work.slug}` : '/work'
  const categories = work?.acfWorkBuilder?.acfCategory?.nodes ?? []
  const thumbnail = work?.thumbnail || ''
  const types = work?.acfWorkBuilder?.acfType?.nodes ?? []
  const introduction = work?.acfWorkBuilder?.acfIntroduction ?? []
  const swags = work?.acfWorkBuilder?.acfSwag ?? []
  const sections = work?.acfWorkBuilder?.acfSections || []
  const testimonial = useLoaderData()?.testimonial ?? null
  const nextWork = useLoaderData()?.nextWork ?? null

  useEffect(() => {
    // Lock scroll during the featured-image dock transition; unlock on completion.
    if (document.documentElement.classList.contains('page-transitioning')) {
      document.documentElement.style.overflowY = 'hidden'
      const unlock = () => { document.documentElement.style.overflowY = '' }
      window.addEventListener('page-transition:complete', unlock, { once: true })
      return () => {
        window.removeEventListener('page-transition:complete', unlock)
        document.documentElement.style.overflowY = ''
      }
    }
  }, [])

  useEffect(() => {
    const cleanupSplitText = createSplitTextAnimation()
    const cleanupWorkImages = createWorkImagesAnimation()
    const cleanupNextWork = createNextWorkAnimation()
    return () => {
      cleanupSplitText?.()
      cleanupWorkImages?.()
      cleanupNextWork?.()
    }
  }, [])

  return (
    <>
      <Seo
        title={title}
        description=""
        pathname={pathname}
      />
    
      <section className="page-hero px-5 pb-20 bg-white section-light min-h-screen flex items-end">
        <div className="grid grid-cols-12 ">
          <div className="col-span-12 change-logo-back" />
          <div className="col-start-1 col-span-5 text-coffee mt-40 max-w-[115ch] flex flex-col justify-between">
            <div>
              <div className="eyebrow">{work?.acfWorkBuilder?.acfClient?.nodes?.[0]?.name || ''}</div>
              <h1 className="hero-title"><span>{title}</span></h1>
            </div>
            {categories.length > 0 && (
              <div className="categories mt-3 flex flex-wrap gap-0">
                {categories.map(({ name }) => <CategoryBadge key={name} name={name} />)}
              </div>
            )}
          </div>
          <div className="col-start-8 col-span-5 change-logo">
            <div className="featured-image section-dark">
              {thumbnail && (
                <picture
                  className="ratio overflow-hidden rounded-[10px]"
                  style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '90%' }}
                >
                  <img src={thumbnail} alt={title} />
                </picture>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="work-intro px-5 py-20 bg-white section-light">
        <div className="grid grid-cols-12">
          <div className="work-types col-start-1 col-span-5 slide-up-subtle">
             {types.map(({ name }, index) => {
              const insertBreak = (index + 1) % 3 === 0 && index < types.length - 1
              return (
                <Fragment key={name}>
                  <span className={`work-type${insertBreak ? ' work-type--line-end' : ''}`}>
                    {name}
                  </span>
                  {insertBreak && <br />}
                </Fragment>
              )
             })}
          </div>
          <div className="col-start-8 col-span-5 trigger-split-text-coffee">
            <RichText html={introduction} className="split-text-coffee"/>
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
                    className="swag flex slide-up-subtle"
                  >
                    <div className="flex items-start">
                      {preUnit && (
                        <span className="swag-unit pre">{preUnit}</span>
                      )}
                      {number && (
                        <span className="swag-number">{number}</span>
                      )}
                      {postUnit && (
                        <span className="swag-unit">{postUnit}</span>
                      )}
                    </div>
                    {detail && (
                      <div className="swag-detail">
                        {detail}
                      </div>
                    )}
                  </div>
                )
              })}
              </div>
             )}
          </div>
        </div>
      </section>
      
      {Array.isArray(sections) && sections.map((section, index) => {
        const layout = section?.acfLayout || ''
        const alignment = section?.acfAlignment || ''
        let txtOrder, imgOrder
        if (alignment === 'right') {
          txtOrder = 'order-1 col-start-1'
          imgOrder = 'order-2 col-start-7 ps-2 section-dark'
        } else {
          txtOrder = 'order-2 col-start-9 section-light'
          imgOrder = 'order-1 col-start-1 pe-2'
        }
        const content = section?.acfContent || ''
        const video1 = section?.acfVideo1?.node?.guid || ''
        const video2 = section?.acfVideo2?.node?.guid || ''
        const getSizeUrl = (field) =>
          field?.node?.mediaDetails?.sizes?.find((s) => s.name === 'large')?.sourceUrl
          || field?.node?.guid
          || ''
        const image1 = getSizeUrl(section?.acfImage1)
        const image2 = getSizeUrl(section?.acfImage2)
     


        return (
          <section key={`section-${index}`} className="work-content px-5 pb-5">
            <div className="grid grid-cols-12">
              {layout === 'Text Only' && (
                <div className="col-start-2 col-span-10 section-light pt-18 pb-20 trigger-split-text-coffee">
                  <RichText html={content} className="text-only-section split-text-coffee text-center" />
                </div>
              )}
              {layout === 'Image & Text' && (
                <>
                  <div className={`col-span-4 ${txtOrder} flex flex-col justify-end trigger-split-text-coffee`}>
                    <RichText html={content} className="split-text-coffee"/>
                  </div>
                  <div className={`col-span-6 ${imgOrder}`}>
                    {video1 ? (
                      <div className="ratio overflow-hidden rounded-[10px]" style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '90%' }}>
                        <video
                          src={video1}
                          poster={image1 || undefined}
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      </div>
                    ) : (
                      <picture className="ratio overflow-hidden rounded-[10px]" style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '90%' }}>
                        {image1 && <img src={image1} alt="" />}
                      </picture>
                    )}
                  </div>
                </>
              )}
              {layout === 'Two Images' && (
                <>
                  <div className="col-start-1 col-span-6 pe-2">
                    {video1 ? (
                      <div className="ratio overflow-hidden rounded-[10px]" style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '90%' }}>
                        <video
                          src={video1}
                          poster={image1 || undefined}
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      </div>
                    ) : (
                      <picture className="ratio overflow-hidden rounded-[10px]" style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '90%' }}>
                        {image1 && <img src={image1} alt="" />}
                      </picture>
                    )}
                  </div>
                  <div className="col-start-7 col-span-6 ps-2 section-dark">
                    {video2 ? (
                      <div className="ratio overflow-hidden rounded-[10px]" style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '90%' }}>
                        <video
                          src={video2}
                          poster={image2 || undefined}
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      </div>
                    ) : (
                      <picture className="ratio overflow-hidden rounded-[10px]" style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '90%' }}>
                        {image2 && <img src={image2} alt="" />}
                      </picture>
                    )}
                  </div>
                </>
              )}
              {layout === 'Full Image' && (
                <div className="col-span-12 section-dark">
                  {video1 ? (
                    <div className="ratio overflow-hidden rounded-[10px]" style={{ '--aspect-ratio-desktop': '54%', '--aspect-ratio-mobile': '54%' }}>
                      <video
                        src={video1}
                        poster={image1 || undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    </div>
                  ) : (
                    <picture className="ratio overflow-hidden rounded-[10px]" style={{ '--aspect-ratio-desktop': '54%', '--aspect-ratio-mobile': '54%' }}>
                      {image1 && <img src={image1} alt="" />}
                    </picture>
                  )}
                </div>
              )}
            </div>
          </section>
        )
      })}

      {testimonial && (
        <section className="work-testimonial px-5 pt-40 pb-20 section-light">
          <div className="grid grid-cols-12">
            <div className="col-start-7 col-span-4 ps-2 slide-up-subtle">
              {testimonial.acfTestimonials?.acfTestimonial && (
                <blockquote
                  className="testimonial-quote mb-10"
                  dangerouslySetInnerHTML={{ __html: testimonial.acfTestimonials.acfTestimonial }}
                />
              )}
              <cite className="testimonial-cite">
                {testimonial.title}
                {testimonial.acfTestimonials?.acfRole && (
                  <>
                  <br/><span className="testimonial-role">{testimonial.acfTestimonials.acfRole}</span>
                  </>
                )}
              </cite>
            </div>
          </div>
        </section>
      )}

      {nextWork && (
      <section className="next-work px-5 py-20 bg-white section-light relative overflow-hidden__">
        <div className="grid grid-cols-12 relative z-1">
            <div className="col-start-5 col-span-4 pt-20">
              <div className="client-work">
                <Link
                  to={`/work/${nextWork.slug}`}
                  className="client-work-img overflow-hidden rounded-[10px] block alt-transition-img"
                  data-card-key={nextWork.slug}
                  data-transition-variant="work-next"
                >
                  <picture
                    className="ratio overflow-hidden"
                    style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '90%' }}
                  >
                    {nextWork.thumbnail && <img src={nextWork.thumbnail} alt={nextWork.title} />}
                  </picture>
                  
                </Link>
              </div>
              <div className="work-featured__meta mt-3">
                  <h3 className="work-card__title alt-transition-txt">{nextWork.client}</h3>
                  {nextWork.categories.length > 0 && (
                    <div className="work-card__categories mt-3 flex flex-wrap gap-2">
                      {nextWork.categories.map(({ name }) => <CategoryBadge key={name} name={name} />)}
                    </div>
                  )}
                </div>
            </div>
        </div>
        <div className="next-title-wrapper ">
          <div className="next-title text-coffee min-h-[600px]" >
            Next Case Study
          </div>
        </div>
      </section>
      )}
    </>
  )
}
