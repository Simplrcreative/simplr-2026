import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

const PAGE_TRANSITION_COMPLETE_EVENT = 'page-transition:complete'
const HERO_SCROLL_DEBUG_QUERY_PARAM = 'debugHero'

let pluginsRegistered = false

function registerPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger, SplitText)
    pluginsRegistered = true
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getHeroImageMetrics(heroImage) {
    const bounds = heroImage.getBoundingClientRect()
    const availableWidth = window.innerWidth

    if (bounds.width <= 0 || bounds.height <= 0) {
      return {
        scale: 1,
        x: 0,
        y: 0,
      }
    }

    const scale = availableWidth / bounds.width

  return {
    scale,
    x: window.innerWidth - bounds.right,
    y: window.innerHeight - bounds.bottom,
  }
}

function isMeasurableMedia(element) {
  if (!element) {
    return false
  }

  const bounds = element.getBoundingClientRect()

  return bounds.width > 0 && bounds.height > 0
}

function getHeroStart() {
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth
  const isSmallViewport = viewportWidth < 768
  // Keep the start line near the top so the hero tween doesn't begin immediately on load.
  const ratio = isSmallViewport ? 0.16 : 0.18
  const minOffset = isSmallViewport ? 90 : 110
  const maxOffset = isSmallViewport ? 150 : 190
  const startOffset = Math.round(clamp(viewportHeight * ratio, minOffset, maxOffset))

  return `top ${startOffset}`
}

function getHeroEndDistance() {
  return `+=${window.innerHeight}`
}
const isDesktop = window.matchMedia('(min-width: 1024px)').matches
const NAV_LIGHT_TOP = 95
const LOGO_LIGHT_LEFT = 130
const LIGHT_RELEASE_OFFSET = 12

function setCompactLogoActive(isActive) {
  document.documentElement.classList.toggle('compact-logo-active', isActive)
}

function resolveLightState(currentState, value, enterThreshold) {
  if (currentState) {
    return value <= enterThreshold + LIGHT_RELEASE_OFFSET
  }

  return value <= enterThreshold
}

function getSectionThemeLightState(sections, threshold) {
  let activeLightState = null
  let activeSectionTop = -Infinity

  for (const section of sections) {
    const bounds = section.getBoundingClientRect()
    const crossesThreshold = bounds.top <= threshold && bounds.bottom >= threshold

    if (!crossesThreshold) {
      continue
    }

     // When sections overlap (e.g. pinned hero), prefer the one nearest the threshold line.
    if (bounds.top < activeSectionTop) {
      continue
    }

    if (section.classList.contains('section-dark')) {
      activeSectionTop = bounds.top
      activeLightState = true
      continue
    }

    if (section.classList.contains('section-light')) {
      activeSectionTop = bounds.top
      activeLightState = false
    }
  }

  return activeLightState
}

function applySectionLightState(nav, logo, lightState, nextLightState) {
  lightState.nav = nextLightState
  lightState.logo = nextLightState
  nav?.classList.toggle('light', nextLightState)
  logo?.classList.toggle('light', nextLightState)
}

function createSectionThemeWatcher(sections, nav, logo, lightState, getThreshold) {
  const applyThemeState = (nextLightState) => {
    applySectionLightState(nav, logo, lightState, nextLightState)
  }

  const syncSectionTheme = () => {
    const threshold = getThreshold()
    const initialLightState = getSectionThemeLightState(sections, threshold)

    if (initialLightState !== null) {
      applyThemeState(initialLightState)
    }
  }

  const watcher = ScrollTrigger.create({
    trigger: document.documentElement,
    start: 0,
    end: 'max',
    invalidateOnRefresh: true,
    onUpdate: syncSectionTheme,
    onRefresh: syncSectionTheme,
  })

  syncSectionTheme()

  return watcher
}

/**
 * Standalone nav section theme watcher for pages that don't have a hero animation.
 * Reads .section-dark / .section-light elements and keeps nav.main in sync.
 * Skip pages with a .landing section — createHeroScrollAnimation handles those.
 */
