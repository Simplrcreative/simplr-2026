import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLoaderData, useLocation, useMatches, useNavigation } from 'react-router-dom'
import { prefetchRoute, useRoutePrefetch } from '../lib/useRoutePrefetch.js'
import BrandLogo from '../components/BrandLogo.jsx'
import IntroOverlay from '../components/IntroOverlay.jsx'
import TransitionFrame from '../components/TransitionFrame.jsx'
import CookieConsent from '../components/CookieConsent.jsx'
import Analytics from '../components/Analytics.jsx'
import { gsap } from 'gsap'
import { createLogoScrollAnimation, createLogoPageAnimation, createNavSectionTheme, createSmoothScroll, refreshSmoothScroll, createBtnHoverAnimation, createFooterAnimation, scrollToTopImmediate, lockScroll, unlockScroll, getCompactLogoTransform } from '../lib/animations/index.js'
import { useHasFinePointer } from '../lib/use-is-touch-device.js'
import { isScrollTriggerDebugEnabled, logRouteScrollTriggerState } from '../lib/animations/scroll-debug.js'

const PAGE_TRANSITION_CAPTURE_EVENT = 'page-transition:capture'
const PAGE_TRANSITION_COMPLETE_EVENT = 'page-transition:complete'
const HOME_NAV_INTRO_START_EVENT = 'home-nav:intro-start'
const HOME_HERO_TITLE_INTRO_EVENT = 'home-hero:title-intro-start'
const HOME_HERO_VIDEO_INTRO_EVENT = 'home-hero:video-intro-start'
// Keep a short brand beat without holding LCP hostage on throttled mobile.
const INTRO_MIN_VISIBLE_MS = 2000
const HOME_RETURN_ENTRANCE_FALLBACK_MS = 2000
const HOME_NAV_INTRO_DELAY_S = 0.9
const HOME_HERO_TITLE_AFTER_NAV_S = 0.3
const HOME_HERO_VIDEO_AFTER_NAV_S = 0.35

function requestTransitionCapture() {
  window.dispatchEvent(new Event(PAGE_TRANSITION_CAPTURE_EVENT))
}

function setNavLinkPointer(target, clientX, clientY) {
  const bounds = target.getBoundingClientRect()
  const pointerX = clientX ?? bounds.left + bounds.width / 2
  const pointerY = clientY ?? bounds.top + bounds.height / 2

  target.style.setProperty('--nav-x', `${pointerX - bounds.left}px`)
  target.style.setProperty('--nav-y', `${pointerY - bounds.top}px`)
}

function suppressTitleTooltip(target) {
  if (target.title) {
    target.dataset.savedTitle = target.title
    target.removeAttribute('title')
  }
}

function restoreTitleTooltip(target) {
  if (target.dataset.savedTitle) {
    target.title = target.dataset.savedTitle
    delete target.dataset.savedTitle
  }
}

function showNavLinkOrb(event) {
  suppressTitleTooltip(event.currentTarget)
  setNavLinkPointer(event.currentTarget, event.clientX, event.clientY)
  event.currentTarget.style.setProperty('--nav-orb-opacity', '1')
  event.currentTarget.style.setProperty('--nav-orb-scale', '1')
}

function hideNavLinkOrb(event) {
  const { currentTarget } = event
  setNavLinkPointer(currentTarget, event.clientX, event.clientY)
  currentTarget.style.setProperty('--nav-orb-opacity', '0')
  currentTarget.style.setProperty('--nav-orb-scale', '0.2')
  restoreTitleTooltip(currentTarget)
}

const NO_CHILDREN_NAV_KEYS = new Set(['about', 'contact', 'est2014'])

function navLinkClassName({ isActive }, navKey) {
  return [
    'nav-link',
    NO_CHILDREN_NAV_KEYS.has(navKey) ? 'no-children' : '',
    isActive ? 'is-active' : '',
  ].filter(Boolean).join(' ')
}

function NavLinkLabel({ label, count, inverted = false }) {
  return (
    <span className={`nav-link__content${inverted ? ' nav-link__content--inverted' : ''}`} aria-hidden={inverted}>
      <span>{label}</span>
      {Number(count) > 0 ? <sup>{count}</sup> : null}
    </span>
  )
}

function handleTransitionLinkClick(event) {
  requestTransitionCapture()
  hideNavLinkOrb(event)
}

function handleFooterTransitionLinkClick() {
  requestTransitionCapture()
}

function handleLogoTransitionClick() {
  requestTransitionCapture()
}

function createMobileNavLinkClickHandler() {
  return (event) => {
    handleTransitionLinkClick(event)
    // Do not close the menu here. Closing on tap slides #mobile-nav away and
    // reveals TransitionFrame's frozen header clone (z-index 10001), which
    // briefly stacks above the nav. Route-change layout effect closes it once
    // page-transitioning is in place.
  }
}

function createNavLinkHandlers({ prefetch, onClick, hasFinePointer }) {
  const handlers = {
    onClick,
  }

  if (hasFinePointer) {
    handlers.onPointerDown = requestTransitionCapture
    handlers.onPointerEnter = (event) => {
      showNavLinkOrb(event)
      prefetch()
    }
    handlers.onPointerMove = showNavLinkOrb
    handlers.onPointerLeave = hideNavLinkOrb
    handlers.onFocus = (event) => {
      showNavLinkOrb(event)
      prefetch()
    }
    handlers.onBlur = hideNavLinkOrb
  } else {
    handlers.onTouchStart = () => prefetch()
  }

  return handlers
}

const socials = {
  linkedin: 'https://www.linkedin.com/company/simplrcreative/',
  instagram: 'https://www.instagram.com/simplrcreative/',
  awwwards: 'https://www.awwwards.com/Simplr-Creative/',
  vimeo: 'https://vimeo.com/simplrcreative/',
  facebook: 'https://www.facebook.com/simplrcreative/',
}

