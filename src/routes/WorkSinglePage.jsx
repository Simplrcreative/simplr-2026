import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import { gsap } from 'gsap'
import Seo from '../components/Seo.jsx'
import { buildWorkSingleSeo } from '../lib/page-seo.js'
import RichText from '../components/RichText.jsx'
import CategoryBadge from '../components/CategoryBadge.jsx'
import { createSplitTextAnimation, createWorkImagesAnimation, createSlideUpAnimations, createNextWorkAnimation, createWorkThumbHoverAnimation, createTestimonialDotAnimation, lockScroll, unlockScroll, refreshScrollTriggers } from '../lib/animations/index.js'
import PictureImg from '../components/PictureImg.jsx'
import { initSlider } from '../lib/slider.js'
import { buildCollectionPath, buildEntryPath, getMediaSourceUrl } from '../lib/wp-api.js'

function getThumbnail(acfFeaturedThumbnail, preferredSize = 'large') {
  return getMediaSourceUrl(acfFeaturedThumbnail, preferredSize)
}

function getMediaDimensions(media) {
  const node = media?.node ?? media
  const width = Number(node?.mediaDetails?.width)
  const height = Number(node?.mediaDetails?.height)
  if (!(width > 0 && height > 0)) return null
  return { width, height }
}

/** Padding-top % for `.ratio` so space is reserved before the image/file loads. */
function getMediaAspectPadding(media, fallback = '90%') {
  const dims = getMediaDimensions(media)
  if (!dims) return fallback
  return `${(dims.height / dims.width) * 100}%`
}

function WorkMediaFrame({ media, sticky = false, children }) {
  // Sticky frames already get a fixed viewport height via `.full-image.sticky`.
  if (sticky) return children

  const padding = getMediaAspectPadding(media)
  return (
    <div
      className="ratio overflow-hidden rounded-[10px]"
      style={{
        '--aspect-ratio-desktop': padding,
        '--aspect-ratio-mobile': padding,
      }}
    >
      {children}
    </div>
  )
}

function WorkContentImage({ media, sticky = false, loaderSrc, mobileSrc, desktopSrc, altText }) {
  const dims = getMediaDimensions(media)
  return (
    <WorkMediaFrame media={media} sticky={sticky}>
      <PictureImg
        loaderSrc={loaderSrc}
        mobileSrc={mobileSrc}
        desktopSrc={desktopSrc}
        altText={altText}
        width={dims?.width}
        height={dims?.height}
        pictureClass={`full-image${sticky ? ' overflow-hidden rounded-[10px] sticky' : ''}`}
      />
    </WorkMediaFrame>
  )
}

function getSliderSource(image) {
  const sizes = image?.mediaDetails?.sizes ?? []
  return (
    sizes.find((item) => item?.name === 'large')?.sourceUrl
    ?? sizes.find((item) => item?.name === 'full')?.sourceUrl
    ?? image?.guid
    ?? sizes.find((item) => item?.sourceUrl)?.sourceUrl
    ?? ''
  )
}

function isTruthyFlag(value) {
  return ['1', 1, true, 'true'].includes(value)
}