export function createNavSectionTheme(scope) {
  if (!scope) return () => undefined
  if (scope.querySelector('.landing')) return () => undefined

  registerPlugins()

  const nav = document.querySelector('#desktop-nav')
  const logo = document.querySelector('.logo-holder')
  const themedSections = Array.from(scope.querySelectorAll('.section-light, .section-dark'))
  const changeLogoSections = Array.from(scope.querySelectorAll('.change-logo'))
  const changeLogoBackSections = Array.from(scope.querySelectorAll('.change-logo-back'))

  if (!themedSections.length && !changeLogoSections.length && !changeLogoBackSections.length) {
    nav?.classList.remove('light')
    logo?.classList.remove('light')
    return () => undefined
  }

  const getSectionThreshold = () => {
    const navBounds = nav?.getBoundingClientRect()
    if (navBounds && navBounds.height > 0) return Math.round(navBounds.bottom)
    return NAV_LIGHT_TOP
  }

  let themeWatcher = null
  let changeLogoWatcher = null

  if (themedSections.length) {
    const lightState = {
      nav: nav?.classList.contains('light') ?? false,
      logo: logo?.classList.contains('light') ?? false,
    }
    themeWatcher = createSectionThemeWatcher(themedSections, nav, logo, lightState, getSectionThreshold)
  } else {
    nav?.classList.remove('light')
    logo?.classList.remove('light')
  }

  if (changeLogoSections.length || changeLogoBackSections.length) {
    changeLogoWatcher = createChangeLogoWatcher(changeLogoSections, changeLogoBackSections, getSectionThreshold)
  }

  return () => {
    themeWatcher?.kill()
    changeLogoWatcher?.kill()
  }
}

function resolveCompactLogoState(changeLogoSections, changeLogoBackSections, threshold) {
  const triggerSections = [
    ...changeLogoSections.map((section) => ({ section, isCompact: true })),
    ...changeLogoBackSections.map((section) => ({ section, isCompact: false })),
  ]

  let activeState = false
  let activeSectionTop = -Infinity

  for (const trigger of triggerSections) {
    const bounds = trigger.section.getBoundingClientRect()

    if (bounds.top > threshold || bounds.top < activeSectionTop) {
      continue
    }

    activeSectionTop = bounds.top
    activeState = trigger.isCompact
  }

  return activeState
}

function createChangeLogoWatcher(changeLogoSections, changeLogoBackSections, getThreshold) {
  const allTriggerSections = [...changeLogoSections, ...changeLogoBackSections]

  if (!allTriggerSections.length) {
    setCompactLogoActive(false)

    return {
      kill() {
        setCompactLogoActive(false)
      },
    }
  }

  const syncChangeLogoState = () => {
    setCompactLogoActive(
      resolveCompactLogoState(changeLogoSections, changeLogoBackSections, getThreshold()),
    )
  }

  const watchers = [
    ...changeLogoSections.map((section) =>
      ScrollTrigger.create({
        trigger: section,
        start: () => `top ${getThreshold()}`,
        invalidateOnRefresh: true,
        onEnter: () => setCompactLogoActive(true),
        onEnterBack: () => setCompactLogoActive(true),
        onRefresh: syncChangeLogoState,
      }),
    ),
    ...changeLogoBackSections.map((section) =>
    ScrollTrigger.create({
      trigger: section,
      start: () => `top ${getThreshold()}`,
      invalidateOnRefresh: true,
      onEnter: () => setCompactLogoActive(false),
      onEnterBack: () => setCompactLogoActive(false),
      onRefresh: syncChangeLogoState,
    }),
    ),
  ]

  syncChangeLogoState()

  return {
    kill() {
      watchers.forEach((watcher) => watcher.kill())
      setCompactLogoActive(false)
    },
  }
}

function updateHeaderLightClasses(heroImage, nav, logo, lightState, themedSections, sectionThreshold) {
  const bounds = heroImage.getBoundingClientRect()

  if (isDesktop) {
    const sectionThemeLightState = getSectionThemeLightState(themedSections, sectionThreshold)
    lightState.nav = resolveLightState(lightState.nav, bounds.top, NAV_LIGHT_TOP)
    lightState.logo = resolveLightState(lightState.logo, bounds.left, LOGO_LIGHT_LEFT)

    if (sectionThemeLightState !== null) {
      applySectionLightState(nav, logo, lightState, sectionThemeLightState)
      return
    }

    nav?.classList.toggle('light', lightState.nav)
    logo?.classList.toggle('light', lightState.logo)
  } else {
    // Mobile: nav never gets .light (menu uses mix-blend-mode instead).
    // Logo light state driven by hero image top position vs logo-holder's actual
    // bottom edge — fires exactly when the expanding image begins to overlap the logo.
    lightState.nav = false
    const logoBounds = logo?.getBoundingClientRect()
    const mobileLogoThreshold = (logoBounds && logoBounds.height > 0)
      ? Math.round(logoBounds.bottom)
      : NAV_LIGHT_TOP
    lightState.logo = resolveLightState(lightState.logo, bounds.top, mobileLogoThreshold)
    logo?.classList.toggle('light', lightState.logo)
  }
}

