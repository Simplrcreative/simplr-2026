import { useEffect, useLayoutEffect, useRef, useState, lazy, Suspense } from 'react'
import { useLoaderData, useOutletContext, Link } from 'react-router-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Seo from '../components/Seo.jsx'
import { routeDefinitions } from '../config/site.js'
import { createHeroScrollAnimation, createServicesScrollAnimation, createBtnHoverAnimation, createCaseStudiesScrollAnimation, createSplitTextAnimation, refreshScrollTriggers, createSurfaceColorTransitions, createIntroHeroTitleAnimation, createIntroVideoAnimation, setIntroHeroInitialState, createSlideUpAnimations, lockScroll, unlockScroll, createWorkThumbHoverAnimation } from '../lib/animations/index.js'
import { buildEntryPath, prefetchWorkEntry } from '../lib/wp-api.js'
import {
  breadcrumbSchema,
  collectionSchema,
  faqSchema,
  normaliseDescription,
  serviceCatalogSchema,
  webPageSchema,
} from '../lib/seo.js'
import CategoryBadge from '../components/CategoryBadge.jsx'
import RichText from '../components/RichText.jsx'
import PictureImg from '../components/PictureImg.jsx'

const LazyClientLogos = lazy(() => import('../components/ClientLogos.jsx'))
const HOME_SCROLL_INIT_DELAY_MS = 200
const HOME_SCROLL_INIT_AFTER_INTRO_MS = 1400
const HOME_NAV_INTRO_START_EVENT = 'home-nav:intro-start'
const HOME_HERO_TITLE_INTRO_EVENT = 'home-hero:title-intro-start'
const HOME_HERO_VIDEO_INTRO_EVENT = 'home-hero:video-intro-start'
const HOME_HERO_TITLE_AFTER_NAV_MS = 300
const HOME_HERO_VIDEO_AFTER_NAV_MS = 350
const HOME_HERO_INTRO_GLOBAL_FALLBACK_MS = 500
const HERO_MODAL_FADE_DURATION_MS = 600
const HERO_MODAL_POST_SCROLL_DELAY_MS = 100
const HERO_MODAL_ENTER_FRAME_DELAY_MS = 32
const HERO_MODAL_SCROLL_DURATION_MS = 800
const HERO_MODAL_CONTENT_FADE_DURATION_MS = 600
const PLAY_ICON_DISABLE_ATTR = 'data-play-icon-disabled'
const PLAY_ICON_CLOSE_ATTR = 'data-play-icon-close'

const HOME_PAGE_FALLBACK = {
  page: {
    title: 'Home',
    intro: '',
    faqs: [],
    services: [],
    workShowcase: {
      title: '',
      intro: '',
    },
    heroVideoLoop: '',
    heroVideoFull: '',
    heroVideoPoster: '',
    heroVideoPosterAlt: 'Hero video poster',
  },
  featuredWork: [],
  caseStudies: [],
  testimonialBlock: null,
}