function WorkSectionVideo({ src, poster, clickToPlay = false, className = '' }) {
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const playIconRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const isOverRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!clickToPlay) {
      setIsPlaying(true)
      return
    }

    video.pause()
    setIsPlaying(false)
  }, [clickToPlay, src])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !clickToPlay) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
    }
  }, [clickToPlay, src])

  // Mouse-follow play/close icon — same pattern as the home hero play-icon.
  // Keep hover visibility in React state so re-renders (play ↔ close) don't wipe `.active`.
  useEffect(() => {
    if (!clickToPlay) return

    const container = containerRef.current
    const playIcon = playIconRef.current
    if (!container || !playIcon) return

    const movePlayIconX = gsap.quickTo(playIcon, 'x', { duration: 0.18, ease: 'power3.out' })
    const movePlayIconY = gsap.quickTo(playIcon, 'y', { duration: 0.18, ease: 'power3.out' })

    let hasPointer = false
    let pointerX = 0
    let pointerY = 0

    const setVisible = (visible) => {
      if (visible === isOverRef.current) return
      isOverRef.current = visible
      setIsActive(visible)
    }

    const syncVisibility = () => {
      if (!hasPointer) {
        setVisible(false)
        return
      }

      const bounds = container.getBoundingClientRect()
      const over = (
        pointerX >= bounds.left
        && pointerX <= bounds.right
        && pointerY >= bounds.top
        && pointerY <= bounds.bottom
      )
      setVisible(over)
    }

    const onPointerMove = (event) => {
      hasPointer = true
      pointerX = event.clientX
      pointerY = event.clientY
      movePlayIconX(pointerX)
      movePlayIconY(pointerY)
      syncVisibility()
    }

    const onPointerLeave = () => {
      syncVisibility()
    }

    const onScrollOrResize = () => {
      syncVisibility()
    }

    document.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerleave', onPointerLeave)
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)

    return () => {
      document.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      isOverRef.current = false
      setIsActive(false)
      gsap.set(playIcon, { clearProps: 'x,y' })
    }
  }, [clickToPlay, src])

  const togglePlayback = () => {
    if (!clickToPlay) return
    const video = videoRef.current
    if (!video) return

    // Click happens while hovering — keep the icon visible across the play/close swap.
    isOverRef.current = true
    setIsActive(true)

    if (video.paused) {
      video.play().catch(() => {})
      return
    }

    video.pause()
  }

  if (!clickToPlay) {
    return (
      <div className={`work-video full-image overflow-hidden rounded-[10px]${className ? ` ${className}` : ''}`}>
        <video
          ref={videoRef}
          src={src}
          poster={poster || undefined}
          autoPlay
          muted
          loop
          playsInline
        />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`work-video full-image overflow-hidden rounded-[10px] is-click-to-play${className ? ` ${className}` : ''}`}
      onClick={togglePlayback}
      role="button"
      tabIndex={0}
      aria-label={isPlaying ? 'Pause video' : 'Play video'}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          togglePlayback()
        }
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        muted
        loop
        playsInline
      />

      <div
        ref={playIconRef}
        className={`play-icon work-video-play-icon${isPlaying ? ' is-close' : ''}${isActive ? ' active' : ''}`}
        onClick={(event) => {
          event.stopPropagation()
          togglePlayback()
        }}
        aria-hidden="true"
      >
        <div className="play-icon-inner">
          <div className="play-icon-inner-content">
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="3" y1="3" x2="19" y2="19" />
                <line x1="19" y1="3" x2="3" y2="19" />
              </svg>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 20" fill="currentColor">
                  <path d="M18 10L0 20L9.08523e-07 0L18 10Z" />
                </svg>
                <span>play video</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
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
  const linkToWebsite = work?.acfWorkBuilder?.acfLinkToWebsite ?? ''
  const swags = work?.acfWorkBuilder?.acfSwag ?? ''
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
    const stickyTexts = Array.from(document.querySelectorAll('.sticky-text'))
    const setStickyOffsets = () => {
      stickyTexts.forEach((el) => {
        el.style.setProperty('--sticky-text-offset', `${el.offsetHeight}px`)
      })
    }
    setStickyOffsets()
    window.addEventListener('resize', setStickyOffsets)
    return () => window.removeEventListener('resize', setStickyOffsets)
  }, [sections])

  useEffect(() => {
    const cleanupSplitText = createSplitTextAnimation()
    const cleanupWorkImages = createWorkImagesAnimation()
    const cleanupNextWork = createNextWorkAnimation()
    const cleanupWorkThumbHover = createWorkThumbHoverAnimation()
    const cleanupTestimonial = createTestimonialDotAnimation()
    const sliderCleanups = Array.from(document.querySelectorAll('.slider')).map((el) => initSlider(el))

    // Late-loading images can still nudge layout (fonts, sticky, etc.).
    // Debounced refresh keeps footer-off ScrollTrigger start positions honest.
    let refreshTimer = 0
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(() => refreshScrollTriggers(), 120)
    }
    const onMediaLoad = (event) => {
      const target = event.target
      if (!(target instanceof HTMLImageElement) && !(target instanceof HTMLVideoElement)) return
      if (!target.closest?.('.work-content, .featured-image, .next-work')) return
      scheduleRefresh()
    }
    document.addEventListener('load', onMediaLoad, true)

    return () => {
      cleanupSplitText?.()
      cleanupWorkImages?.()
      cleanupNextWork?.()
      cleanupWorkThumbHover?.()
      cleanupTestimonial?.()
      sliderCleanups.forEach((cleanup) => cleanup?.())
      document.removeEventListener('load', onMediaLoad, true)
      window.clearTimeout(refreshTimer)
    }
  }, [sections])

  return (
    <>
      <Seo {...seo} />
    
      {/*
        Hero + intro share one grid so .sticky-title sticks through both.
        On lg, a spacer above the title panel bottom-aligns it with the featured
        image (same height via aspect-ratio), then sticky takes over on scroll.
      */}
      <section className="work-top page-hero relative px-3 md:px-5 pb-10 md:pb-20 bg-white section-light">

        <div className="grid grid-cols-12 w-full">
          <div className="work-top-title col-start-1 col-span-12 lg:col-span-5 text-coffee">
            <div className="work-top-title-spacer" aria-hidden="true" />
            <div className="sticky-title mb-5 lg:mb-0 max-w-[50ch] lg:max-w-none lg:sticky lg:top-5 lg:self-start lg:w-full lg:flex lg:flex-col lg:justify-between">
              <div className="hero-title-container max-w-[60ch] mt-35 md:mt-20">
                <div className="eyebrow">{work?.acfWorkBuilder?.acfClient?.nodes?.[0]?.name || ''}</div>
                <h1 className="hero-title mb-10 lg:mb-0"><span>{title}</span></h1>
              </div>
              <div className="work-types-container max-w-[80%] pt-5 lg:pt-0">
                {categories.length > 0 && (
                  <div className="categories flex flex-wrap gap-1">
                    {categories.map(({ name }) => <CategoryBadge key={name} name={name} />)}
                  </div>
                )}
                {types.length > 0 && (
                  <div className="work-types mt-1 mb-5 lg:mb-0 flex flex-wrap gap-1">
                    {types.map(({ name }) => (
                      <Fragment key={name}>
                        <div className="work-type leading-none">
                          {name}
                        </div>
                      </Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="work-top-main col-start-1 col-span-12 lg:col-start-8 lg:col-span-5">
            <div className="work-top-image-stage min-h-[80vh] lg:min-h-svh flex flex-col justify-end pb-5">
              <div className="featured-image thumb-swap-trigger__">
                {loaderSrc && (
                  <div
                    className="ratio pt-[65%]! md:pt-[65%]! lg:pt-[90%]! overflow-hidden rounded-[10px] thumb-swap__"
                  >
                    <PictureImg
                      loaderSrc={secondaryLoaderSrc + '.webp'}
                      mobileSrc={secondaryMobileSrc + '.webp'}
                      desktopSrc={secondaryDesktopSrc + '.webp'}
                      imgClass="thumb-primary rounded-[10px]"
                      altText={altText}
                      lazyLoad={false}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="work-intro pt-0 md:pt-20">
              <div className="grid grid-cols-12">
                <div className="text-body col-span-12 md:col-start-4 md:col-span-8 lg:col-span-12 lg:col-start-1 trigger-split-text-coffee pb-10">
                  <RichText html={introduction} className="split-text-coffee" />
                  {linkToWebsite && (
                    <div className="mt-10">
                      <a href={linkToWebsite} target="_blank" rel="noopener noreferrer" className="btn relative alt-transition-text">
                        <span>Visit Website</span>
                      </a>
                    </div>
                  )}
                  {swags && (
                    <div className="swags mt-20 mb-10">
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
            </div>
          </div>
        </div>

        <div className="change-logo-back absolute top-0 inset-x-0 h-px" aria-hidden="true" />
        
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
        const clickToPlayVideo1 = isTruthyFlag(section?.acfClickToPlayVideo1)
        const clickToPlayVideo2 = isTruthyFlag(section?.acfClickToPlayVideo2)
        const mimeType1 = section?.acfImage1?.node?.mimeType || ''
        const mimeType2 = section?.acfImage2?.node?.mimeType || ''
        const isNativeFormat1 = mimeType1 === 'image/gif' || mimeType1 === 'image/webp'
        const isNativeFormat2 = mimeType2 === 'image/gif' || mimeType2 === 'image/webp'
        const ext1 = isNativeFormat1 ? '' : '.webp'
        const ext2 = isNativeFormat2 ? '' : '.webp'
        const fImage1Loader = getThumbnail(section?.acfImage1, 'loader') + ext1
        const fImage1Mobile = getThumbnail(section?.acfImage1, 'medium') + ext1
        const fImage1       = getThumbnail(section?.acfImage1, 'full', 'full') + ext1
        const fImage2Loader = getThumbnail(section?.acfImage2, 'loader') + ext2
        const fImage2Mobile = getThumbnail(section?.acfImage2, 'medium') + ext2
        const fImage2       = getThumbnail(section?.acfImage2, 'full', 'full') + ext2
        const altText1 = section?.acfImage1?.node?.altText || 'Untitled'
        const altText2 = section?.acfImage2?.node?.altText || 'Untitled'
        const sticky1 = ['1', 1, true, 'true'].includes(section?.acfMakeSticky1)
        const sticky2 = ['1', 1, true, 'true'].includes(section?.acfMakeSticky2)
        const stickyText1 = ['1', 1, true, 'true'].includes(section?.acfMakeStickyText1)
        const stickyText2 = ['1', 1, true, 'true'].includes(section?.acfMakeStickyText2)
        const sliderImages = section?.acfSliderImages?.nodes ?? []

        return (
          <section key={`section-${index}`} className="work-content text-body px-3 md:px-5 pb-5 change-logo">
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
                {/* IMAGE & TEXT SECTION */}
                  <div className={`col-span-12 md:col-span-4 ${txtOrder} ${stickyText1 ? '' : 'flex flex-col justify-end'} trigger-split-text-coffee`}>
                    <RichText html={content} className={`my-[2.5rem] lg:my-[5rem] split-text-coffee text-box ${stickyText1 ? 'sticky-text' : ''}`}/>
                  </div>
                  <div className={`col-span-12 md:col-span-6 ${imgOrder}`}>
                    {video1 ? (
                      <WorkSectionVideo
                        src={video1}
                        poster={fImage1Mobile}
                        clickToPlay={clickToPlayVideo1}
                        className={sticky1 ? 'sticky' : ''}
                      />
                    ) : (
                      <WorkContentImage
                        media={section?.acfImage1}
                        sticky={sticky1}
                        loaderSrc={fImage1Loader}
                        mobileSrc={fImage1Mobile}
                        desktopSrc={fImage1}
                        altText={altText1}
                      />
                    )}
                  </div>
                  {/* END IMAGE & TEXT SECTION */}
                </>
              )}
              {layout === 'Two Text Boxes' && (
                <>
                {/* TWO TEXT BOXES SECTION */}
                  <div className={`col-span-12 md:col-span-5 lg:col-span-4 flex flex-col justify-end trigger-split-text-coffee`}>
                    <RichText html={content} className={`my-[2.5rem] lg:my-[5rem] split-text-coffee text-box ${stickyText1 ? 'sticky-text' : ''}`}/>
                  </div>
                  
                  <div className={`col-start-1 col-span-12 md:col-start-8 md:col-span-5 lg:col-start-9 lg:col-span-4 flex flex-col justify-end trigger-split-text-coffee mt-5 md:mt-0`}>
                    <RichText html={content2} className={`my-[2.5rem] lg:my-[5rem] split-text-coffee text-box ${stickyText2 ? 'sticky-text' : ''}`} />
                  </div>
                  {/* END TWO TEXT BOXES SECTION */}
                </>
              )}
              {layout === 'Two Images' && (
                <>
                {/* TWO IMAGES SECTION */}
                  <div className="col-start-1 col-span-12 md:col-span-6 pb-5 md:pb-0 md:pe-2">
                    {video1 ? (
                      <WorkSectionVideo
                        src={video1}
                        poster={fImage1Mobile}
                        clickToPlay={clickToPlayVideo1}
                        className={sticky1 ? 'sticky' : ''}
                      />
                    ) : (
                      <WorkContentImage
                        media={section?.acfImage1}
                        sticky={sticky1}
                        loaderSrc={fImage1Loader}
                        mobileSrc={fImage1Mobile}
                        desktopSrc={fImage1}
                        altText={altText1}
                      />
                    )}
                  </div>
                  <div className="col-start-1 md:col-start-7 col-span-12 md:col-span-6 md:ps-2">
                    {video2 ? (
                      <WorkSectionVideo
                        src={video2}
                        poster={fImage2Mobile}
                        clickToPlay={clickToPlayVideo2}
                        className={sticky2 ? 'sticky' : ''}
                      />
                    ) : (
                      <WorkContentImage
                        media={section?.acfImage2}
                        sticky={sticky2}
                        loaderSrc={fImage2Loader}
                        mobileSrc={fImage2Mobile}
                        desktopSrc={fImage2}
                        altText={altText2}
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
                    <WorkSectionVideo
                      src={video1}
                      poster={fImage1Mobile}
                      clickToPlay={clickToPlayVideo1}
                    />
                  ) : (
                    <WorkContentImage
                      media={section?.acfImage1}
                      loaderSrc={fImage1Loader}
                      mobileSrc={fImage1Mobile}
                      desktopSrc={fImage1}
                      altText={altText1}
                    />
                  )}
                </div>
              {/* END FULL IMAGE SECTION */}
              </>
              )}
              {layout === 'Slider' && (
                <>
                {/* SLIDER SECTION */}
                <div className="slider col-span-12" aria-label="Gallery Slider">
                  {sliderImages.map((image, imageIndex) => {
                      const source = getSliderSource(image)
                      if (!source) return null

                      return (
                        <div className={`slide s${imageIndex + 1}`} key={`slider-image-${imageIndex}`}>
                          <div className="slide-img" style={{ backgroundImage: `url(${source})` }}>
                            {/*<PictureImg
                              loaderSrc={source}
                              mobileSrc={source}
                              desktopSrc={source}
                              altText=""
                              pictureClass="full-image"
                            />*/}
                          </div>
                        </div>
                      )
                    })}

                  <div className="hud">
                    <div className="count font-litera"><span data-slider-current>01</span> / <span>{String(sliderImages.length).padStart(2, '0')}</span></div>
                    <div className="bar"><i data-slider-progress></i></div>
                  </div>

                  <div className="drag-hint" data-slider-drag-hint>Drag</div>
                  <div className="cursor">
                    <div className="cursor-inner">
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M8 5L15 12L8 19" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="ring" />
                    </div>
                  </div>
                </div>
              {/* END SLIDER SECTION */}
              </>
              )}
            </div>
            
          </section>
        )
      })}

      {testimonial && (
        <section className="work-testimonial px-3 md:px-5 py-5 md:pt-40 md:pb-20">
          <div className="grid grid-cols-12">
            <div className="col-start-1 col-span-12 md:col-start-4 md:col-span-8 lg:col-start-7 lg:col-span-4 md:ps-2 slide-up-subtle">
              <div className="testimonial lead">
                <span className="testimonial-dots"><span className="testimonial-dot"></span><span className="testimonial-dot testimonial-dot-slide"></span></span>
                {testimonial.acfTestimonials?.acfTestimonial && (
                  <div 
                    className="mb-5 md:mb-10 xl:mb-20 text-bold"
                    dangerouslySetInnerHTML={{ __html: testimonial.acfTestimonials.acfTestimonial }}
                  />
                )}
                <p>
                  <b>{testimonial.acfTestimonials?.acfName || testimonial.title}</b>
                  {testimonial.acfTestimonials?.acfRole && (
                    <>
                    <br/><span className="testimonial-role">{testimonial.acfTestimonials.acfRole}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {nextWork && (
        
      <section className="next-work px-3 md:px-5 py-20 bg-white relative overflow-hidden">
        <div className="grid grid-cols-12 relative z-1">
            <div className="col-start-1 md:col-start-5 col-span-12 md:col-span-4 pt-20">
              <div className="client-work">
                <Link
                  to={buildEntryPath('work', nextWork.slug)}
                  className="client-work-img block alt-transition-img thumb-swap-trigger"
                  data-card-key={nextWork.slug}
                  data-transition-source="media"
                  data-transition-variant="work-next"
                  data-transition-snapshot-state="hover"
                >
                  <div className="ratio overflow-hidden overflow-hidden rounded-[10px] thumb-swap" style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '65%' }}>
                    <PictureImg
                      loaderSrc={nextLoaderSrc}
                      mobileSrc={nextMobileSrc}
                      desktopSrc={nextDesktopSrc}
                      imgClass='thumb-primary rounded-[10px]'
                      altText=''
                    />
                    <PictureImg
                      loaderSrc={nextLoader2Src}
                      mobileSrc={nextMobile2Src}
                      desktopSrc={nextDesktop2Src}
                      imgClass='thumb-secondary rounded-[10px]'
                      altText={nextThumbAlt}
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
