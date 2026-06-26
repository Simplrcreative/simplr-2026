import { Fragment, useEffect } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import Seo from '../components/Seo.jsx'
import { buildWorkSingleSeo } from '../lib/page-seo.js'
import RichText from '../components/RichText.jsx'
import CategoryBadge from '../components/CategoryBadge.jsx'
import { createSplitTextAnimation, createWorkImagesAnimation, createSlideUpAnimations, createNextWorkAnimation, createWorkThumbHoverAnimation, lockScroll, unlockScroll } from '../lib/animations/index.js'
import PictureImg from '../components/PictureImg.jsx'
import { buildCollectionPath, buildEntryPath } from '../lib/wp-api.js'

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

export default function WorkSinglePage() {
  const { work } = useLoaderData() ?? {}
  const title = work?.title || 'Work'
  const pathname = work?.slug ? buildEntryPath('work', work.slug) : buildCollectionPath('work')
  const categories = work?.acfWorkBuilder?.acfCategory?.nodes ?? []
  //const thumbnail = work?.thumbnail || ''
  //const thumbnail2 = work?.thumbnail2 || thumbnail
  //NEW SOURCES
  const featuredThumbnail = work?.acfWorkBuilder?.acfFeaturedThumbnail
  const loaderSrc = getThumbnail(featuredThumbnail, 'loader')
  const mobileSrc = getThumbnail(featuredThumbnail, 'medium')
  const desktopSrc = getThumbnail(featuredThumbnail, 'large')
  const secondaryThumbnail = work?.acfWorkBuilder?.acfSecondaryThumbnail || featuredThumbnail
  const secondaryLoaderSrc = getThumbnail(secondaryThumbnail, 'loader')
  const secondaryMobileSrc = getThumbnail(secondaryThumbnail, 'medium')
  const secondaryDesktopSrc = getThumbnail(secondaryThumbnail, 'large')
  //END NEW SOURCES
  const mimeType = work?.acfWorkBuilder?.acfFeaturedThumbnail?.node?.mimeType || ''
  const altText = work?.acfWorkBuilder?.acfFeaturedThumbnail?.node?.altText || title || 'Untitled'
  const types = work?.acfWorkBuilder?.acfType?.nodes ?? []
  const introduction = work?.acfWorkBuilder?.acfIntroduction ?? []
  const swags = work?.acfWorkBuilder?.acfSwag ?? []
  const sections = work?.acfWorkBuilder?.acfSections || []
  const testimonial = useLoaderData()?.testimonial ?? null
  const nextWork = useLoaderData()?.nextWork ?? null
  const nextThumbNode = nextWork?.featuredThumbnailNode || ''
  const nextThumb2Node = nextWork?.secondaryThumbnailNode || nextThumbNode
  const nextThumbAlt = nextWork?.title || 'Untitled'
  const nextLoaderSrc   = getThumbnail(nextThumbNode, 'loader') + '.webp'
  const nextMobileSrc   = getThumbnail(nextThumbNode, 'medium') + '.webp'
  const nextDesktopSrc  = getThumbnail(nextThumbNode) + '.webp'
  const nextLoader2Src  = getThumbnail(nextThumb2Node, 'loader') + '.webp'
  const nextMobile2Src  = getThumbnail(nextThumb2Node, 'medium') + '.webp'
  const nextDesktop2Src = getThumbnail(nextThumb2Node) + '.webp'

  const seo = buildWorkSingleSeo(work, pathname)

  useEffect(() => {
    if (document.documentElement.classList.contains('page-transitioning')) {
      lockScroll('work-single-dock')
      const unlock = () => { unlockScroll('work-single-dock') }
      window.addEventListener('page-transition:complete', unlock, { once: true })
      return () => {
        window.removeEventListener('page-transition:complete', unlock)
        unlockScroll('work-single-dock')
      }
    }
  }, [])

  useEffect(() => {
    const cleanupSplitText = createSplitTextAnimation()
    const cleanupWorkImages = createWorkImagesAnimation()
    const cleanupNextWork = createNextWorkAnimation()
    const cleanupWorkThumbHover = createWorkThumbHoverAnimation()
    return () => {
      cleanupSplitText?.()
      cleanupWorkImages?.()
      cleanupNextWork?.()
      cleanupWorkThumbHover?.()
    }
  }, [])

  return (
    <>
      <Seo {...seo} />
    
      <section className="page-hero px-5 pb-10 md:pb-20 bg-white section-light min-h-[80vh] flex md:items-end">
        <div className="grid grid-cols-12 w-full grid-rows-[30px_auto]">
          <div className="col-span-12 change-logo-back" aria-hidden="true" />
          <div className="col-start-1 col-span-12 md:col-span-6 text-coffee mt-40 max-w-[115ch] flex flex-col justify-between">
            <div>
              <div className="eyebrow">{work?.acfWorkBuilder?.acfClient?.nodes?.[0]?.name || ''}</div>
              <h1 className="hero-title"><span>{title}</span></h1>
            </div>
            {categories.length > 0 && (
              <div className="categories my-10 md:mt-3 md:mb-0 flex flex-wrap gap-0">
                {categories.map(({ name }) => <CategoryBadge key={name} name={name} />)}
              </div>
            )}
          </div>
          <div className="col-start-1 md:col-start-9 col-span-12 md:col-span-5">
            <div className="featured-image thumb-swap-trigger">
              {loaderSrc && (
                <div
                  className="ratio overflow-hidden rounded-[10px] thumb-swap"
                  style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '65%' }}
                >
                  <PictureImg
                    loaderSrc = {secondaryLoaderSrc + '.webp'}
                    mobileSrc = {secondaryMobileSrc + '.webp'}
                    desktopSrc = {secondaryDesktopSrc + '.webp'}
                    imgClass = 'thumb-primary rounded-[10px]'
                    altText = {altText}
                    lazyLoad = {false}
                  />
                  <PictureImg
                    loaderSrc = {loaderSrc + '.webp'}
                    mobileSrc = {mobileSrc + '.webp'}
                    desktopSrc = {desktopSrc + '.webp'}
                    imgClass = 'thumb-secondary rounded-[10px]'
                    altText = ''
                    lazyLoad = {false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="work-intro px-5 pb-10 pt-0 md:py-20 bg-white change-logo">
        <div className="grid grid-cols-12">
          <div className="work-types col-start-1 col-span-12 md:col-span-5 mb-10 md:mb-0 slide-up-subtle" data-mobile-slide="none">
             {types.map(({ name }, index) => {
              const insertBreak = (index + 1) % 3 === 0 && index < types.length - 1
              return (
                <Fragment key={name}>
                  <span className={`work-type${insertBreak ? ' work-type--line-end' : ''}`}>
                    {name}
                  </span>
                  {insertBreak && <br className="hidden md:block" />}
                </Fragment>
              )
             })}
          </div>
          <div className="col-start-1 md:col-start-8 col-span-12 md:col-span-5 trigger-split-text-coffee">
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
                    className="swag flex flex-col md:flex-row slide-up-subtle"
                  > 
                    <div className="swag-numbers flex justify-start md:justify-end items-start">
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
          imgOrder = 'order-2 col-start-1 md:col-start-7 md:ps-2 mt-5 md:mt-0'
        } else {
          txtOrder = 'order-2 col-start-1 md:col-start-9'
          imgOrder = 'order-1 col-start-1 md:pe-2'
        }
        const content = section?.acfContent || ''
        const content2 = section?.acfContent2 || ''
        const video1 = section?.acfVideo1?.node?.guid || ''
        const video2 = section?.acfVideo2?.node?.guid || ''
        const mimeType1 = section?.acfImage1?.node?.mimeType || ''
        const mimeType2 = section?.acfImage2?.node?.mimeType || ''
        const isGif1 = mimeType1 === 'image/gif'
        const isGif2 = mimeType2 === 'image/gif'
        const ext1 = isGif1 ? '' : '.webp'
        const ext2 = isGif2 ? '' : '.webp'
        const fImage1Loader = getThumbnail(section?.acfImage1, 'loader') + ext1
        const fImage1Mobile = getThumbnail(section?.acfImage1, 'medium') + ext1
        const fImage1       = getThumbnail(section?.acfImage1) + ext1
        const fImage2Loader = getThumbnail(section?.acfImage2, 'loader') + ext2
        const fImage2Mobile = getThumbnail(section?.acfImage2, 'medium') + ext2
        const fImage2       = getThumbnail(section?.acfImage2) + ext2
        const altText1 = section?.acfImage1?.node?.altText || 'Untitled'
        const altText2 = section?.acfImage2?.node?.altText || 'Untitled'

        return (
          <section key={`section-${index}`} className="work-content px-5 pb-5">
            <div className="grid grid-cols-12">
              {layout === 'Text Only' && (
                <>
                {/* TEXT ONLY SECTION */}
                  <div className="col-start-1 md:col-start-2 col-span-12 md:col-span-10 py-10 md:pt-18 md:pb-20 trigger-split-text-coffee">
                    <RichText html={content} className="text-only-section split-text-coffee text-center" />
                  </div>
                {/* END TEXT ONLY SECTION */}
                </>
              )}
              {layout === 'Image & Text' && (
                <>
                {/* IMAGE &TEXT SECTION */}
                  <div className={`col-span-12 md:col-span-4 ${txtOrder} flex flex-col justify-end trigger-split-text-coffee mt-8 md:mt-0`}>
                    <RichText html={content} className="split-text-coffee"/>
                  </div>
                  <div className={`col-span-12 md:col-span-6 ${imgOrder}`}>
                    {video1 ? (
                      <div className="full-image overflow-hidden rounded-[10px]">
                        <video
                          src={video1}
                          poster={fImage1Mobile || undefined}
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      </div>
                    ) : (
                      <PictureImg
                        loaderSrc={fImage1Loader}
                        mobileSrc={fImage1Mobile}
                        desktopSrc={fImage1}
                        altText={altText1}
                        pictureClass="full-image overflow-hidden rounded-[10px]"
                      />
                    )}
                  </div>
                  {/* END IMAGE &TEXT SECTION */}
                </>
              )}
              {layout === 'Two Text Boxes' && (
                <>
                {/* TWO TEXT BOXES SECTION */}
                  <div className={`col-span-12 md:col-span-4 flex flex-col justify-end trigger-split-text-coffee`}>
                    <RichText html={content} className="split-text-coffee"/>
                  </div>
                  
                  <div className={`col-start-1 md:col-start-9 col-span-12 md:col-span-4 flex flex-col justify-end trigger-split-text-coffee mt-5 md:mt-0`}>
                    <RichText html={content2} className="split-text-coffee"/>
                  </div>
                  {/* END TWO TEXT BOXES SECTION */}
                </>
              )}
              {layout === 'Two Images' && (
                <>
                {/* TWO IMAGES SECTION */}
                  <div className="col-start-1 col-span-12 md:col-span-6 pb-5 md:pb-0 md:pe-2">
                    {video1 ? (
                      <div className="full-image overflow-hidden rounded-[10px]">
                        <video
                          src={video1}
                          poster={fImage1Mobile || undefined}
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      </div>
                    ) : (
                      <PictureImg
                        loaderSrc={fImage1Loader}
                        mobileSrc={fImage1Mobile}
                        desktopSrc={fImage1}
                        altText={altText1}
                        pictureClass="full-image overflow-hidden rounded-[10px]"
                      />
                    )}
                  </div>
                  <div className="col-start-1 md:col-start-7 col-span-12 md:col-span-6 md:ps-2">
                    {video2 ? (
                      <div className="full-image overflow-hidden rounded-[10px]">
                        <video
                          src={video2}
                          poster={fImage2Mobile || undefined}
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      </div>
                    ) : (
                      <PictureImg
                        loaderSrc={fImage2Loader}
                        mobileSrc={fImage2Mobile}
                        desktopSrc={fImage2}
                        altText={altText2}
                        pictureClass="full-image overflow-hidden rounded-[10px]"
                      />
                    )}
                  </div>
                  {/* END TWO IMAGES SECTION */}
                </>
              )}
              {layout === 'Full Image' && (
                <>
                {/* FULL IMAGE SECTION */}
                <div className="col-span-12">
                  {video1 ? (
                    <div className="full-image overflow-hidden rounded-[10px]">
                      <video
                        src={video1}
                        poster={fImage1Mobile || undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    </div>
                  ) : (
                    <PictureImg
                      loaderSrc={fImage1Loader}
                      mobileSrc={fImage1Mobile}
                      desktopSrc={fImage1}
                      altText={altText1}
                      pictureClass="full-image overflow-hidden rounded-[10px]"
                    />
                  )}
                </div>
              {/* END FULL IMAGE SECTION */}
              </>
              )}
            </div>
            
          </section>
        )
      })}

      {testimonial && (
        <section className="work-testimonial px-5 py-5 md:pt-40 md:pb-20">
          <div className="grid grid-cols-12">
            <div className="col-start-1 md:col-start-7 col-span-12 md:col-span-4 md:ps-2 slide-up-subtle">
              {testimonial.acfTestimonials?.acfTestimonial && (
                <blockquote
                  className="testimonial-quote mb-5 md:mb-10"
                  dangerouslySetInnerHTML={{ __html: testimonial.acfTestimonials.acfTestimonial }}
                />
              )}
              <cite className="testimonial-cite">
                <strong>{testimonial.title}</strong>
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
        
      <section className="next-work px-5 py-20 bg-white relative overflow-hidden">
        <div className="grid grid-cols-12 relative z-1">
            <div className="col-start-1 md:col-start-5 col-span-12 md:col-span-4 pt-20">
              <div className="client-work">
                <Link
                  to={buildEntryPath('work', nextWork.slug)}
                  className="client-work-img block alt-transition-img thumb-swap-trigger"
                  data-card-key={nextWork.slug}
                  data-transition-source="media"
                  data-transition-variant="work-next"
                >
                  <div className="ratio overflow-hidden overflow-hidden rounded-[10px] thumb-swap" style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '65%' }}>
                    <PictureImg
                      loaderSrc={nextLoaderSrc}
                      mobileSrc={nextMobileSrc}
                      desktopSrc={nextDesktopSrc}
                      imgClass='thumb-primary rounded-[10px]'
                      altText={nextThumbAlt}
                    />
                    <PictureImg
                      loaderSrc={nextLoader2Src}
                      mobileSrc={nextMobile2Src}
                      desktopSrc={nextDesktop2Src}
                      imgClass='thumb-secondary rounded-[10px]'
                      altText=''
                    />
                  </div>
            
                </Link>
              </div>
              <div className="work-featured__meta mt-3">
                  <h3 className="work-card__title alt-transition-txt mb-3">{nextWork.client}</h3>
                  {nextWork.categories.length > 0 && (
                    <div className="work-card__">
                      {nextWork.categories.map(({ name }) => <CategoryBadge key={name} name={name} />)}
                    </div>
                  )}
                </div>
            </div>
        </div>
        <div className="next-title-wrapper ">
          <div className="next-title text-coffee md:min-h-[600px]">
            Next Case Study
          </div>
        </div>
      </section>
      )}
    </>
  )
}