function HomePageContent({ page, featuredWork, caseStudies = [], testimonialBlock = null }) {
  const pageRef = useRef(null)
  const heroRef = useRef(null)
  const heroVideoRef = useRef(null)
  const heroVideoModalRef = useRef(null)
  const openHeroModalTimeoutRef = useRef(null)
  const openHeroModalPlaybackTimeoutRef = useRef(null)
  const closeHeroModalTimeoutRef = useRef(null)
  const openHeroModalScrollCleanupRef = useRef(null)
  const servicesRef = useRef(null)
  const caseStudiesRef = useRef(null)
  const clientsRef = useRef(null)
  const btnRef = useRef(null)
  const faqSliderRef = useRef(null)
  const faqButtonRefs = useRef([])
  const introAnimationsPlayedRef = useRef(false)
  const {
    introComplete = false,
    shouldRunHomeIntroAnimations = false,
  } = useOutletContext() || {}
  const faqs = page.faqs ?? []
  const heroVideoLoop = page.heroVideoLoop ?? ''
  const heroVideoFull = page.heroVideoFull ?? ''
  const heroVideoPoster = page.heroVideoPoster ?? ''
  const heroVideoPosterAlt = page.heroVideoPosterAlt ?? 'Hero video poster'
  const hasHeroFullVideo = Boolean(heroVideoFull)

  const [activeFaqIndex, setActiveFaqIndex] = useState(0)
  const [isHeroModalMounted, setIsHeroModalMounted] = useState(false)
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false)
  const [isHeroModalPlaybackReady, setIsHeroModalPlaybackReady] = useState(false)
  const isHeroModalVisible = isHeroModalMounted

  // Set up surface colour transitions immediately — elements exist now that HomePageContent
  // has mounted (homeData is deferred, so TransitionFrame's PAGE_TRANSITION_COMPLETE_EVENT
  // fires before this component renders and finds nothing).
  useEffect(() => {
    return createSurfaceColorTransitions(document.documentElement)
  }, [])

  // Stage hero title/video while loader is active so they don't flash before intro animation.
  useLayoutEffect(() => {
    if (introAnimationsPlayedRef.current) return
    if (!shouldRunHomeIntroAnimations && introComplete) return
    setIntroHeroInitialState(heroRef.current)
  }, [introComplete, shouldRunHomeIntroAnimations])

  // Run animations only after the intro loader has finished
  useEffect(() => {
    if (!introComplete) return
    let destroyHeroAnimation = () => {}
    let destroyServicesAnimation = () => {}
    let destroyShowreelAnimation = () => {}
    let destroyBtnAnimation = () => {}
    const shouldWaitForHeroIntro = shouldRunHomeIntroAnimations && !introAnimationsPlayedRef.current
    const timer = setTimeout(() => {
      destroyHeroAnimation = createHeroScrollAnimation(heroRef.current) ?? (() => {})
      destroyServicesAnimation = createServicesScrollAnimation(servicesRef.current) ?? (() => {})
      //destroyShowreelAnimation = createShowreelScrollAnimation(heroRef.current) ?? (() => {})
      destroyBtnAnimation = createBtnHoverAnimation(btnRef.current) ?? (() => {})
    }, shouldWaitForHeroIntro ? HOME_SCROLL_INIT_AFTER_INTRO_MS : HOME_SCROLL_INIT_DELAY_MS)
    return () => {
      clearTimeout(timer)
      destroyHeroAnimation()
      destroyServicesAnimation()
      //destroyShowreelAnimation()
      destroyBtnAnimation()
    }
  }, [introComplete, shouldRunHomeIntroAnimations])

  // Case studies are deferred with homeData; initialize this animation separately
  // so it can start once case studies actually exist.
  useEffect(() => {
    if (!introComplete || !caseStudies?.length) return

    let destroyCaseStudiesAnimation = () => {}
    const shouldWaitForHeroIntro = shouldRunHomeIntroAnimations && !introAnimationsPlayedRef.current
    const timer = setTimeout(() => {
      destroyCaseStudiesAnimation = createCaseStudiesScrollAnimation(caseStudiesRef.current) ?? (() => {})
    }, shouldWaitForHeroIntro ? HOME_SCROLL_INIT_AFTER_INTRO_MS : HOME_SCROLL_INIT_DELAY_MS)

    return () => {
      clearTimeout(timer)
      destroyCaseStudiesAnimation()
    }
  }, [introComplete, shouldRunHomeIntroAnimations, caseStudies?.length])

  // Lock scroll for the full duration of the intro sequence so the user can't
  // scroll past the hero before animations have initialised.
  useEffect(() => {
    if (!introComplete || !shouldRunHomeIntroAnimations || introAnimationsPlayedRef.current) return

    lockScroll('home-intro-sequence')
    const timer = setTimeout(() => {
      unlockScroll('home-intro-sequence')
    }, HOME_SCROLL_INIT_AFTER_INTRO_MS)

    return () => {
      clearTimeout(timer)
      unlockScroll('home-intro-sequence')
    }
  }, [introComplete, shouldRunHomeIntroAnimations])

  // Run hero entrance animations exactly once after the intro sequence.
  useEffect(() => {
    if (!introComplete || !shouldRunHomeIntroAnimations || introAnimationsPlayedRef.current) return

    let destroyHeroTitleIntro = () => {}
    let destroyVideoIntro = () => {}
    let titleTimer = 0
    let videoTimer = 0
    let globalFallbackTimer = 0
    let titleStarted = false
    let videoStarted = false
    let hasScheduled = false

    const startTitleIntro = () => {
      if (titleStarted) return
      titleStarted = true
      introAnimationsPlayedRef.current = true
      destroyHeroTitleIntro = createIntroHeroTitleAnimation(heroRef.current, 0)
    }

    const startVideoIntro = () => {
      if (videoStarted) return
      videoStarted = true
      introAnimationsPlayedRef.current = true
      destroyVideoIntro = createIntroVideoAnimation(heroRef.current, 0)
    }

    const scheduleFromNavStart = (navStartTimestamp = performance.now()) => {
      if (hasScheduled) return
      hasScheduled = true
      introAnimationsPlayedRef.current = true

      const elapsedMs = Math.max(0, performance.now() - navStartTimestamp)
      const titleDelayMs = Math.max(0, HOME_HERO_TITLE_AFTER_NAV_MS - elapsedMs)
      const videoDelayMs = Math.max(0, HOME_HERO_VIDEO_AFTER_NAV_MS - elapsedMs)

      titleTimer = window.setTimeout(startTitleIntro, titleDelayMs)
      videoTimer = window.setTimeout(startVideoIntro, videoDelayMs)
    }

    const handleNavIntroStart = () => {
      const navStartTimestamp = Number(window.__homeNavIntroStartedAt)
      scheduleFromNavStart(Number.isFinite(navStartTimestamp) ? navStartTimestamp : performance.now())
    }

    window.addEventListener(HOME_NAV_INTRO_START_EVENT, handleNavIntroStart, { once: true })
    window.addEventListener(HOME_HERO_TITLE_INTRO_EVENT, startTitleIntro, { once: true })
    window.addEventListener(HOME_HERO_VIDEO_INTRO_EVENT, startVideoIntro, { once: true })

    const navStartTimestamp = Number(window.__homeNavIntroStartedAt)
    if (Number.isFinite(navStartTimestamp)) {
      scheduleFromNavStart(navStartTimestamp)
    }

    globalFallbackTimer = window.setTimeout(() => {
      scheduleFromNavStart(performance.now())
    }, HOME_HERO_INTRO_GLOBAL_FALLBACK_MS)

    return () => {
      window.removeEventListener(HOME_NAV_INTRO_START_EVENT, handleNavIntroStart)
      window.removeEventListener(HOME_HERO_TITLE_INTRO_EVENT, startTitleIntro)
      window.removeEventListener(HOME_HERO_VIDEO_INTRO_EVENT, startVideoIntro)
      window.clearTimeout(titleTimer)
      window.clearTimeout(videoTimer)
      window.clearTimeout(globalFallbackTimer)
      if (!titleStarted && !videoStarted) {
        introAnimationsPlayedRef.current = false
      }
      destroyHeroTitleIntro?.()
      destroyVideoIntro?.()
    }
  }, [introComplete, shouldRunHomeIntroAnimations])

  // SplitText animations — wait for intro to complete
  useEffect(() => {
    if (!introComplete) return
    return createSplitTextAnimation()
  }, [introComplete])

  // Slide-up / slide-from-left animations — content is deferred so TransitionFrame's
  // PAGE_TRANSITION_COMPLETE_EVENT fires before these elements exist. Re-run here.
  useEffect(() => {
    if (!introComplete) return
    return createSlideUpAnimations(pageRef.current)
  }, [introComplete])

  // Refresh scroll triggers after animations initialize
  useEffect(() => {
    if (!introComplete) return
    const shouldWaitForHeroIntro = shouldRunHomeIntroAnimations && !introAnimationsPlayedRef.current
    const timer = setTimeout(
      () => refreshScrollTriggers(),
      shouldWaitForHeroIntro ? HOME_SCROLL_INIT_AFTER_INTRO_MS + 200 : 250,
    )
    return () => clearTimeout(timer)
  }, [introComplete, shouldRunHomeIntroAnimations])

  // Video visibility and loop management
  useEffect(() => {
    const video = heroVideoRef.current
    if (!video) return

    let loopCount = 0
    const MAX_LOOPS = 3
    let observer = null

    // Handle when video loops
    const onLoop = () => {
      loopCount += 1
      if (loopCount >= MAX_LOOPS) {
        video.pause()
      }
    }

    // Handle tab visibility changes
    const onVisibilityChange = () => {
      if (document.hidden) {
        video.pause()
      } else if (loopCount < MAX_LOOPS) {
        video.play().catch(() => {})
      }
    }

    // Intersection Observer to play only when video is in viewport
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !document.hidden && loopCount < MAX_LOOPS) {
          video.play().catch(() => {})
        } else if (!entry.isIntersecting || document.hidden) {
          video.pause()
          // Reset loop count when video leaves viewport
          if (!entry.isIntersecting) {
            loopCount = 0
          }
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(video)
    video.addEventListener('loop', onLoop)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      observer?.disconnect()
      video.removeEventListener('loop', onLoop)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      video.pause()
    }
  }, [])

  // Close hero modal when pressing Escape
  useEffect(() => {
    if (!isHeroModalVisible) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeHeroVideoModal()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isHeroModalVisible])

  // Prevent body scroll while modal is open
  useEffect(() => {
    if (!isHeroModalVisible) return

    const originalOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.documentElement.style.overflow = originalOverflow
    }
  }, [isHeroModalVisible])

  function clearPendingHeroModalOpen() {
    if (openHeroModalTimeoutRef.current) {
      clearTimeout(openHeroModalTimeoutRef.current)
      openHeroModalTimeoutRef.current = null
    }

    if (openHeroModalPlaybackTimeoutRef.current) {
      clearTimeout(openHeroModalPlaybackTimeoutRef.current)
      openHeroModalPlaybackTimeoutRef.current = null
    }

    if (openHeroModalScrollCleanupRef.current) {
      openHeroModalScrollCleanupRef.current()
      openHeroModalScrollCleanupRef.current = null
    }
  }

  function clearPendingHeroModalClose() {
    if (closeHeroModalTimeoutRef.current) {
      clearTimeout(closeHeroModalTimeoutRef.current)
      closeHeroModalTimeoutRef.current = null
    }
  }

  function disablePlayIconDuringScrollToNextSection() {
    const root = document.documentElement
    const nextSection = document.querySelector('section.brands-grow')

    if (!nextSection) {
      root.removeAttribute(PLAY_ICON_DISABLE_ATTR)
      return
    }

    root.setAttribute(PLAY_ICON_DISABLE_ATTR, 'true')
    window.dispatchEvent(new Event('scroll'))

    const targetTop = Math.max(0, Math.floor(nextSection.getBoundingClientRect().top + window.scrollY))
    let settleFrames = 0
    let rafId = 0
    const fallbackTimer = window.setTimeout(() => {
      if (rafId) cancelAnimationFrame(rafId)
      root.removeAttribute(PLAY_ICON_DISABLE_ATTR)
    }, 2200)

    const checkScrollCompletion = () => {
      const remainingDistance = Math.abs(window.scrollY - targetTop)

      if (remainingDistance <= 2) {
        settleFrames += 1
      } else {
        settleFrames = 0
      }

      if (settleFrames >= 2) {
        window.clearTimeout(fallbackTimer)
        root.removeAttribute(PLAY_ICON_DISABLE_ATTR)
        return
      }

      rafId = requestAnimationFrame(checkScrollCompletion)
    }

    window.scrollTo({ top: targetTop, behavior: 'smooth' })
    rafId = requestAnimationFrame(checkScrollCompletion)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.clearTimeout(fallbackTimer)
      root.removeAttribute(PLAY_ICON_DISABLE_ATTR)
    }
  }

  function openHeroVideoModal() {
    if (!hasHeroFullVideo) return
    heroVideoRef.current?.pause()
    clearPendingHeroModalClose()
    clearPendingHeroModalOpen()
    setIsHeroModalPlaybackReady(false)

    // Recalculate pin/spacer positions before deriving the unpin target.
    refreshScrollTriggers()

    const currentScrollY = Math.floor(window.scrollY || window.pageYOffset || 0)
    // Pin ends where the first post-hero section reaches the viewport bottom.
    const postHeroMarker = document.querySelector('.brands-grow') ?? servicesRef.current
    const markerRectTop = postHeroMarker?.getBoundingClientRect()?.top
    const markerThreshold = Number.isFinite(markerRectTop)
      ? Math.max(0, Math.floor(currentScrollY + markerRectTop - window.innerHeight))
      : null

    const heroScrollTrigger = ScrollTrigger.getById('hero-scroll')
    const triggerThreshold = Number.isFinite(heroScrollTrigger?.end)
      ? Math.max(0, Math.floor(heroScrollTrigger.end - 8))
      : null
    const heroSectionThreshold = Number.isFinite(heroRef.current?.offsetHeight)
      ? Math.max(0, Math.floor((heroRef.current?.offsetTop ?? 0) + heroRef.current.offsetHeight - window.innerHeight - 8))
      : null
    // Prefer the pin end position (hero at max scale), then safe fallbacks.
    const unpinThreshold = triggerThreshold ?? heroSectionThreshold ?? markerThreshold ?? 0

    const revealHeroModal = () => {
      document.documentElement.setAttribute(PLAY_ICON_CLOSE_ATTR, 'true')
      setIsHeroModalMounted(true)
      setIsHeroModalOpen(false)

      openHeroModalTimeoutRef.current = setTimeout(() => {
        setIsHeroModalOpen(true)
      }, HERO_MODAL_ENTER_FRAME_DELAY_MS)

      openHeroModalPlaybackTimeoutRef.current = setTimeout(() => {
        setIsHeroModalPlaybackReady(true)
      }, Math.max(HERO_MODAL_FADE_DURATION_MS, HERO_MODAL_CONTENT_FADE_DURATION_MS) + HERO_MODAL_ENTER_FRAME_DELAY_MS)
    }

    const scheduleHeroModalReveal = () => {
      clearPendingHeroModalOpen()
      openHeroModalTimeoutRef.current = setTimeout(() => {
        revealHeroModal()
      }, HERO_MODAL_POST_SCROLL_DELAY_MS)
    }

    if (Math.abs(currentScrollY - unpinThreshold) <= 4) {
      scheduleHeroModalReveal()
      return
    }

    const scrollStart = performance.now()
    const scrollDelta = unpinThreshold - currentScrollY

    const easeInOutCubic = (progress) => (
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2
    )

    let rafId = 0
    let isScrollCancelled = false

    const step = (timestamp) => {
      if (isScrollCancelled) return

      const elapsed = timestamp - scrollStart
      const progress = Math.min(1, elapsed / HERO_MODAL_SCROLL_DURATION_MS)
      const easedProgress = easeInOutCubic(progress)
      const nextScrollY = currentScrollY + (scrollDelta * easedProgress)

      window.scrollTo({ top: Math.round(nextScrollY), behavior: 'auto' })

      if (progress < 1) {
        openHeroModalScrollCleanupRef.current = () => {
          isScrollCancelled = true
          if (rafId) cancelAnimationFrame(rafId)
          openHeroModalScrollCleanupRef.current = null
        }
        rafId = requestAnimationFrame(step)
        return
      }

      window.scrollTo({ top: unpinThreshold, behavior: 'auto' })
      openHeroModalScrollCleanupRef.current = null
      scheduleHeroModalReveal()
    }

    rafId = requestAnimationFrame(step)
  }

  function closeHeroVideoModal({ scrollToNextSection = false } = {}) {
    clearPendingHeroModalOpen()
    if (!isHeroModalVisible) return

    document.documentElement.removeAttribute(PLAY_ICON_CLOSE_ATTR)

    if (scrollToNextSection) {
      document.documentElement.setAttribute(PLAY_ICON_DISABLE_ATTR, 'true')
      window.dispatchEvent(new Event('scroll'))
    } else {
      document.documentElement.removeAttribute(PLAY_ICON_DISABLE_ATTR)
    }

    clearPendingHeroModalClose()
    setIsHeroModalOpen(false)
    setIsHeroModalPlaybackReady(false)

    closeHeroModalTimeoutRef.current = window.setTimeout(() => {
      setIsHeroModalMounted(false)
      closeHeroModalTimeoutRef.current = null

      if (scrollToNextSection) {
        disablePlayIconDuringScrollToNextSection()
      }
    }, HERO_MODAL_FADE_DURATION_MS)
  }

  useEffect(() => {
    return () => {
      clearPendingHeroModalOpen()
      clearPendingHeroModalClose()
    }
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
  const testimonial = testimonialBlock?.testimonial ?? null
  const testimonialData = testimonialBlock?.testimonialData ?? null
  const linkedCaseStudy = testimonialBlock?.caseStudy ?? null
  const linkedCaseStudyLoaderImg =  testimonialBlock?.caseStudyLoaderImg || ''
  const linkedCaseStudyImage = testimonialBlock?.caseStudyImage || ''
  const linkedCaseStudyClient = testimonialBlock?.caseStudyClient || ''
  const linkedCaseStudyCategories = testimonialBlock?.caseStudyCategories ?? []
  const linkedCaseStudySlug = linkedCaseStudy?.slug || ''

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

  useEffect(() => {
    const cleanupWorkThumbHover = createWorkThumbHoverAnimation(pageRef.current)
    return () => {
      cleanupWorkThumbHover?.()
    }
  }, [])

  return (
    <div ref={pageRef}>
      <Seo
        title={page.title || 'Home'}
        description={normaliseDescription(page.intro)}
        pathname="/"
        type="website"
        image={page.image?.sourceUrl}
        schema={[
          webPageSchema({
            pathname: '/',
            title: page.title,
            description: normaliseDescription(page.intro),
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
      <div
        className={`play-icon text-white bg-branding-design fixed z-[999999] w-[50px] h-[50px] md:w-[100px] md:h-[100px] rounded-full hidden md:flex items-center justify-center transition-[background-color] duration-200 ${isHeroModalVisible ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}`}
        onClick={isHeroModalVisible ? () => closeHeroVideoModal({ scrollToNextSection: true }) : undefined}
        role={isHeroModalVisible ? 'button' : undefined}
        aria-label={isHeroModalVisible ? 'Close video' : undefined}
      >
        {isHeroModalVisible ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="3" y1="3" x2="19" y2="19"/>
            <line x1="19" y1="3" x2="3" y2="19"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="ms-2" width="22" height="20" viewBox="0 0 18 20" fill="currentColor">
            <path d="M18 10L0 20L9.08523e-07 0L18 10Z"></path>
          </svg>
        )}
      </div>
      
      <section ref={heroRef} className="landing relative w-full px-5 min-h-[80vh] md:min-h-screen flex flex-col md:justify-end change-logo-back">
          <div className="grid grid-cols-12 min-h-[80vh] md:min-h-0 items-start gap-x-5 w-full">
            <div className="col-start-1 col-span-12 md:col-span-7 max-w-[70ch] mt-60 mb-10 lg:my-0"> 
              <h1 className="hero-title text-coffee">Simplr turns <span>complexity</span> into <span><i>brand and digital clarity.</i></span></h1>
            </div>
            <div className="hero-video-holder col-start-1 lg:col-start-8 col-span-12 lg:col-span-5 section-dark lg:flex lg:items-end lg:justify-end pb-5 relative"> 
              <button
                type="button"
                className="hero-video-trigger block w-full text-left"
                aria-label={hasHeroFullVideo ? 'Play full hero video' : 'Hero video preview'}
                onClick={openHeroVideoModal}
              > 
                <div className="play-icon-mobile">
                  <svg xmlns="http://www.w3.org/2000/svg" className="ms-1" width="16" height="auto" viewBox="0 0 18 20" fill="white">
                    <path d="M18 10L0 20L9.08523e-07 0L18 10Z"></path>
                  </svg>
                </div>
                <video
                  ref={heroVideoRef}
                  className="hero-video block w-full aspect-[16/10] object-cover overflow-hidden rounded-[10px]"
                  muted
                  playsInline
                  loop
                  poster={heroVideoPoster || undefined}
                >
                  {heroVideoLoop ? <source src={heroVideoLoop} type="video/mp4" /> : null}
                </video>
              </button>
            </div>
          </div>
      </section>

      {isHeroModalVisible && hasHeroFullVideo ? (
        <div
          className={`hero-video-modal fixed inset-0 z-[100000] flex items-center justify-center bg-black transition-opacity ease-out ${isHeroModalOpen ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDuration: `${HERO_MODAL_FADE_DURATION_MS}ms` }}
          role="dialog"
          aria-modal="true"
          aria-label="Full hero video"
          onClick={closeHeroVideoModal}
        >
          <div
            className={`hero-video-modal-inner w-full transition-all ease-out  ${isHeroModalOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.75]'}`}
            style={{
              transitionDuration: `${HERO_MODAL_CONTENT_FADE_DURATION_MS}ms`,
              transitionDelay: isHeroModalOpen ? `${HERO_MODAL_ENTER_FRAME_DELAY_MS}ms` : '0ms',
            }}
            onClick={(event) => event.stopPropagation()}
            ref={heroVideoModalRef}
          >
            
            <video
              className={`hero-video-modal-player block w-full bg-black transition-opacity ease-out ${isHeroModalOpen ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDuration: `${HERO_MODAL_CONTENT_FADE_DURATION_MS}ms` }}
              controls
              autoPlay={isHeroModalPlaybackReady}
              playsInline
              poster=''
            >
              {isHeroModalPlaybackReady ? <source src={heroVideoFull} type="video/mp4" /> : null}
              {heroVideoPoster ? <img src={heroVideoPoster} alt={heroVideoPosterAlt} /> : null}
            </video>
          </div>
        </div>
      ) : null}

      <section className="brands-grow px-5 bg-white py-20 section-light relative z-1 change-logo">
        <div className="grid grid-cols-12">
          <div className="trigger-split-text-coffee col-start-1 lg:col-start-4 col-span-12 lg:col-span-5 lead max-w-[47ch] "> 
              <div className="split-text-coffee">
                <p className="mb-5">We help organisations make sense of who they are, what they need to say, and how their brand should work across identity, websites, motion, and communication systems.</p>
                <p>From our Cape Town studio, we partner with clients in South Africa and around the world to create work that connects purpose with performance.</p>
              </div>
          </div>
        </div>
      </section>

      <section ref={servicesRef} className="services py-10 md:py-20 section-light overflow-hidden relative w-full light-to-coffee-outgoing">
         <div className="services-titles flex flex-nowrap items-center text-[3rem] md:text-[5.5rem] gap-10">
          <div id="strategy" data-color="text-strategy" data-stat="62" data-detail="Brand and digital strategy projects completed." className="services-title font-literata font-[400] flex-shrink-0">
            Strategy
          </div>
          <svg className="flex-shrink-0 opacity-[0.2] mt-3" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
            <circle cx="6.5" cy="6.5" r="6.5" fill="#300F1D"/>
          </svg>
          <div id="branding-design" data-color="text-branding-design" data-stat="38" data-detail="Brand identity systems created and evolved." className="services-title font-light flex-shrink-0 mt-3">
            Branding&Design 
          </div>
          <svg className="flex-shrink-0 opacity-[0.2] mt-3" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
            <circle cx="6.5" cy="6.5" r="6.5" fill="#300F1D"/>
          </svg>
          <div id="web-design-development" data-color="text-web-design-development" data-stat="56" data-detail="Websites and digital platforms designed and built." className="services-title font-literata flex-shrink-0">
            Web Design&Development
          </div>
          <svg className="flex-shrink-0 opacity-[0.2] mt-3" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
            <circle cx="6.5" cy="6.5" r="6.5" fill="#300F1D"/>
          </svg>
           <div id="motion" data-color="text-motion" data-stat="39" data-detail="Motion projects brought to life across screen and story." className="services-title font-light flex-shrink-0 mt-3">
            Motion
          </div>
          <svg className="flex-shrink-0 opacity-[0.2] mt-3" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
            <circle cx="6.5" cy="6.5" r="6.5" fill="#300F1D"/>
          </svg>
          <div id="templates" data-color="text-templates" data-stat="89" data-detail="Template systems built for teams at scale." className="services-title font-literata flex-shrink-0">
            Templates
          </div>
          <div className="services-titles-end-spacer flex-none w-[100vw] text-white" aria-hidden="true" >.</div>
        </div>
        <div className="service-stats pt-10 md:pt-20">
          <div className="stat-item flex flex-col sm:flex-row gap-5 xl:justify-between lg:min-w-[56,25rem] max-w-[68rem] relative">
            <div data-initial="62" className="stat-no ps-5 md:ps-0 text-strategy md:min-w-[32rem]">0</div>
            <div className="flex flex-col">
              <div className="stat-plus absolute top-0 right-[2.5rem] md:static mb-20 lg:mb-40 text-strategy text-[5rem]">+</div>
              <div className="stat-detail lead max-w-[26ch] md:max-w-[22ch] px-5 md:px-0 mt-5 md:mt-0">Brand and digital strategy projects completed.</div>
            </div>
          </div>
        </div>
        <Link 
          to="services"
          ref={btnRef}
          className="btn relative md:absolute md:right-[1.25rem] md:bottom-[5rem] ms-5 md:ms-0 mt-8 md:mt-0"
        >
          <span className="btn-fill" aria-hidden="true" />
          <span className="btn-inner">
            <span className="btn-text text-coffee">Explore our services</span>
            Explore our services
          </span>
        </Link>
      </section>

      <section ref={caseStudiesRef} className="case-studies px-5 py-20 md:py-30 section-dark light-to-coffee-incoming min-h-screen">
          <div className="grid grid-cols-12 items-emd slide-up md:pt-10">
            <div className="col-start-1 col-span-12 md:col-span-5 order-2 md:order-1 client-name-list text-white flex flex-col justify-center mt-5 md:mt-0">
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
                      data-transition-source-key={study.slug}
                      data-transition-variant="work-card"
                      onMouseEnter={() => prefetchWorkEntry(study.slug)}
                      title={study.detail}
                    >
                      {study.client}
                      <div className="client-detail font-literata text-3xl lg:text-5xl font-light pb-3">
                        <span className="client-detail-text">{study.detail}</span>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
            <div className="col-start-1 col-span-12 md:col-start-7 md:col-span-6 lg:col-start-8 lg:col-span-5 order-1 md:order-2 client-work-list min-h-screen overflow-y-hidden_ rounded-[10px] flex flex-col justify-center">
              {caseStudies.map((study) => {
                const path = buildEntryPath('work', study.slug)

                return (
                  <div key={`work-${study.id}`} id={study.slug} className="client-work">
                    <Link
                      to={path}
                      className="client-work-img overflow-hidden rounded-[10px] block alt-transition-img"
                      data-transition-source="media"
                      data-transition-source-key={study.slug}
                      data-transition-variant="work-card"
                      onMouseEnter={() => prefetchWorkEntry(study.slug)}
                      title={study.detail}
                    >
                      <div
                        className="ratio overflow-hidden test"
                        style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '65%' }}
                      >
                        <PictureImg
                          loaderSrc={study.secondaryLoaderImg + '.webp'}
                          mobileSrc={study.secondaryThumbnail + '.webp'}
                          desktopSrc={study.secondaryThumbnail + '.webp'}
                          imgClass="rounded-[10px]"
                          altText={study.detail}
                        />
                      </div>
                    </Link>
                    {study.categories?.length > 0 && (
                      <div className="categories mt-5 hidden md:flex">
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
        <LazyClientLogos innerRef={clientsRef} shouldAnimate={introComplete} />
      </Suspense>

      <section className="testimonials p-5 section-light bg-white">
        <div id="testimonial-1" className="grid grid-cols-12">
          <div className="col-start-1 col-span-12 md:col-span-6 slide-up-from-left">
              <div className="client-work">
                <Link
                  to={buildEntryPath('work', linkedCaseStudySlug)}
                  className="alt-transition-img thumb-swap-trigger"
                  data-card-key=''
                  data-transition-source="media"
                  data-transition-variant="work-card"
                  data-transition-snapshot-state="hover"
                  title={linkedCaseStudyClient + ' Testimonial'}
                >
                  {/*
                  <picture className="ratio overflow-hidden rounded-[10px]" style={{'--aspect-ratio-desktop':'90%', '--aspect-ratio-mobile':'90%'}}>
                    <img src={linkedCaseStudyImage} title={linkedCaseStudyClient} />
                  </picture>
                  */}
                  <div className="ratio overflow-hidden rounded-[10px] block thumb-swap" style={{'--aspect-ratio-desktop':'90%', '--aspect-ratio-mobile':'90%'}}>
                    <PictureImg
                      loaderSrc = {linkedCaseStudyLoaderImg + '.webp'}
                      mobileSrc = {linkedCaseStudyImage + '.webp'}
                      desktopSrc = {linkedCaseStudyImage + '.webp'}
                      imgClass = 'thumb-primary rounded-[10px]'
                      altText = {linkedCaseStudyClient + 'Testimonial 1'}
                    />
                    <PictureImg
                      loaderSrc = {linkedCaseStudyLoaderImg + '.webp'}
                      mobileSrc = {linkedCaseStudyImage + '.webp'}
                      desktopSrc = {linkedCaseStudyImage + '.webp'}
                      imgClass = 'thumb-secondary rounded-[10px]'
                      altText = {linkedCaseStudyClient + ' Testimonial 2'}
                    />
                  </div>
                </Link>

                  <div className="mt-3 flex">
                  {linkedCaseStudyClient}
                  </div>
                  {linkedCaseStudy && linkedCaseStudyCategories.length > 0 ? (
                    <div className="categories mt-3 flex">
                      {linkedCaseStudyCategories.map(({ name }) => (
                        <CategoryBadge key={name} name={name} />
                      ))}
                    </div>
                  ) : null}
              </div>

          </div>
          <div className="col-start-1 md:col-start-8 col-span-12 md:col-span-4 flex flex-col md:items-center md:justify-center trigger-split-text-coffee">
            <div className="testimonial lead max-w-[38ch] mt-5 md:mt-0">
              <div className="split-text-coffee trigger-split-text-coffee">
                {testimonialData?.acfTestimonial ? (
                  <div className="mb-5 md:mb-20"><RichText html={testimonialData.acfTestimonial} /></div>
                ) : (
                  <p className="mb-5 md:mb-20">&ldquo;Simplr&apos;s creativity has brought Satalia&apos;s bold, utopian vision for AI to life. The result is a dynamic, flexible brand identity that reflects our commitment to innovation and inclusivity. Their work has given us a dynamic, forward-thinking brand presence, and we&apos;re excited to share it with the world.&rdquo;</p>
                )}
                <p><b>{testimonialData?.acfName || testimonial?.title}</b><br/>{testimonialData?.acfRole}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="faqs ps-5 pt-20 md:pt-60 bg-white section-light flex flex-col justify-center">
        <div className="grid grid-cols-1 gap-y-8 md:grid-cols-12 md:gap-x-5 md:gap-y-12 slide-up">
          <div className="trigger-split-text-coffee md:col-span-4">
            <div className="eyebrow">FAQs</div>
            <h1 className="split-text-coffee">Have questions?</h1>
          </div>

          {activeFaq && (
            <>
              <div className="md:col-span-12 md:flex">
                <div className="flex md:static">
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
                </div>

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
                        className={`lead faq-pill h-[3.125rem] max-w-[90%] md:max-w-auto shrink-0 rounded-full border px-5 flex items-center justify-center leading-tight transition-all duration-200 ${isActive ? 'border-coffee text-coffee shadow-[0_0_0_1px_rgba(48,15,29,0.08)]' : 'border-coffee/16 text-coffee/42 hover:border-coffee/28 hover:text-coffee/70'}`}
                        aria-pressed={isActive}
                      >
                        <span className="block text-start md:text-center md:whitespace-nowrap">{item.question}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="md:col-span-5">
                <div key={activeFaq.question} className="faq-answer-fade max-w-[18rem] md:max-w-[32rem] text-[1rem] md:text-[1.125rem] text-coffee">
                  {activeFaq.answer}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default function HomePage() {
  const { homeData } = useLoaderData()
  const [resolvedHomeData, setResolvedHomeData] = useState(HOME_PAGE_FALLBACK)

  useEffect(() => {
    let cancelled = false

    Promise.resolve(homeData)
      .then((data) => {
        if (!cancelled && data) {
          setResolvedHomeData(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedHomeData(HOME_PAGE_FALLBACK)
        }
      })

    return () => {
      cancelled = true
    }
  }, [homeData])

  const {
    page,
    featuredWork,
    caseStudies,
    testimonialBlock,
  } = resolvedHomeData

  return (
    <HomePageContent
      page={page}
      featuredWork={featuredWork}
      caseStudies={caseStudies}
      testimonialBlock={testimonialBlock}
    />
  )
}