export function createHeroScrollAnimation(scope) {
  if (!scope) {
    return () => undefined
  }

  registerPlugins()

  const media = gsap.matchMedia()
  const debugHeroScroll = import.meta.env.DEV && window.location.search.includes(HERO_SCROLL_DEBUG_QUERY_PARAM)

  media.add('(prefers-reduced-motion: no-preference)', () => {
    const section = scope.matches?.('.landing') ? scope : scope.querySelector('.landing')
    const heroTitle = section?.querySelector('.hero-title')
    const heroImage = section?.querySelector('.hero-video')
    const mobilePlayIcon = section?.querySelector('.play-icon-mobile')
    const heroVideoHolder = section?.querySelector('.hero-video-holder')
    const navHolder = document.querySelector('.nav-holder')
    const nav = document.querySelector('#desktop-nav')
    const logo = document.querySelector('.logo-holder')
    const themedSections = Array.from(document.querySelectorAll('.section-light, .section-dark'))
    const changeLogoSections = Array.from(document.querySelectorAll('.change-logo'))
    const changeLogoBackSections = Array.from(document.querySelectorAll('.change-logo-back'))
    const lightState = {
      nav: nav?.classList.contains('light') ?? false,
      logo: logo?.classList.contains('light') ?? false,
    }
    let timeline
    let changeLogoWatcher
    let sectionThemeWatcher
    let isDisposed = false
    let cursorCleanup = null

    const getSectionThreshold = () => {
      const navBounds = nav?.getBoundingClientRect()

      if (navBounds && navBounds.height > 0) {
        return Math.round(navBounds.bottom)
      }

      return NAV_LIGHT_TOP
    }

    const refreshTrigger = () => {
      if (!isDisposed) {
        timeline?.scrollTrigger?.refresh()
        ScrollTrigger.refresh()
      }
    }

    if (!section || !heroTitle || !heroImage) {
      return undefined
    }

    const playIcon = document.querySelector('.play-icon')

    if (heroVideoHolder && playIcon) {
      gsap.set(playIcon, {
        willChange: 'transform',
      })

      const movePlayIconX = gsap.quickTo(playIcon, 'x', { duration: 0.18, ease: 'power3.out' })
      const movePlayIconY = gsap.quickTo(playIcon, 'y', { duration: 0.18, ease: 'power3.out' })

      let isOver = false
      let hiddenBySection = false
      let hasPointer = false
      let pointerX = 0
      let pointerY = 0

      const updatePlayIconVisibility = (visible) => {
        const playIconDisabled = document.documentElement.hasAttribute('data-play-icon-disabled')
        const closeMode = document.documentElement.hasAttribute('data-play-icon-close')
        // Close mode always wins over disabled — the icon must be visible to be clickable.
        const nextVisible = closeMode ? true : (playIconDisabled ? false : visible)

        if (nextVisible === isOver) return

        isOver = nextVisible
        // Match slider cursor: CSS .active scales/fades the inner circle.
        playIcon.classList.toggle('active', nextVisible)
      }

      const syncPlayIconState = () => {
        const playIconDisabled = document.documentElement.hasAttribute('data-play-icon-disabled')
        const closeMode = document.documentElement.hasAttribute('data-play-icon-close')

        // In close mode the icon follows the mouse everywhere and is always visible.
        if (closeMode) {
          updatePlayIconVisibility(true)
          return
        }

        if (playIconDisabled || hiddenBySection || !hasPointer) {
          updatePlayIconVisibility(false)
          return
        }

        const bounds = heroImage.getBoundingClientRect()
        const over = (
          pointerX >= bounds.left &&
          pointerX <= bounds.right &&
          pointerY >= bounds.top &&
          pointerY <= bounds.bottom
        )

        updatePlayIconVisibility(over)
      }

      const updatePointerPosition = (e) => {
        hasPointer = true
        pointerX = e.clientX
        pointerY = e.clientY
        movePlayIconX(pointerX)
        movePlayIconY(pointerY)
      }

      const onDocPointerMove = (e) => {
        updatePointerPosition(e)
        syncPlayIconState()
      }

      const onHeroPointerEnter = (e) => {
        updatePointerPosition(e)
        syncPlayIconState()
      }

      const onHeroPointerLeave = () => {
        syncPlayIconState()
      }

      const onViewportChange = () => {
        syncPlayIconState()
      }

      document.addEventListener('pointermove', onDocPointerMove)
      heroVideoHolder.addEventListener('pointerenter', onHeroPointerEnter)
      heroVideoHolder.addEventListener('pointerleave', onHeroPointerLeave)
      window.addEventListener('scroll', onViewportChange, { passive: true })
      window.addEventListener('resize', onViewportChange)

      const brandsGrow = document.querySelector('.brands-grow')
      const navHolder = document.querySelector('.nav-holder')

      const onBrandsGrowEnter = () => {
        hiddenBySection = true
        syncPlayIconState()
      }

      const onBrandsGrowLeave = () => {
        hiddenBySection = false
        syncPlayIconState()
      }

      const onNavEnter = () => {
        hiddenBySection = true
        syncPlayIconState()
      }

      const onNavLeave = () => {
        hiddenBySection = false
        syncPlayIconState()
      }

      brandsGrow?.addEventListener('mouseenter', onBrandsGrowEnter)
      brandsGrow?.addEventListener('mouseleave', onBrandsGrowLeave)
      navHolder?.addEventListener('mouseenter', onNavEnter)
      navHolder?.addEventListener('mouseleave', onNavLeave)

      cursorCleanup = () => {
        document.removeEventListener('pointermove', onDocPointerMove)
        heroVideoHolder.removeEventListener('pointerenter', onHeroPointerEnter)
        heroVideoHolder.removeEventListener('pointerleave', onHeroPointerLeave)
        window.removeEventListener('scroll', onViewportChange)
        window.removeEventListener('resize', onViewportChange)
        brandsGrow?.removeEventListener('mouseenter', onBrandsGrowEnter)
        brandsGrow?.removeEventListener('mouseleave', onBrandsGrowLeave)
        navHolder?.removeEventListener('mouseenter', onNavEnter)
        navHolder?.removeEventListener('mouseleave', onNavLeave)
        gsap.set(playIcon, { clearProps: 'x,y' })
        playIcon.classList.remove('active')
      }
    }

    // Section theme watcher is desktop-only: on mobile the sectionThemeLightState
    // early-return in updateHeaderLightClasses would override the bounds-based
    // logo check on every scroll tick, making the threshold value irrelevant.
    if (isDesktop) {
      sectionThemeWatcher = createSectionThemeWatcher(themedSections, nav, logo, lightState, getSectionThreshold)
    }
    changeLogoWatcher = createChangeLogoWatcher(changeLogoSections, changeLogoBackSections, getSectionThreshold)

    gsap.set(heroTitle, {
      willChange: 'opacity',
    })

    gsap.set(navHolder, {
        y: 0,
    })

    // gsap.set(heroContent, {
    //   y: 0
    // })

    const screenWidth = window.innerWidth
    const isMobile = screenWidth < 1024
    let shouldPin = section
    if(isMobile) {
      shouldPin = false
    }

    gsap.set(heroImage, {
      display: 'block',
      transformOrigin: 'right bottom',
      filter: 'brightness(100%) saturate(100%)',
      willChange: 'transform',
      borderRadius: '10px',
    })

    function buildTimeline() {
      timeline?.kill()

      timeline = gsap.timeline({
        defaults: {
          ease: 'none',
        },
        scrollTrigger: {
          id: 'hero-scroll',
          trigger: section,
          pin: shouldPin,
          start: 'top top',
          end: () => getHeroEndDistance(),
          scrub: true,
          //markers: true,
          invalidateOnRefresh: true,
          refreshPriority: 1,
          anticipatePin: 0,
          onUpdate: () => updateHeaderLightClasses(heroImage, nav, logo, lightState, themedSections, getSectionThreshold()),
          onRefresh: (self) => {
            updateHeaderLightClasses(heroImage, nav, logo, lightState, themedSections, getSectionThreshold())
            if (debugHeroScroll) {
              console.info('[hero-scroll]', {
                start: self.start,
                end: self.end,
                progress: self.progress,
                scroll: ScrollTrigger.scroll(),
              })
            }
          },
          onLeave: () => updateHeaderLightClasses(heroImage, nav, logo, lightState, themedSections, getSectionThreshold()),
          onLeaveBack: () => updateHeaderLightClasses(heroImage, nav, logo, lightState, themedSections, getSectionThreshold()),
        },
      })

      timeline.addLabel('hero-start', 0)
      timeline.addLabel('hero-mid', 1)
      timeline.addLabel('hero-end', 2)

      timeline.to(heroImage, {
        x: () => getHeroImageMetrics(heroImage).x,
        y: () => (isMobile ? 0 : getHeroImageMetrics(heroImage).y),
        scale: () => getHeroImageMetrics(heroImage).scale,
        borderRadius: '0px',
        filter: 'brightness(20%)',
        duration: 1,
      }, 'hero-start')

      timeline.to(heroTitle, {
        opacity: 0,
        y: -400,
        filter: 'blur(20px)',
        duration: 1,
        delay: 0.1,
      }, 'hero-start')

      if (mobilePlayIcon && !isDesktop) {
        timeline.to(mobilePlayIcon, {
          autoAlpha: 0,
          pointerEvents: 'none',
          duration: 1,
          immediateRender: false,
        }, 'hero-start')
      }

      /*timeline.to(navHolder, {
        y: -200,
        duration: 0.5,
      }, 'hero-start+=0.4')*/

      /*timeline.to(heroImage, {
        filter: 'brightness(10%)',
        opacity: 1,
        duration: 0.5,
      }, 'hero-end')*/

      /*timeline.to(navHolder, {
        y: 0,
        duration: 0.5,
      }, 'hero-end+=0.25')*/

      /*timeline.to(heroContent, {
        opacity: 1,
        yPercent: -100,
        borderRadius:'0',
        filter: 'blur(0px)',
        onComplete: () => pauseMediaPlayback(heroImage),
        onReverseComplete: () => resumeMediaPlayback(heroImage),
        duration: 0.5,
      }, 'hero-end+=0.3')

      timeline.fromTo(splitCoffee.words,
        { color: 'rgba(48, 15, 29, 0)' },
        { color: 'rgba(48, 15, 29, 1)', stagger: 0.05, duration: 0.5, ease: 'none' },
        'hero-end+=0.3'
      )*/

      requestAnimationFrame(() => {
        if (!isDisposed) {
          updateHeaderLightClasses(heroImage, nav, logo, lightState, themedSections, getSectionThreshold())
        }
      })
    }

    let initAttempts = 0
    const MAX_INIT_ATTEMPTS = 120

    function initialise() {
      if (isDisposed) {
        return
      }

      if (!isMeasurableMedia(heroImage)) {
        initAttempts += 1
        if (initAttempts >= MAX_INIT_ATTEMPTS) return
        requestAnimationFrame(initialise)
        return
      }

      if (mobilePlayIcon && !isDesktop) {
        const videoOpacity = parseFloat(window.getComputedStyle(heroImage).opacity)
        if (videoOpacity > 0.5) {
          gsap.set(mobilePlayIcon, {
            autoAlpha: 1,
            xPercent: -50,
            yPercent: -50,
            pointerEvents: 'auto',
          })
        }
      }

      buildTimeline()

      ScrollTrigger.refresh()
    }

    window.addEventListener(PAGE_TRANSITION_COMPLETE_EVENT, refreshTrigger)

    // Handle both image and video elements
    const isVideo = heroImage.tagName === 'VIDEO'
    
    if (isVideo) {
      // For video elements, start animation immediately or when metadata is loaded
      if (heroImage.readyState >= 1) {
        // Video metadata already loaded
        initialise()
      } else {
        // Wait for video metadata to load
        heroImage.addEventListener('loadedmetadata', initialise, { once: true })
      }
    } else {
      // For image elements
      if (heroImage.complete && heroImage.naturalWidth > 0) {
        initialise()
      } else {
        heroImage.addEventListener('load', initialise, { once: true })
        heroImage.decode?.().then(initialise).catch(() => undefined)
      }
    }

    return () => {
      isDisposed = true
      window.removeEventListener(PAGE_TRANSITION_COMPLETE_EVENT, refreshTrigger)
      heroImage.removeEventListener('loadedmetadata', initialise)
      heroImage.removeEventListener('load', initialise)
      timeline?.kill()
      changeLogoWatcher?.kill()
      sectionThemeWatcher?.kill()
      cursorCleanup?.()
      nav?.classList.remove('light')
      logo?.classList.remove('light')
      gsap.set([heroTitle, heroImage, mobilePlayIcon], { clearProps: 'all' })
    }
  })

  return () => media.revert()
}