export default function RootLayout() {
  const layoutRef = useRef(null)
  const footerRef = useRef(null)
  const destroyLogoRef = useRef(null)
  const destroyNavSectionThemeRef = useRef(null)
  const previousPathRef = useRef(null)
  // Latches for the whole home visit — unlike cameFromNonHome, this does not flip
  // false on the next render when previousPathRef is updated to '/'.
  const returningToHomeRef = useRef(false)
  const { navigation } = useLoaderData()
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  const [isIntroVisible, setIsIntroVisible] = useState(() => {
    if (typeof window !== 'undefined' && window.__PRERENDER__) return false
    return window.location.pathname === '/'
  })
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [introComplete, setIntroComplete] = useState(false)
  const [shouldFadeOutIntro, setShouldFadeOutIntro] = useState(false)
  const [shouldRunHomeIntroAnimations, setShouldRunHomeIntroAnimations] = useState(false)
  const navigationState = useNavigation().state
  const deferredNavigationState = useDeferredValue(navigationState)
  const isNavigating = deferredNavigationState !== 'idle'
  const btnRef = useRef(null)
  const menuButtonRef = useRef(null)
  const mobileNavRef = useRef(null)
  const footerNavigation = navigation.filter(({ key }) => key !== 'thinking')
  const cameFromNonHome = isHomePage && previousPathRef.current && previousPathRef.current !== '/'
  const playHomeHeroIntro = shouldRunHomeIntroAnimations || returningToHomeRef.current || cameFromNonHome
  const hasFinePointer = useHasFinePointer()

  const closeMobileNav = useCallback(() => {
    setIsNavOpen(false)
    unlockScroll('nav')
  }, [])

  const toggleMobileNav = useCallback(() => {
    setIsNavOpen((open) => {
      if (open) {
        unlockScroll('nav')
        // Prefer leaving focus on the control when the user closes it directly.
        queueMicrotask(() => menuButtonRef.current?.focus())
        return false
      }
      // Freeze the menu theme to the page that opened it so a dark→light (or
      // light→dark) navigation cannot recolour the open panel mid-transition.
      const nav = mobileNavRef.current || document.getElementById('mobile-nav')
      if (nav) {
        nav.dataset.menuBg = document.documentElement.dataset.pageBg || 'light'
      }
      lockScroll('nav')
      return true
    })
  }, [])

  // Escape-to-close + focus move into / back out of the panel.
  useEffect(() => {
    const nav = mobileNavRef.current
    if (nav) {
      if (isNavOpen) nav.removeAttribute('inert')
      else nav.setAttribute('inert', '')
    }

    if (!isNavOpen) return undefined

    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      closeMobileNav()
      menuButtonRef.current?.focus()
    }

    window.addEventListener('keydown', onKeyDown)

    const firstLink = nav?.querySelector('a')
    firstLink?.focus()

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isNavOpen, closeMobileNav])

  useEffect(() => {
    window.dispatchEvent(new Event('app-shell-ready'))
  }, [])

  useEffect(() => {
    previousPathRef.current = location.pathname
  }, [location.pathname])

  useLayoutEffect(() => {
    if (isHomePage) return
    setShouldRunHomeIntroAnimations(false)
    setIsIntroVisible(false)
    document.documentElement.removeAttribute('data-home-intro-pending')
  }, [isHomePage])

  // Latch whether the current Home visit includes intro overlay or a return visit.
  useEffect(() => {
    if (isHomePage && isIntroVisible) {
      setShouldRunHomeIntroAnimations(true)
    }
  }, [isHomePage, isIntroVisible])

  useEffect(() => {
    if (isHomePage && cameFromNonHome) {
      setShouldRunHomeIntroAnimations(true)
    }
  }, [isHomePage, cameFromNonHome])

  // When landing on Home from a non-home start, there is no intro overlay.
  // Mark intro as complete so HomePage animation effects can initialize.
  useEffect(() => {
    if (isHomePage && !isIntroVisible && !introComplete) {
      setIntroComplete(true)
    }
  }, [isHomePage, isIntroVisible, introComplete])

  // Start minimum timer for intro, then dismiss.
  useEffect(() => {
    if (!isIntroVisible) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = setTimeout(() => {
      setShouldFadeOutIntro(true)
    }, reducedMotion ? 0 : INTRO_MIN_VISIBLE_MS)

    return () => clearTimeout(timer)
  }, [isHomePage, isIntroVisible])

  // On every route change: kill the previous logo animation, scroll to top,
  // and clear any GSAP inline styles left by the scroll animation.
  useLayoutEffect(() => {
    closeMobileNav()

    // Latch before previousPathRef updates in the effect below.
    if (isHomePage && previousPathRef.current && previousPathRef.current !== '/') {
      returningToHomeRef.current = true
    } else if (!isHomePage) {
      returningToHomeRef.current = false
    }

    destroyLogoRef.current?.()
    destroyLogoRef.current = null
    
    // Kill nav section theme watcher IMMEDIATELY before scroll/paint
    // to prevent race condition with old watcher firing on new page
    destroyNavSectionThemeRef.current?.()
    destroyNavSectionThemeRef.current = null
    
    scrollToTopImmediate()
    document.querySelector('#desktop-nav')?.classList.remove('light')
    document.querySelector('.logo-holder')?.classList.remove('light')
    document.documentElement.classList.remove('compact-logo-active')
    const footerLogo = document.querySelector('.footer-logo')
    footerLogo?.classList.remove('active')
    footerLogo?.style.removeProperty('opacity')
    footerLogo?.style.removeProperty('visibility')
    document.querySelector('.compact-logo')?.classList.remove('off')

    // Scope all GSAP targets to layoutRef.current so body-appended header/compact-logo
    // clones (used for the outgoing animation) aren't clobbered by these sets.
    const layout = layoutRef.current
    gsap.set(layout?.querySelector('.compact-logo'), { clearProps: 'all' })

    // Home page: logo starts hidden; the intro-entrance animation reveals it.
    // Non-home pages: logo is permanently in its compact end-state and visible.
    // This matches what TransitionFrame's applyCompactLogoState() does on routing,
    // so direct loads and client-side navigations behave identically.
    const {
      logoScale,
      logoY,
      taglineScale,
      taglineY,
      taglineX,
    } = getCompactLogoTransform()

    gsap.set(layout?.querySelector('.logo'), {
      autoAlpha: isHomePage ? 0 : 1,
      scale: logoScale,
      y: logoY,
      transformOrigin: 'left top',
      willChange: 'transform',
    })
    gsap.set(Array.from(layout?.querySelectorAll('#logo-implr g') ?? []), {
      autoAlpha: 0,
      x: -20,
      filter: 'blur(10px)',
    })
    gsap.set(layout?.querySelector('.tagline'), {
      autoAlpha: isHomePage ? 0 : 1,
      y: taglineY,
      x: taglineX,
      scale: taglineScale,
      transformOrigin: 'left top',
      willChange: 'transform',
    })
    if (isHomePage) {
      gsap.set(layout?.querySelector('#desktop-nav'), {
        autoAlpha: 0,
        y: -30,
      })
      gsap.set(layout?.querySelector('.menu-icon'), {
        autoAlpha: 0,
        x: 30,
      })
    } else {
      gsap.set(layout?.querySelector('#desktop-nav'), {
        autoAlpha: 1,
        y: 0,
        clearProps: 'opacity,visibility,transform',
      })
      gsap.set(layout?.querySelector('.menu-icon'), {
        autoAlpha: 1,
        x: 0,
        clearProps: 'opacity,visibility,transform',
      })
    }
  }, [closeMobileNav, location.pathname, isHomePage])

  useEffect(() => {
    if (!isHomePage) {
      // Non-home: set up logo page animation and nav theme immediately.
      destroyLogoRef.current = createLogoPageAnimation(layoutRef.current)
      destroyNavSectionThemeRef.current = createNavSectionTheme(layoutRef.current)
      return () => { destroyNavSectionThemeRef.current?.() }
    }

    // Home page: always wire up the nav section theme.
    destroyNavSectionThemeRef.current = createNavSectionTheme(layoutRef.current)

    // Home page: wait for the loader to finish before revealing the logo.
    if (!introComplete) return () => { destroyNavSectionThemeRef.current?.() }

    let entranceCleanup = null

    const playHomeEntranceAnimation = () => {
      entranceCleanup?.()
      entranceCleanup = null

      const logo = layoutRef.current?.querySelector('.logo')
      const tagline = layoutRef.current?.querySelector('.tagline')
      const implrPaths = layoutRef.current?.querySelectorAll('#logo-implr g')
      const mainNav = layoutRef.current?.querySelector('#desktop-nav')
      const menuIcon = layoutRef.current?.querySelectorAll('.menu-icon')

      const entranceTl = gsap.timeline({
        onComplete: () => {
          destroyLogoRef.current?.()
          destroyLogoRef.current = createLogoScrollAnimation(layoutRef.current)
        },
      })

      entranceTl.to(logo, { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0)
      entranceTl.to(tagline, { autoAlpha: 1, y: 0, x: 0, scale: 1, duration: 0.6, ease: 'power2.out' }, 0)
      entranceTl.to(
        Array.from(implrPaths),
        { x: 0, filter: 'blur(0px)', autoAlpha: 1, stagger: -0.1, duration: 0.4, ease: 'power2.out' },
        0.15,
      )
      entranceTl.to(
        mainNav,
        {
          y: 0,
          autoAlpha: 1,
          duration: 1,
          ease: 'power4.out',
        },
        HOME_NAV_INTRO_DELAY_S,
      )

      entranceTl.to(menuIcon, { x: 0, autoAlpha: 1, duration: 1, ease: 'power4.out' }, HOME_NAV_INTRO_DELAY_S)
      entranceTl.call(
        () => {
          window.__homeNavIntroStartedAt = performance.now()
          window.dispatchEvent(new Event(HOME_NAV_INTRO_START_EVENT))
        },
        [],
        HOME_NAV_INTRO_DELAY_S,
      )
      entranceTl.call(
        () => window.dispatchEvent(new Event(HOME_HERO_TITLE_INTRO_EVENT)),
        [],
        HOME_NAV_INTRO_DELAY_S + HOME_HERO_TITLE_AFTER_NAV_S,
      )
      entranceTl.call(
        () => window.dispatchEvent(new Event(HOME_HERO_VIDEO_INTRO_EVENT)),
        [],
        HOME_NAV_INTRO_DELAY_S + HOME_HERO_VIDEO_AFTER_NAV_S,
      )

      entranceCleanup = () => {
        entranceTl.kill()
        destroyLogoRef.current?.()
        destroyLogoRef.current = null
      }
    }

    // Returning to Home: wait for the page transition to finish.
    if (returningToHomeRef.current) {
      let hasStarted = false
      const startEntrance = () => {
        if (hasStarted) return
        hasStarted = true
        returningToHomeRef.current = false
        playHomeEntranceAnimation()
      }

      let timer = 0
      let cancelled = false
      requestAnimationFrame(() => {
        if (cancelled) return
        if (document.documentElement.classList.contains('page-transitioning')) {
          window.addEventListener(PAGE_TRANSITION_COMPLETE_EVENT, startEntrance, { once: true })
          timer = window.setTimeout(startEntrance, HOME_RETURN_ENTRANCE_FALLBACK_MS)
          return
        }
        startEntrance()
      })

      return () => {
        cancelled = true
        clearTimeout(timer)
        window.removeEventListener(PAGE_TRANSITION_COMPLETE_EVENT, startEntrance)
        entranceCleanup?.()
        destroyNavSectionThemeRef.current?.()
      }
    }

    // Initial load after intro overlay — animate logo from compact → full,
    // then hand off to the scroll animation.
    playHomeEntranceAnimation()
    return () => {
      entranceCleanup?.()
      destroyNavSectionThemeRef.current?.()
    }
  }, [location.pathname, isHomePage, introComplete])

  useEffect(() => {
    let resizeTimer = 0
    const onOrientationChange = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        const layout = layoutRef.current
        if (!layout) return

        // Re-derive compact logo values for the new viewport width.
        const {
          logoScale,
          logoY,
          taglineScale,
          taglineY,
          taglineX,
        } = getCompactLogoTransform()

        // Non-home pages sit in compact state — update the inline values.
        if (!isHomePage) {
          gsap.set(layout.querySelector('.logo'), { scale: logoScale, y: logoY })
          gsap.set(layout.querySelector('.tagline'), { scale: taglineScale, y: taglineY, x: taglineX })
        }

        // Rebuild the logo scroll / page animation with fresh measurements.
        destroyLogoRef.current?.()
        destroyLogoRef.current = isHomePage
          ? createLogoScrollAnimation(layout)
          : createLogoPageAnimation(layout)
      }, 200)
    }

    window.addEventListener('orientationchange', onOrientationChange)
    window.addEventListener('resize', onOrientationChange)
    return () => {
      window.removeEventListener('orientationchange', onOrientationChange)
      window.removeEventListener('resize', onOrientationChange)
      window.clearTimeout(resizeTimer)
    }
  }, [isHomePage])

  useEffect(() => {
    return createSmoothScroll()
  }, [])

  useEffect(() => {
    refreshSmoothScroll()
  }, [location.pathname])

  useEffect(() => {
    if (!isScrollTriggerDebugEnabled()) return

    let rafId = 0
    let shortDelayTimer = 0
    let longDelayTimer = 0

    const route = location.pathname
    const logTransitionComplete = () => {
      logRouteScrollTriggerState(route, 'transition-complete')
    }

    rafId = requestAnimationFrame(() => {
      logRouteScrollTriggerState(route, 'post-nav-raf')
    })

    shortDelayTimer = window.setTimeout(() => {
      logRouteScrollTriggerState(route, 'post-nav-600ms')
    }, 600)

    longDelayTimer = window.setTimeout(() => {
      logRouteScrollTriggerState(route, 'post-nav-1800ms')
    }, 1800)

    window.addEventListener(PAGE_TRANSITION_COMPLETE_EVENT, logTransitionComplete)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.clearTimeout(shortDelayTimer)
      window.clearTimeout(longDelayTimer)
      window.removeEventListener(PAGE_TRANSITION_COMPLETE_EVENT, logTransitionComplete)
    }
  }, [location.pathname])

  // Derive pageBg from the matched route's handle, falling back to 'light'.
  // Set handle: { pageBg: 'dark' } on any route that opens on a coffee section.
  const matches = useMatches()
  const pageBg = matches.findLast((m) => m.handle?.pageBg)?.handle.pageBg ?? 'light'
  const hideFooter = matches.findLast((m) => m.handle?.hideFooter !== undefined)?.handle.hideFooter ?? false
  const isDarkPageBg = pageBg === 'dark'

  // Set html[data-page-bg] synchronously before the browser paints.
  useLayoutEffect(() => {
    document.documentElement.dataset.pageBg = pageBg
  }, [pageBg])

  useEffect(() => {
    if (btnRef.current) return createBtnHoverAnimation(btnRef.current)
  }, [])

  // NOTE: createSplitTextAnimation() is intentionally NOT called here.
  // RootLayout never unmounts during SPA navigation, so a [] effect's cleanup
  // never fires — its MutationObserver/IntersectionObserver chain would silently
  // accumulate a new ScrollTrigger per .split-text element on every page visit.
  // Each page component calls createSplitTextAnimation() with its own useEffect
  // so cleanup runs correctly on unmount.

  // Footer DOM is static — recreating this animation on every route change is
  // unnecessary and accumulates gsap.matchMedia() contexts.
  useEffect(() => {
    if (hideFooter || !footerRef.current) return undefined
    return createFooterAnimation(footerRef.current)
  }, [hideFooter])

  return (
    <div 
      ref={layoutRef} 
      className="relative min-h-screen"
      data-intro-visible={isHomePage && isIntroVisible ? 'true' : 'false'}
    >
      {isIntroVisible ? (
        <IntroOverlay 
          shouldFadeOut={shouldFadeOutIntro}
          onFadeOutComplete={() => {
            document.documentElement.removeAttribute('data-home-intro-pending')
            setIsIntroVisible(false)
            if (isHomePage) {
              setTimeout(() => setIntroComplete(true), 100)
            }
          }}
        />
      ) : null}

      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent">
        <div
          className={`h-full origin-left bg-clay-500 transition-transform duration-500 ${
            isNavigating ? 'scale-x-100' : 'scale-x-0'
          }`}
        />
      </div>

      <div className="compact-logo fixed top-[1.25rem] left-[1.25rem] z-[1003]">
        <Link
          id="compact-logo-link"
          to="/"
          title="Simplr | Creative. Applied. Intelligence."
          onPointerDown={requestTransitionCapture}
          onClick={handleLogoTransitionClick}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 54 47">
            <path d="M31.9489 0C30.5211 0.891479 28.9883 1.30007 27.0474 1.30007C25.3848 1.30007 23.4439 1.0153 20.8541 0.557174C19.9641 0.396213 19.0802 0.260015 18.2148 0.154771C25.3909 1.8882 29.8165 5.3303 31.9489 9.21195V0Z"/>
            <path d="M0.111328 33.9941V46.2334C1.71838 45.2862 3.28834 44.7909 4.91394 44.7352C5.10555 44.729 5.30334 44.7228 5.51349 44.7228C7.32451 44.7228 9.61147 44.9952 12.3002 45.54C12.6154 45.6019 12.9368 45.6638 13.2582 45.7196C5.84726 43.689 2.70115 38.7239 0.111328 33.9941Z"/>
            <path d="M24.5075 45.744C27.3879 44.5739 28.8836 42.3885 28.8836 39.2684C28.8836 37.1635 28.0616 35.2939 26.4422 33.7028C24.0996 31.2946 20.8299 29.8955 17.0409 28.2673C16.0087 27.8215 14.9518 27.3696 13.8701 26.8805C11.305 25.7476 8.90059 24.5094 6.96595 23.5189C2.60837 21.1107 0 17.2043 0 13.0688C0 9.46575 1.39072 6.33319 4.14125 3.764C5.89046 2.12343 7.83128 0.990508 9.93281 0.365234C7.91782 1.44863 6.75579 3.40493 6.75579 5.9184C6.75579 12.8336 13.2582 15.2294 20.1376 17.7738C27.7278 20.5783 35.5715 23.4694 35.5715 32.6999C35.5715 36.9159 34.0509 40.1784 30.9357 42.6733C29.0629 44.1344 26.9366 45.1558 24.5137 45.744H24.5075Z" />
            <circle cx="48.3376" cy="5.16818" r="5.16818"/>
          </svg>
        </Link>
      </div>

      <button
        ref={menuButtonRef}
        type="button"
        className={`menu-icon fixed top-[1.75rem] right-[1.75rem] md:right-[2.75rem] md:top-[2.75rem] w-[1.75rem] h-[1.75rem] bg-black rounded-full flex justify-center items-center ${isNavOpen ? ' active' : ''}`}
        aria-label={isNavOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isNavOpen}
        aria-controls="mobile-nav"
        onClick={toggleMobileNav}
      >
        <span className="flex flex-col gap-[0.25rem]" aria-hidden="true">
          <span className="menu-icon-dot-alt w-[0.35rem] h-[0.35rem] rounded-full bg-white" />
          <span className="menu-icon-dot w-[0.35rem] h-[0.35rem] rounded-full bg-white" />
        </span>
        <span className="flex flex-col gap-[0.25rem]" aria-hidden="true">
          <span className="menu-icon-dot-alt w-[0.35rem] h-[0.35rem] rounded-full bg-white" />
          <span className="menu-icon-dot-alt w-[0.35rem] h-[0.35rem] rounded-full bg-white" />
        </span>
      </button>

      <nav
        ref={mobileNavRef}
        id="mobile-nav"
        className={`main flex flex-col lg:hidden flex-wrap items-start gap-[2.5rem]${isNavOpen ? ' active' : ''}`}
        aria-hidden={!isNavOpen}
      >
        {navigation.map((item) => {
          const prefetch = useRoutePrefetch(item.path)
          return (
            <NavLink
              key={item.key}
              to={item.path}
              title={hasFinePointer ? item.label : undefined}
              className={(classState) => navLinkClassName(classState, item.key)}
              {...createNavLinkHandlers({
                prefetch,
                onClick: createMobileNavLinkClickHandler(),
                hasFinePointer,
              })}
            >
              <NavLinkLabel label={item.label} count={item.count} />
              <NavLinkLabel label={item.label} count={item.count} inverted />
            </NavLink>
          )
        })}
      </nav>

      <header className={`header fixed z-[1001] md:z-5 w-full pb-5${isHomePage ? '' : ' page-header'}`}>
        <div className="nav-holder flex px-5 pt-[1.25rem] md:pt-[3.125rem] flex-row items-start justify-between">
          
          <div className="logo-holder ">
              <Link
                id="logo-link"
                to="/"
                onPointerDown={requestTransitionCapture}
                onClick={handleLogoTransitionClick}
                title="Simplr | Creative. Applied. Intelligence."
              >
                <BrandLogo />
                <div className="tagline">
                  <span>Creative.</span><br/>
                  Applied.<br/>
                  Intelligence.
                </div>
              </Link>
            
          </div>

          <nav id="desktop-nav" className="main hidden lg:flex flex-row flex-wrap items-start gap-[2.5rem]__ pt-[1.875rem]__">
            {navigation.map((item) => {
              const prefetch = useRoutePrefetch(item.path)
              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  title={hasFinePointer ? item.label : undefined}
                  className={(classState) => navLinkClassName(classState, item.key)}
                  {...createNavLinkHandlers({
                    prefetch,
                    onClick: handleTransitionLinkClick,
                    hasFinePointer,
                  })}
                >
                  <span className="nav-link__orb" aria-hidden="true" />
                  <NavLinkLabel label={item.label} count={item.count} />
                  <NavLinkLabel label={item.label} count={item.count} inverted />
                </NavLink>
              )
            })}
          </nav>
        </div>
      </header>

      

      <main>
        <TransitionFrame>
          <Outlet context={{ introComplete, shouldRunHomeIntroAnimations: playHomeHeroIntro }} />
        </TransitionFrame>
      </main>

      {!hideFooter ? (
        <>
        <div className={`footer-logo-trigger py-5 footer-off__ ${isDarkPageBg ? 'bg-coffee section-dark' : 'bg-white section-light'}`}></div>

        <footer ref={footerRef} className={`px-5 pb-10 md:pt-0 min-h-[100svh] md:min-h-[100vh] flex flex-col justify-end ${isDarkPageBg ? 'bg-coffee text-white' : 'bg-white text-coffee'}`}>
          <div className={`footer-logo md:mb-5 ${isDarkPageBg ? 'text-white' : 'text-coffee'}`}>
            <svg width="100%" viewBox="0 0 527 172" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <g>
                  <path d="M453.161 132.45C457.161 129.058 461.518 122.437 461.518 113.339V64.6008C461.518 57.4588 460.036 52.5599 456.875 49.1863L455.821 48.0737C454.196 46.3331 453.589 45.687 452.036 44.5745L487.394 44.395V113.339C487.394 121.163 490.055 127.587 495.287 132.45H453.143H453.161Z" />
                  <path d="M515.053 67.9566C508.392 67.9566 506.892 64.906 505.142 61.3709C503.856 58.7509 502.089 55.1799 497.624 55.1799C495.66 55.1799 493.82 56.113 491.945 58.1408C496.785 49.2582 503.964 44.772 513.321 44.772C521.375 44.772 527 49.7606 527 56.9026C527 62.8961 521.518 67.9386 515.035 67.9386L515.053 67.9566Z" />
                </g>
                <g>
                  <path d="M399.376 132.45C403.483 129.453 407.698 123.011 407.698 113.877V20.3671C407.698 9.86947 403.144 3.08636 398.858 0.412598H433.591V113.877C433.591 124.805 438.377 130.099 441.663 132.45H399.376Z" />
                </g>
                <g>
                  <path d="M289.227 172C293.512 168.501 297.87 161.269 297.87 152.351V64.0625C297.87 53.5468 293.977 46.6381 289.405 44.0361H323.763V120.122L324.121 120.678C328.246 127.192 331.389 131.319 336.139 133.239C332.871 132.252 329.978 130.763 327.442 128.789L323.763 125.936V152.351C323.763 161.413 326.21 168.016 331.067 172H289.244H289.227Z" />
                  <path d="M347.656 134.783C359.603 130.745 361.264 111.329 361.264 94.1561C361.264 86.4758 360.585 79.4235 359.228 73.1967C357.978 66.4674 355.656 60.5097 352.299 55.5032C347.763 48.4329 342.156 46.9615 338.263 46.9615C337.334 46.9615 336.406 47.0512 335.513 47.2306C339.709 44.8081 342.62 44.8081 348.138 44.8081C359.674 44.8081 368.978 48.9533 376.568 57.4771C384.211 65.8932 388.086 76.4626 388.086 88.8983C388.086 101.962 384.193 112.639 376.175 121.576C368.353 130.297 359.014 134.621 347.656 134.801V134.783Z" />
                </g>
                <g>
                  <path d="M179.723 132.45C183.991 129.166 187.777 121.97 187.777 113.339V77.0186C187.777 65.857 186.92 58.8586 185.062 54.9825C183.83 51.914 180.848 48.1097 174.008 48.1097C171.383 48.1097 168.937 48.7019 166.669 49.8683C171.098 46.4588 176.437 44.772 182.812 44.772C201.831 44.772 213.653 55.808 213.653 73.5912V113.321C213.653 122.437 217.956 129.274 221.921 132.432H179.705L179.723 132.45Z" />
                  <path d="M237.241 132.45C241.509 129.166 245.294 121.97 245.294 113.339V77.0186C245.294 65.857 244.437 58.8586 242.58 54.9825C241.348 51.914 238.366 48.1097 231.526 48.1097C228.901 48.1097 226.454 48.7019 224.187 49.8683C228.615 46.4588 233.955 44.772 240.33 44.772C259.348 44.772 271.17 55.808 271.17 73.5912V113.321C271.17 122.437 275.474 129.274 279.438 132.432H237.223L237.241 132.45Z" />
                </g>
                <g>
                  <path d="M120.483 132.45C123.858 130.171 128.447 125.021 128.447 113.877V62.6271C128.447 54.4443 125.394 48.3072 119.375 44.3594L154.52 44.2876V113.877C154.52 124.734 158.841 129.992 162.252 132.45H120.483Z" />
                </g>
                <path d="M92.305 0C88.1798 2.58404 83.7511 3.76839 78.1438 3.76839C73.34 3.76839 67.7327 2.94294 60.2503 1.61503C57.6788 1.14846 55.1251 0.753679 52.625 0.448618C73.3579 5.47314 86.144 15.4504 92.305 26.7018V0Z" />
                <path d="M0.322266 98.5352V134.012C4.96529 131.266 9.50116 129.831 14.1978 129.669C14.7513 129.651 15.3228 129.633 15.93 129.633C21.1623 129.633 27.7697 130.423 35.5378 132.002C36.4485 132.182 37.3771 132.361 38.3058 132.522C16.8943 126.637 7.80467 112.245 0.322266 98.5352Z" />
                <path d="M70.8061 132.594C79.1278 129.202 83.4494 122.868 83.4494 113.824C83.4494 107.723 81.0743 102.303 76.3955 97.6915C69.6275 90.711 60.1807 86.6554 49.2339 81.936C46.2516 80.644 43.198 79.334 40.0728 77.9164C32.6619 74.6325 25.7152 71.0435 20.1257 68.1724C7.53598 61.1919 0 49.8687 0 37.8817C0 27.4378 4.018 18.3578 11.9647 10.9107C17.0185 6.15538 22.6258 2.8715 28.6974 1.05908C22.8758 4.19941 19.5185 9.86995 19.5185 17.1555C19.5185 37.1998 38.3049 44.1444 58.1806 51.5197C80.11 59.6486 102.771 68.0288 102.771 94.7844C102.771 107.005 98.3785 116.462 89.3781 123.693C83.9672 127.928 77.8242 130.889 70.8239 132.594H70.8061Z" />
              
              <ellipse id="logo-dot-footer" cx="139.655" cy="14.9805" rx="14.9317" ry="14.9805"/>
            </svg>
          </div>
        
        <div className="grid grid-cols-12">
          <div className="col-start-1 col-span-12 md:col-span-8">
            <h2 className={`h1 ${isDarkPageBg ? 'text-white' : 'text-coffee'}`}>Let&apos;s design something that lasts.</h2>
            <div className="button-wrapper">
              <Link 
                to="contact"
                ref={btnRef}
                className={`btn relative mt-5 xl:mt-10 ${isDarkPageBg ? 'alt' : ''}`}
                onPointerDown={requestTransitionCapture}
                onClick={handleFooterTransitionLinkClick}
                title="Contact Simplr"
              >
                <span>Start a project</span>
              </Link>
            </div>
          </div>
          <div className="hidden col-start-1 col-span-12 mt-16 lg:col-start-7 lg:col-span-6">
            <div className={`flex flex-col items-end gap-6 pt-[0.875rem] text-right ${isDarkPageBg ? 'text-white' : 'text-coffee'}`}>
              <nav className="flex flex-wrap justify-end gap-x-8 gap-y-3 font-medium text-[1.375rem] leading-[0.875rem]">
                {footerNavigation.map((item) => (
                  <Link
                    key={item.key}
                    to={item.path}
                    className="inline-flex items-start gap-[0.125rem] transition-opacity duration-200 hover:opacity-70"
                    onPointerDown={(event) => {
                      prefetchRoute(item.path)
                      requestTransitionCapture(event)
                    }}
                    onClick={handleFooterTransitionLinkClick}
                    title={item.label}
                  >
                    <span>{item.label}</span>
                    {Number(item.count) > 0 ? <sup className="font-normal text-[0.75rem] leading-[0.875rem]">{item.count}</sup> : null}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="pt-10 pb-5 lg:pb-0 xl:pt-20 grid grid-cols-1 gap-14 lg:grid-cols-12n">
          <div className="footer-details lg:col-start-1 lg:col-span-6">
                <div className={`socials flex flex-col lg:flex-row gap-[1.25rem] lg:gap-[2.5rem] mb-5 xl:mb-[3.75rem] ${isDarkPageBg ? 'text-white' : 'text-coffee'}`}>
                  {Object.entries(socials).map(([title, url]) => (
                    <a
                      key={title}
                      href={url}
                      title={title}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {title}
                    </a>
                  ))}
                </div>
                <div className={`footer-details-meta max-w-[20rem] ${isDarkPageBg ? 'text-white' : 'text-coffee'}`}>
                  <div>Unit AS02, The Forum, Lifestyle House,<br/>Northbank Lane, Century City,<br/>South Africa</div>
                  <div className="mt-5 mb-0 xl:my-[3.75rem]">
                    Simplr © 2026<br/>
                    <a href="/privacy-policy/" title="Privacy policy">Privacy policy</a> | <a href="mailto:hello@simplr.co.za" title="Let's talk">hello@simplr.co.za</a>
                  </div>
                </div>
          </div>

          <div className={`hidden md:flex items-end col-start-7 col-span-6 justify-end pb-5 footer-logo-trigger ${isDarkPageBg ? 'text-white' : 'text-coffee'}`}>
              <svg width="155" height="158" viewBox="0 0 155 158" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                  <g className="footer-logo-circle-text">
                    <path d="M24.9034 21.8563C25.2444 21.5405 25.6041 21.3225 25.9825 21.2024C26.3536 21.0745 26.7172 21.0473 27.0732 21.1207C27.4221 21.1864 27.7365 21.3703 28.0165 21.6726C28.2175 21.8896 28.3206 22.1253 28.3258 22.3796C28.331 22.634 28.2252 22.8617 28.0082 23.0627C27.8532 23.2063 27.6703 23.2964 27.4596 23.3332C27.2495 23.3551 27.0524 23.3289 26.8683 23.2546L26.8432 22.7378C26.8253 22.4232 26.736 22.2179 26.5752 22.1221C26.415 22.0113 26.2251 21.9928 26.0055 22.0667C25.7864 22.1256 25.5762 22.2483 25.3747 22.435C25.1112 22.6791 24.9248 22.9598 24.8155 23.277C24.7062 23.5943 24.6853 23.9448 24.7529 24.3286C24.8282 24.7053 24.9958 25.1116 25.2557 25.5477C25.5084 25.9759 25.8609 26.4342 26.3132 26.9224C26.7009 27.3409 27.0959 27.6662 27.4981 27.8984C27.9081 28.1234 28.3039 28.232 28.6855 28.2241C29.0748 28.2091 29.4321 28.0508 29.7576 27.7493C29.9514 27.5698 30.1087 27.3665 30.2295 27.1394C30.3508 26.8974 30.4396 26.6279 30.4958 26.331C30.5526 26.0193 30.5804 25.6839 30.5791 25.3251L31.2286 25.3499C31.245 25.5075 31.2519 25.7171 31.2494 25.9786C31.2474 26.2252 31.2106 26.5041 31.1389 26.8154C31.0749 27.1194 30.9623 27.4253 30.8011 27.7331C30.6547 28.0415 30.4343 28.3321 30.1398 28.6049C29.6516 29.0572 29.1257 29.3211 28.5621 29.3968C27.9986 29.4724 27.4339 29.3835 26.868 29.1302C26.3026 28.8619 25.7759 28.4642 25.2877 27.9372C24.821 27.4335 24.4559 26.915 24.1922 26.3816C23.9291 25.8333 23.7816 25.2932 23.7496 24.7612C23.7182 24.2143 23.794 23.6977 23.977 23.2113C24.1606 22.71 24.4694 22.2584 24.9034 21.8563Z"/>
                    <path d="M36.4083 14.9086C36.3035 14.7128 36.1995 14.5903 36.0963 14.5413C35.9877 14.4831 35.8609 14.4974 35.7158 14.5841C35.6251 14.6383 35.5299 14.7261 35.43 14.8473C35.3248 14.9594 35.1968 15.116 35.0461 15.3168L34.5223 14.873C34.5986 14.7536 34.7012 14.6061 34.8301 14.4305C34.959 14.255 35.1051 14.0877 35.2685 13.9285C35.4354 13.7548 35.6096 13.6138 35.7909 13.5054C36.1808 13.2723 36.5187 13.2303 36.8048 13.3793C37.0908 13.5283 37.3466 13.843 37.5723 14.3235L38.6963 16.6977L38.7861 16.6625L38.3825 14.1345C38.3072 13.638 38.2716 13.2285 38.2757 12.906C38.2889 12.5781 38.3473 12.3155 38.4509 12.1182C38.5635 11.9155 38.7377 11.7437 38.9735 11.6027C39.2002 11.4672 39.4104 11.3969 39.6043 11.3918C39.8072 11.3812 39.9856 11.4223 40.1394 11.5149C40.3024 11.6021 40.4326 11.7273 40.5302 11.8905C40.644 12.081 40.698 12.2948 40.6922 12.5321C40.69 12.755 40.6163 12.9714 40.4711 13.1813L39.9468 13.0147C39.7803 12.942 39.6499 12.9091 39.5557 12.9162C39.4705 12.9179 39.3871 12.9431 39.3055 12.9919C39.2421 13.0299 39.1912 13.0787 39.1531 13.1384C39.115 13.1982 39.0886 13.2878 39.0739 13.4073C39.0592 13.5269 39.0571 13.6881 39.0677 13.8911C39.0782 14.094 39.1077 14.3594 39.1561 14.6874C39.2544 15.4902 39.3386 16.1353 39.4084 16.6228C39.4783 17.1102 39.5429 17.4962 39.6023 17.7807C39.6707 18.0599 39.7382 18.2964 39.805 18.4903C39.8808 18.6789 39.9692 18.8783 40.0703 19.0886L40.6147 20.2771L39.6082 20.8788L36.4083 14.9086Z"/>
                    <path d="M53.3478 5.32542C54.1007 5.07886 54.7088 5.06872 55.1719 5.295C55.6351 5.52128 55.9587 5.91552 56.1428 6.47773C56.2809 6.89939 56.3106 7.27871 56.232 7.6157C56.1634 7.9494 56.0181 8.25263 55.7962 8.52539C55.581 8.78482 55.3309 9.02236 55.0458 9.23799C54.7607 9.45362 54.4757 9.65255 54.1908 9.83478L52.6523 10.7887C52.8203 11.2339 53.0371 11.6243 53.3026 11.9597C53.568 12.2952 53.8791 12.5324 54.2359 12.6712C54.5926 12.8101 54.9767 12.8121 55.3884 12.6774C55.6293 12.5985 55.8437 12.4893 56.0315 12.35C56.2293 12.2074 56.4141 12.0247 56.5856 11.8018C56.7572 11.5788 56.929 11.3058 57.1011 10.9827L57.6707 11.2964C57.6165 11.4364 57.5354 11.613 57.4273 11.8263C57.326 12.0262 57.1812 12.2459 56.9929 12.4854C56.8113 12.7116 56.5863 12.9242 56.318 13.1232C56.053 13.3323 55.7348 13.4977 55.3633 13.6193C54.7208 13.8297 54.1227 13.8532 53.569 13.69C53.0254 13.5234 52.5493 13.2068 52.1409 12.7403C51.7392 12.2605 51.4266 11.6792 51.2031 10.9965C50.917 10.1231 50.8145 9.30075 50.8954 8.52948C50.9763 7.75822 51.2254 7.09308 51.6426 6.53405C52.0565 5.96499 52.6249 5.56212 53.3478 5.32542ZM54.8173 6.96178C54.7417 6.73088 54.6442 6.53493 54.5248 6.37395C54.4054 6.21296 54.259 6.10528 54.0855 6.05091C53.9088 5.9865 53.7 5.99375 53.459 6.07265C53.0474 6.20743 52.7287 6.45629 52.503 6.81923C52.284 7.16884 52.1647 7.6192 52.1451 8.1703C52.1322 8.70808 52.224 9.34497 52.4206 10.081L53.8133 9.19137C54.1351 8.98595 54.3901 8.78018 54.5783 8.57406C54.7632 8.35789 54.8747 8.1213 54.9128 7.86427C54.9609 7.60395 54.9291 7.30312 54.8173 6.96178Z"/>
                    <path d="M73.6702 8.6751C73.6805 8.92864 73.7158 9.10063 73.7762 9.19106C73.8472 9.28062 73.9616 9.31892 74.1196 9.30593C74.2459 9.29555 74.3797 9.24745 74.5211 9.16163C74.6624 9.07581 74.8069 8.96324 74.9544 8.82392L75.3263 9.28623C75.2191 9.40103 75.0707 9.52983 74.8811 9.67261C74.7011 9.80401 74.504 9.9209 74.2898 10.0233C74.0756 10.1257 73.858 10.186 73.6369 10.2042C73.3632 10.2267 73.1316 10.1821 72.9422 10.0705C72.7537 9.96939 72.6131 9.80606 72.5204 9.58049C72.4268 9.34439 72.3819 9.05659 72.3858 8.71708L72.4407 5.51679L72.3289 5.51009L72.0468 7.10732C71.9611 7.61254 71.8558 8.07168 71.7307 8.48475C71.6048 8.88728 71.4483 9.23934 71.2611 9.54092C71.0835 9.8311 70.8587 10.0616 70.5865 10.2323C70.3249 10.4022 70.0046 10.5028 69.6256 10.5339C69.0676 10.5798 68.5922 10.4705 68.1995 10.206C67.8164 9.93009 67.5194 9.54112 67.3086 9.03907C67.0977 8.53702 66.9659 7.96488 66.9131 7.32265C66.8516 6.57513 66.8853 5.88869 67.0141 5.26332C67.142 4.62743 67.3505 4.06971 67.6397 3.59015C67.9289 3.1106 68.2846 2.73157 68.7069 2.45306C69.1283 2.16403 69.6075 1.99744 70.1444 1.9533C70.5235 1.92214 70.8801 1.94052 71.2142 2.00845C71.5581 2.06498 71.8286 2.13283 72.0259 2.21201L73.07 1.7605L73.3173 1.86737L73.6702 8.6751ZM69.7939 9.48664C70.0571 9.465 70.2787 9.38849 70.4587 9.25709C70.6387 9.1257 70.7955 8.90612 70.9292 8.59834C71.0629 8.29056 71.1928 7.8718 71.3188 7.34205C71.444 6.80178 71.5834 6.11195 71.737 5.27255L72.1395 3.01354C71.8984 2.91677 71.6116 2.84495 71.2792 2.79808C70.9564 2.73982 70.6476 2.72281 70.3528 2.74704C69.9948 2.77647 69.6767 2.90332 69.3983 3.12759C69.1305 3.351 68.9064 3.65561 68.7262 4.04142C68.5459 4.42722 68.419 4.88283 68.3456 5.40825C68.2828 5.9328 68.2769 6.50566 68.3279 7.12684C68.3747 7.69538 68.4553 8.16043 68.5698 8.522C68.694 8.87218 68.8529 9.12941 69.0466 9.29368C69.25 9.44655 69.4991 9.51087 69.7939 9.48664Z"/>
                    <path d="M84.8478 2.34792L86.1052 2.39349L87.0754 0L87.8917 0.112657L87.4037 2.6047L89.8368 2.94051L89.6792 3.73456L87.2619 3.40093L86.2979 8.53063C86.2149 8.97772 86.236 9.32722 86.3612 9.57911C86.4968 9.83244 86.7478 9.98438 87.1141 10.0349C87.4385 10.0797 87.7423 10.0417 88.0256 9.9208C88.3103 9.78947 88.5956 9.61556 88.8814 9.39907L89.2424 9.91278C89.0313 10.1289 88.7864 10.3191 88.5078 10.4832C88.2397 10.6488 87.9519 10.7638 87.6445 10.828C87.3356 10.9026 87.0084 10.9161 86.6631 10.8685C85.8992 10.763 85.3884 10.4846 85.1308 10.0331C84.8732 9.58168 84.8151 8.99781 84.9566 8.28152L85.8962 3.21244L84.6561 3.04129L84.8478 2.34792Z"/>
                    <path d="M99.9197 6.77541C100.014 6.55048 100.046 6.38308 100.014 6.27319C99.9929 6.16653 99.8968 6.08579 99.7257 6.03097C99.595 5.98904 99.4427 5.9624 99.2688 5.95104C99.0949 5.93969 98.8879 5.94541 98.6476 5.96823L98.6304 5.34703C98.857 5.29765 99.1506 5.26419 99.5112 5.24667C99.8718 5.22915 100.218 5.2736 100.55 5.38002C100.822 5.46709 101.024 5.5984 101.156 5.77393C101.298 5.9527 101.366 6.17408 101.359 6.43809C101.355 6.69204 101.277 7.00531 101.124 7.3779L99.1713 12.2764C99.0903 12.4945 99.0522 12.6653 99.057 12.7889C99.075 12.9056 99.1645 12.9897 99.3255 13.0413C99.4462 13.08 99.6016 13.0799 99.7915 13.041C99.9916 13.0053 100.22 12.9341 100.476 12.8276L100.643 13.397C100.51 13.4653 100.33 13.5409 100.104 13.6237C99.8809 13.6964 99.6326 13.7444 99.3589 13.7676C99.0852 13.7908 98.8025 13.7556 98.5108 13.6621C98.199 13.5621 97.9785 13.4193 97.8494 13.2337C97.7171 13.0582 97.6546 12.8551 97.662 12.6245C97.6693 12.3939 97.7218 12.1611 97.8193 11.9262L99.9197 6.77541ZM100.75 2.73177C100.844 2.44003 101.012 2.22763 101.254 2.09454C101.496 1.96145 101.763 1.94167 102.055 2.03519C102.246 2.09646 102.398 2.19494 102.509 2.33062C102.635 2.45947 102.713 2.61225 102.745 2.78894C102.781 2.95558 102.766 3.13949 102.701 3.34069C102.608 3.63242 102.44 3.84483 102.198 3.97791C101.965 4.11423 101.703 4.13562 101.412 4.0421C101.12 3.94858 100.913 3.78226 100.79 3.54314C100.67 3.29396 100.657 3.0235 100.75 2.73177Z"/>
                    <path d="M115.908 11.6729C116.287 11.8836 116.482 12.1736 116.494 12.543C116.506 12.9124 116.399 13.3002 116.173 13.7063C115.936 14.1308 115.635 14.5856 115.268 15.0706C114.901 15.5556 114.481 16.0169 114.008 16.4546C113.543 16.8974 113.047 17.2678 112.518 17.5659C111.995 17.8548 111.453 18.0246 110.892 18.0753C110.332 18.1261 109.78 17.9999 109.235 17.6967C109.014 17.5733 108.808 17.4223 108.617 17.2436C108.421 17.0741 108.267 16.8616 108.156 16.606C108.059 16.3463 108.037 16.0379 108.091 15.6809C108.159 15.3198 108.345 14.8977 108.65 14.4148L111.026 10.6047C111.122 10.4529 111.159 10.3221 111.135 10.2123C111.117 10.0933 111.06 10.0009 110.963 9.93512C110.872 9.86013 110.749 9.80974 110.594 9.78394L109.926 9.64786L110.033 9C110.251 9.00021 110.545 9.03691 110.915 9.11012C111.29 9.17409 111.617 9.28317 111.893 9.43734C112.29 9.65833 112.506 9.92326 112.539 10.2321C112.578 10.5318 112.493 10.8472 112.284 11.1784L109.783 15.1177C109.6 15.4027 109.46 15.6637 109.365 15.9007C109.283 16.1335 109.274 16.3459 109.336 16.5378C109.408 16.7349 109.578 16.908 109.845 17.057C110.168 17.2369 110.511 17.3064 110.872 17.2657C111.242 17.2302 111.609 17.1141 111.973 16.9174C112.345 16.7259 112.699 16.4815 113.034 16.1843C113.383 15.883 113.702 15.559 113.992 15.2125C114.296 14.8619 114.55 14.5138 114.755 14.1682C114.917 13.92 115.016 13.7211 115.051 13.5713C115.1 13.4174 115.106 13.2876 115.068 13.1819C115.035 13.067 114.963 12.9479 114.85 12.8246L114.41 12.344C114.505 12.1307 114.624 11.9492 114.768 11.7995C114.921 11.655 115.095 11.5705 115.29 11.5461C115.49 11.5124 115.696 11.5547 115.908 11.6729Z"/>
                    <path d="M128.888 21.902C129.479 22.4297 129.793 22.9506 129.829 23.4647C129.866 23.9789 129.687 24.4567 129.293 24.8979C128.998 25.2289 128.684 25.4449 128.353 25.546C128.03 25.654 127.695 25.6805 127.348 25.6253C127.016 25.5693 126.685 25.4721 126.355 25.3337C126.025 25.1952 125.71 25.0484 125.41 24.8934L123.813 24.0411C123.512 24.4098 123.283 24.7931 123.126 25.191C122.969 25.589 122.92 25.9771 122.979 26.3553C123.038 26.7335 123.229 27.0669 123.552 27.3554C123.741 27.5242 123.943 27.6549 124.157 27.7475C124.38 27.8471 124.631 27.9152 124.91 27.9518C125.189 27.9884 125.511 28.0001 125.877 27.9868L125.891 28.637C125.743 28.6603 125.549 28.6788 125.311 28.6923C125.087 28.7049 124.824 28.6899 124.523 28.6471C124.236 28.6035 123.939 28.5156 123.632 28.3833C123.318 28.2589 123.016 28.0665 122.724 27.8062C122.22 27.3559 121.899 26.8504 121.763 26.2895C121.634 25.7356 121.669 25.165 121.868 24.5777C122.082 23.9895 122.428 23.4275 122.906 22.8916C123.518 22.206 124.178 21.7048 124.886 21.3879C125.594 21.071 126.294 20.9528 126.987 21.0332C127.687 21.1058 128.32 21.3954 128.888 21.902ZM128.21 23.9941C128.371 23.8129 128.492 23.6303 128.571 23.4462C128.651 23.2621 128.67 23.0815 128.63 22.9042C128.597 22.719 128.486 22.542 128.297 22.3731C127.974 22.0846 127.599 21.9338 127.172 21.9206C126.76 21.9065 126.31 22.0292 125.824 22.2887C125.352 22.5474 124.847 22.9463 124.309 23.4855L125.777 24.2441C126.116 24.4194 126.422 24.5368 126.695 24.5962C126.975 24.6477 127.235 24.6254 127.477 24.5294C127.726 24.4405 127.97 24.2621 128.21 23.9941Z"/>
                    <path d="M141.754 52.3913L140.681 52.9029L140.374 52.2593C140.149 51.7873 140.078 51.4174 140.183 51.1217C140.273 50.8328 140.505 50.5819 140.877 50.4046C139.789 50.2213 138.999 49.597 138.494 48.5386C138.106 47.7234 137.978 46.9768 138.132 46.3063C138.272 45.6427 138.685 45.1471 139.343 44.8334C140.073 44.4855 140.746 44.4626 141.386 44.7722C142.01 45.0886 142.559 45.7225 143.016 46.6808L144.039 48.8262L144.539 48.5875C145.011 48.3624 145.301 48.0134 145.423 47.5691C145.53 47.1317 145.462 46.6201 145.189 46.048C144.944 45.5331 144.631 45.1729 144.246 44.9531C143.86 44.7332 143.478 44.6694 143.072 44.7753L142.513 43.6024C143.269 43.3472 143.977 43.3958 144.637 43.7483C145.296 44.1008 145.838 44.7205 146.261 45.6072C146.704 46.5369 146.816 47.3612 146.604 48.0944C146.392 48.8275 145.871 49.3919 145.027 49.7944L141.881 51.2951C141.523 51.4656 141.426 51.7048 141.583 52.0337L141.754 52.3913ZM143.052 49.2969L141.974 47.0371C141.456 45.9501 140.782 45.6044 139.981 45.9864C139.609 46.1637 139.391 46.4432 139.313 46.8315C139.221 47.2267 139.305 47.6607 139.537 48.1469C139.878 48.8621 140.33 49.3312 140.899 49.5686C141.462 49.7917 142.065 49.7675 142.694 49.4674L143.052 49.2969Z"/>
                    <path d="M152.162 65.718C151.953 66.3589 151.579 66.9038 151.039 67.3529C150.484 67.8052 149.805 68.1211 148.966 68.2915C148.159 68.4555 147.425 68.4266 146.753 68.2236C146.066 68.0236 145.509 67.6679 145.05 67.1628C144.589 66.6421 144.285 66.0246 144.14 65.3102C144.008 64.658 144.006 64.0924 144.148 63.5948C144.286 63.0816 144.539 62.6582 144.893 62.3277L140.576 63.2046L140.317 61.9313L151.342 59.6917L151.566 60.7942L150.328 61.2237C151.361 61.6929 152.013 62.5145 152.246 63.6636C152.395 64.3935 152.356 65.0804 152.162 65.718ZM146.441 66.6862C147.082 67.0572 147.832 67.1637 148.701 66.9871C149.555 66.8136 150.204 66.4232 150.649 65.8314C151.095 65.2396 151.245 64.5461 151.087 63.7697C150.983 63.2572 150.768 62.8321 150.437 62.4788C150.107 62.1256 149.705 61.8999 149.226 61.7708C148.747 61.6418 148.228 61.634 147.669 61.7475C147.095 61.8643 146.604 62.0771 146.198 62.3859C145.792 62.6948 145.51 63.0593 145.344 63.5135C145.177 63.9677 145.145 64.4433 145.249 64.9557C145.406 65.7322 145.8 66.3152 146.441 66.6862Z"/>
                    <path d="M152.991 85.0735C152.625 85.6395 152.124 86.0706 151.487 86.3668C150.835 86.6621 150.097 86.7937 149.243 86.744C148.421 86.696 147.719 86.4805 147.121 86.1124C146.508 85.7433 146.06 85.2569 145.746 84.6513C145.433 84.0299 145.298 83.3553 145.34 82.6277C145.379 81.9633 145.522 81.416 145.786 80.9711C146.051 80.5104 146.404 80.1659 146.83 79.9368L142.433 79.6805L142.508 78.3833L153.74 79.0378L153.674 80.161L152.367 80.2594C153.246 80.9773 153.666 81.9383 153.598 83.1089C153.554 83.8524 153.342 84.5067 152.991 85.0735ZM147.212 84.5463C147.738 85.0689 148.435 85.3635 149.321 85.4152C150.191 85.4659 150.917 85.2542 151.499 84.7961C152.082 84.338 152.404 83.706 152.45 82.915C152.481 82.393 152.381 81.9269 152.152 81.5008C151.923 81.0748 151.592 80.7539 151.162 80.5067C150.732 80.2594 150.232 80.1191 149.663 80.086C149.078 80.0518 148.549 80.1322 148.077 80.3269C147.606 80.5216 147.24 80.8019 146.963 81.1984C146.686 81.595 146.533 82.0464 146.502 82.5684C146.456 83.3594 146.687 84.0236 147.212 84.5463Z"/>
                    <path d="M154.062 98.7546L153.717 100.007L143.023 97.0621L143.368 95.8093L154.062 98.7546Z"/>
                    <path d="M149.185 111.96C148.975 112.038 148.754 112.025 148.538 111.926C148.307 111.821 148.167 111.67 148.089 111.46C148.01 111.25 148.024 111.03 148.122 110.814C148.227 110.583 148.378 110.443 148.588 110.364C148.798 110.286 149.004 110.293 149.235 110.398C149.451 110.496 149.605 110.654 149.684 110.864C149.762 111.074 149.756 111.279 149.651 111.51C149.552 111.726 149.395 111.881 149.185 111.96ZM147.079 109.625L146.541 110.807L139.186 107.457L139.725 106.274L147.079 109.625Z"/>
                    <path d="M139.46 119.848C139.777 120.466 139.895 121.116 139.836 121.796C139.787 122.463 139.54 123.105 139.096 123.723C138.671 124.315 138.154 124.763 137.577 125.05C136.987 125.329 136.368 125.43 135.71 125.368C135.049 125.283 134.394 125.027 133.745 124.6C133.642 124.526 133.509 124.412 133.313 124.251L136.973 119.154L136.883 119.09C136.231 118.64 135.577 118.463 134.914 118.572C134.26 118.668 133.715 119.019 133.272 119.636C132.939 120.1 132.768 120.582 132.759 121.083C132.751 121.584 132.928 122.043 133.27 122.464L132.502 123.532C131.926 122.923 131.603 122.203 131.548 121.384C131.493 120.564 131.74 119.785 132.277 119.039C132.748 118.382 133.283 117.909 133.918 117.623C134.552 117.337 135.216 117.228 135.925 117.328C136.634 117.427 137.305 117.715 137.974 118.195C138.644 118.676 139.13 119.221 139.46 119.848ZM134.955 123.811C135.546 124.157 136.14 124.253 136.708 124.114C137.276 123.976 137.763 123.623 138.161 123.07C138.521 122.568 138.668 122.01 138.614 121.406C138.557 120.779 138.28 120.268 137.802 119.847L134.955 123.811Z"/>
                    <path d="M124.817 142.47L117.775 133.899L118.645 133.185L119.604 134.078C119.537 132.923 119.956 131.985 120.862 131.24C121.449 130.757 122.064 130.457 122.728 130.342C123.383 130.215 124.039 130.291 124.699 130.569C125.348 130.835 125.943 131.31 126.487 131.971C127 132.596 127.33 133.247 127.475 133.948C127.61 134.637 127.567 135.308 127.323 135.96C127.091 136.602 126.688 137.159 126.112 137.632C125.61 138.044 125.101 138.298 124.583 138.416C124.077 138.524 123.594 138.511 123.125 138.363L125.821 141.645L124.817 142.47ZM120.664 133.371C120.507 133.829 120.483 134.299 120.593 134.783C120.704 135.267 120.95 135.741 121.312 136.182C121.674 136.623 122.092 136.956 122.555 137.171C123.018 137.385 123.494 137.465 123.974 137.4C124.453 137.334 124.888 137.14 125.28 136.818C125.905 136.305 126.226 135.672 126.253 134.932C126.28 134.192 126.011 133.49 125.458 132.816C124.895 132.131 124.259 131.731 123.527 131.614C122.795 131.497 122.122 131.702 121.498 132.215C121.106 132.536 120.821 132.914 120.664 133.371Z"/>
                    <path d="M102.094 154.164C101.892 154.067 101.75 153.898 101.672 153.674C101.589 153.434 101.601 153.228 101.699 153.027C101.797 152.825 101.965 152.683 102.19 152.605C102.429 152.521 102.635 152.534 102.837 152.632C103.038 152.729 103.176 152.883 103.259 153.122C103.337 153.347 103.329 153.568 103.232 153.769C103.134 153.971 102.98 154.108 102.741 154.191C102.516 154.269 102.296 154.262 102.094 154.164ZM102.33 151.029L101.103 151.456L98.4514 143.822L99.6789 143.395L102.33 151.029Z"/>
                    <path d="M83.6072 154.334C82.9352 153.811 82.5228 152.936 82.366 151.678L81.8096 147.213L83.099 147.052L83.6456 151.439C83.7475 152.257 84.0146 152.862 84.4469 153.255C84.8791 153.649 85.4412 153.802 86.133 153.716C86.8878 153.622 87.452 153.28 87.8119 152.708C88.1856 152.119 88.3018 151.386 88.1901 150.489L87.6905 146.48L88.9799 146.319L89.9792 154.339L88.8627 154.478L88.5546 153.414C88.055 154.275 87.2234 154.778 86.0598 154.923C85.0849 155.044 84.2772 154.841 83.6072 154.334Z"/>
                    <path d="M70.9202 153.953L72.3711 154.095L72.2551 155.278L70.8042 155.136L70.5831 157.391L69.29 157.264L69.5111 155.009L67.4767 154.809L67.5926 153.627L69.627 153.826L70.0924 149.079C70.1264 148.732 70.0865 148.489 69.9743 148.335C69.862 148.181 69.6317 148.095 69.3005 148.062L67.8969 147.924L68.0129 146.742L69.4953 146.887C70.2523 146.961 70.7888 147.173 71.0702 147.551C71.3531 147.913 71.4582 148.465 71.3871 149.19L70.9202 153.953Z"/>
                    <path d="M57.5658 151.045C57.0781 151.54 56.4972 151.856 55.8333 152.012C55.1846 152.174 54.4974 152.14 53.7718 151.912C53.0765 151.694 52.4891 151.343 52.0352 150.885C51.586 150.411 51.2958 149.855 51.1495 149.211C51.023 148.557 51.061 147.854 51.2637 147.104C51.3017 146.983 51.3691 146.822 51.4602 146.585L57.4464 148.466L57.4796 148.361C57.7021 147.6 57.6655 146.924 57.3546 146.328C57.0587 145.737 56.5556 145.329 55.83 145.101C55.2858 144.93 54.7744 144.919 54.2959 145.067C53.8173 145.216 53.4367 145.528 53.1439 145.984L51.8892 145.59C52.2875 144.851 52.8697 144.32 53.6312 144.011C54.3927 143.703 55.2095 143.694 56.0862 143.969C56.8572 144.212 57.4748 144.572 57.9447 145.085C58.4145 145.598 58.7255 146.194 58.8528 146.899C58.9802 147.603 58.9175 148.331 58.6704 149.117C58.4232 149.903 58.0582 150.536 57.5658 151.045ZM52.3917 148.007C52.2479 148.676 52.3433 149.271 52.6525 149.767C52.9617 150.262 53.4489 150.615 54.0989 150.819C54.6884 151.005 55.2642 150.97 55.8213 150.73C56.3984 150.479 56.7971 150.056 57.0476 149.471L52.3917 148.007Z"/>
                    <path d="M38.4867 148.557L37.356 147.917L42.8203 138.264L43.951 138.904L38.4867 148.557Z"/>
                    <path d="M27.7524 141.475L26.7385 140.662L33.6762 132.007L34.69 132.82L27.7524 141.475Z"/>
                    <path d="M17.5597 131.754C17.5709 131.53 17.6705 131.333 17.8467 131.173C18.0347 131.003 18.2288 130.934 18.4527 130.946C18.6765 130.957 18.8734 131.056 19.0329 131.233C19.2031 131.42 19.2719 131.615 19.2608 131.838C19.2496 132.062 19.1618 132.249 18.9738 132.419C18.7976 132.578 18.5917 132.658 18.3679 132.647C18.144 132.635 17.9577 132.548 17.7876 132.36C17.6281 132.183 17.5486 131.977 17.5597 131.754ZM20.538 130.747L19.6661 129.783L25.658 124.36L26.5299 125.324L20.538 130.747Z"/>
                    <path d="M8.73193 114.121L15.3717 110.251C17.48 109.023 19.2124 109.572 20.5529 111.872C21.0796 112.775 21.3051 113.634 21.2296 114.449C21.154 115.263 20.7705 115.927 20.0517 116.456L19.3815 115.306C19.7717 114.968 19.9783 114.536 19.9876 114.017C20.0186 113.504 19.8488 112.961 19.5057 112.372C18.6279 110.866 17.4635 110.536 15.9849 111.398L15.1635 111.877C16.3213 111.88 17.2085 112.427 17.8468 113.522C18.2298 114.18 18.4281 114.834 18.4358 115.508C18.4572 116.175 18.2779 116.811 17.8979 117.418C17.5315 118.016 16.9679 118.528 16.2286 118.959C15.5304 119.366 14.8346 119.588 14.1194 119.62C13.4179 119.644 12.7621 119.494 12.1577 119.149C11.5613 118.818 11.0755 118.331 10.7005 117.688C10.3733 117.126 10.2173 116.575 10.1969 116.037C10.1846 115.512 10.3159 115.014 10.591 114.542L9.29847 115.093L8.73193 114.121ZM15.7745 112.988C15.348 112.76 14.8872 112.661 14.3922 112.693C13.8971 112.725 13.3895 112.892 12.8967 113.18C12.4038 113.467 12.0079 113.826 11.7226 114.249C11.4373 114.672 11.282 115.129 11.2704 115.613C11.2588 116.097 11.3807 116.558 11.6361 116.996C12.043 117.694 12.6166 118.111 13.3431 118.257C14.0696 118.402 14.8054 118.248 15.5583 117.809C16.325 117.362 16.8214 116.798 17.0532 116.094C17.285 115.391 17.1905 114.694 16.7836 113.995C16.5283 113.557 16.201 113.216 15.7745 112.988Z"/>
                    <path d="M5.99774 104.182C5.31439 104.058 4.72616 103.756 4.22249 103.296C3.7234 102.852 3.36356 102.265 3.14295 101.537C2.93153 100.84 2.89015 100.157 3.01282 99.5235C3.15066 98.8857 3.44659 98.3324 3.89601 97.8485C4.36518 97.3751 4.96671 97.0107 5.7006 96.7551C5.82191 96.7184 5.99332 96.683 6.24056 96.6246L8.06058 102.63L8.16673 102.598C8.92037 102.353 9.45802 101.941 9.77509 101.349C10.0967 100.771 10.1496 100.126 9.92896 99.3978C9.76351 98.8519 9.48455 98.4231 9.09208 98.1116C8.69962 97.8 8.22721 97.6617 7.6854 97.6769L7.30393 96.4182C8.13846 96.3309 8.90545 96.5124 9.58973 96.9673C10.274 97.4222 10.7418 98.0918 11.0084 98.9713C11.2428 99.7447 11.2934 100.458 11.1344 101.135C10.9754 101.813 10.6584 102.406 10.1483 102.908C9.63822 103.41 9.00177 103.769 8.2132 104.008C7.42463 104.247 6.69625 104.302 5.99774 104.182ZM5.59082 98.1958C4.95712 98.4541 4.51965 98.8682 4.28438 99.4031C4.04911 99.938 4.03259 100.539 4.23022 101.191C4.40946 101.783 4.76287 102.238 5.27527 102.563C5.80744 102.899 6.38141 102.99 7.00639 102.867L5.59082 98.1958Z"/>
                    <path d="M0.781731 80.1058C1.35524 79.4763 2.25932 79.1328 3.52563 79.0739L8.02102 78.8647L8.0814 80.1627L3.66516 80.3682C2.84206 80.4065 2.21774 80.6259 1.79221 81.0264C1.36668 81.4269 1.17011 81.9754 1.20252 82.6719C1.23787 83.4316 1.53494 84.0206 2.07718 84.4237C2.63598 84.8419 3.35785 85.0145 4.26009 84.9725L8.29645 84.7847L8.35683 86.0827L0.284129 86.4583L0.231841 85.3344L1.31593 85.1095C0.496504 84.5448 0.0595422 83.6768 0.0050455 82.5055C-0.0406139 81.5241 0.224049 80.7345 0.781731 80.1058Z"/>
                    <path d="M9.39137 63.1778C9.76421 63.8988 9.85736 64.7255 9.67081 65.6578C9.51535 66.4347 9.21073 67.0686 8.75386 67.5751C8.29387 68.0971 7.73757 68.4545 7.05387 68.6408C6.36706 68.8428 5.63676 68.8582 4.82879 68.6966C4.03635 68.538 3.36824 68.2427 2.81202 67.792C2.27133 67.3445 1.89847 66.7851 1.67478 66.1262C1.4511 65.4674 1.41388 64.765 1.56934 63.9881C1.75589 63.0559 2.15685 62.3443 2.77532 61.8378C3.39379 61.3313 4.15519 61.0797 5.05641 61.0984L4.79834 62.388C4.27626 62.4128 3.81941 62.5961 3.43093 62.9224C3.05487 63.2673 2.80621 63.7024 2.69428 64.2617C2.54193 65.0231 2.69724 65.7006 3.13225 66.2724C3.58281 66.8474 4.23538 67.2204 5.08996 67.3914C5.96008 67.5655 6.72147 67.4754 7.35857 67.1181C7.99567 66.7608 8.38419 66.1922 8.53654 65.4308C8.65158 64.8559 8.60812 64.3462 8.3782 63.8801C8.16071 63.4325 7.79094 63.1 7.28752 62.87L7.54248 61.5959C8.39394 61.944 9.01541 62.4724 9.39137 63.1778Z"/>
                    <path d="M7.73546 49.6023C7.31346 49.0507 7.0815 48.4316 7.01846 47.7524C6.94861 47.0875 7.07701 46.4116 7.40365 45.7247C7.71668 45.0664 8.14559 44.5334 8.66247 44.1476C9.19366 43.7685 9.78489 43.5583 10.443 43.5028C11.1086 43.4684 11.7988 43.6036 12.5136 43.9084C12.6281 43.9628 12.7787 44.052 13.0008 44.1752L10.306 49.8421L10.4062 49.8897C11.1285 50.2157 11.803 50.2732 12.4365 50.0481C13.0631 49.8372 13.5364 49.3955 13.863 48.7086C14.108 48.1934 14.1902 47.6886 14.1095 47.194C14.0289 46.6994 13.7725 46.2792 13.3615 45.9259L13.9263 44.7381C14.6024 45.2351 15.0476 45.8855 15.2476 46.6824C15.4477 47.4794 15.3432 48.2895 14.9485 49.1195C14.6014 49.8493 14.1589 50.4109 13.5855 50.805C13.0121 51.1991 12.3786 51.4243 11.6633 51.4526C10.948 51.4809 10.236 51.3178 9.49183 50.9639C8.74769 50.61 8.17178 50.1607 7.73546 49.6023ZM11.4629 44.9002C10.8203 44.6648 10.2181 44.6767 9.68411 44.9141C9.15012 45.1515 8.73341 45.585 8.4408 46.2003C8.1754 46.7584 8.13007 47.3335 8.29048 47.9186C8.4584 48.5248 8.82176 48.9784 9.36695 49.3078L11.4629 44.9002Z"/>
                    <circle cx="135" cy="34.4572" r="1.0564" transform="rotate(-154.808 135 34.4572)"/>
                    <circle cx="18.0386" cy="35.3911" r="1.0564" transform="rotate(98.7204 18.0386 35.3911)"/>
                    <circle cx="111.053" cy="143.174" r="1.0564" transform="rotate(98.7204 111.053 143.174)"/>

                  </g>
                  <g className="footer-logo-icon">
                    <path d="M87.0304 55.6592C85.7691 56.4467 84.415 56.8076 82.7005 56.8076C81.2317 56.8076 79.5172 56.5561 77.2294 56.1514C76.4432 56.0092 75.6624 55.8889 74.8979 55.7959C81.2372 57.3272 85.1467 60.3679 87.0304 63.7969V55.6592Z" />
                    <path d="M58.9058 85.6885V96.5004C60.3254 95.6637 61.7123 95.2262 63.1483 95.177C63.3176 95.1715 63.4923 95.166 63.6779 95.166C65.2778 95.166 67.298 95.4067 69.6732 95.8879C69.9517 95.9426 70.2356 95.9973 70.5195 96.0465C63.9728 94.2527 61.1936 89.8667 58.9058 85.6885Z" />
                    <path d="M80.4567 96.0692C83.0011 95.0356 84.3225 93.1051 84.3225 90.3488C84.3225 88.4894 83.5963 86.8378 82.1657 85.4323C80.0963 83.3049 77.2079 82.0689 73.8608 80.6306C72.9489 80.2369 72.0153 79.8376 71.0597 79.4056C68.7938 78.4048 66.6698 77.311 64.9607 76.436C61.1113 74.3086 58.8071 70.8578 58.8071 67.2045C58.8071 64.0217 60.0357 61.2544 62.4654 58.9848C64.0107 57.5356 65.7252 56.5348 67.5816 55.9824C65.8016 56.9395 64.7751 58.6676 64.7751 60.888C64.7751 66.9967 70.5192 69.1132 76.5963 71.3609C83.3014 73.8383 90.2304 76.3922 90.2304 84.5463C90.2304 88.2706 88.8872 91.1527 86.1352 93.3567C84.4808 94.6473 82.6025 95.5497 80.4621 96.0692H80.4567Z" />
                    <circle cx="101.508" cy="60.2247" r="4.56548" />
                  </g>
              </svg>
          </div>
        </div>
          </footer>
        </>
      ) : null}

      <Analytics />
      <CookieConsent />
    </div>
  )
}