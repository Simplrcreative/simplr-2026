import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getCompactLogoTransform, isCompactLogoTabletUp } from './compact-logo-transform.js'
import { scrollToTopImmediate } from './smooth-scroll.js'

let pluginsRegistered = false

function registerPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger)
    pluginsRegistered = true
  }
}

function getLogoTargets(scope) {
  const root = scope || document
  return {
    logo: root.querySelector?.('.logo') ?? document.querySelector('.logo'),
    tagline: root.querySelector?.('.tagline') ?? document.querySelector('.tagline'),
    header: root.querySelector?.('.header') ?? document.querySelector('.header'),
    desktopNav: root.querySelector?.('#desktop-nav') ?? document.querySelector('#desktop-nav'),
    navHolder: root.querySelector?.('.nav-holder') ?? document.querySelector('.nav-holder'),
    implrPaths: Array.from(
      root.querySelectorAll?.('#logo-implr g') ?? document.querySelectorAll('#logo-implr g'),
    ),
  }
}

/**
 * Hard snap the brand mark to fully unfolded.
 * Only touches logo / tagline / letter paths — never header/nav (those have
 * their own entrance tweens and must not be killTweensOf'd mid-timeline).
 */
export function setLogoExpandedState(scope) {
  const { logo, tagline, implrPaths } = getLogoTargets(scope)
  const targets = [logo, tagline, ...implrPaths].filter(Boolean)
  if (targets.length) gsap.killTweensOf(targets)

  if (logo) {
    gsap.set(logo, {
      scale: 1,
      y: 0,
      x: 0,
      autoAlpha: 1,
      transformOrigin: 'left top',
      willChange: 'transform',
    })
  }

  if (tagline) {
    gsap.set(tagline, {
      scale: 1,
      x: 0,
      y: 0,
      autoAlpha: 1,
      transformOrigin: 'left top',
      willChange: 'transform',
    })
  }

  if (implrPaths.length) {
    gsap.set(implrPaths, {
      x: 0,
      filter: 'blur(0px)',
      autoAlpha: 1,
      willChange: 'transform, opacity',
    })
  }
}

export function createLogoScrollAnimation(scope) {
  if (!scope) {
    return () => undefined
  }

  registerPlugins()

  // Check reduced-motion directly so cleanup is just timeline.kill() —
  // gsap.matchMedia().revert() would wipe GSAP inline styles after
  // useLayoutEffect sets the compact state on non-home pages.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => undefined
  }

  const { logo, tagline, header, desktopNav, navHolder, implrPaths } = getLogoTargets(scope)

  if (!logo || !implrPaths.length) {
    return () => undefined
  }

  scrollToTopImmediate()
  setLogoExpandedState(scope)

  const {
    logoScale,
    logoY,
    logoDuration,
    taglineScale,
    taglineY,
    taglineX,
  } = getCompactLogoTransform()

  // fromTo with explicit expanded "from" values so invalidateOnRefresh cannot
  // re-record a mid-unfold state when deferred home content refreshes ST.
  const timeline = gsap.timeline({
    defaults: {
      ease: 'none',
    },
    scrollTrigger: {
      id: 'logo-scroll-scrub',
      start: 0,
      end: 320,
      scrub: true,
      invalidateOnRefresh: true,
      onRefresh: (self) => {
        if (ScrollTrigger.scroll() <= 2) {
          self.animation?.progress(0)
          setLogoExpandedState(scope)
        }
      },
    },
  })

  timeline.fromTo(
    logo,
    { scale: 1, y: 0, autoAlpha: 1 },
    { scale: logoScale, y: logoY, duration: logoDuration, immediateRender: false },
    0,
  )

  timeline.fromTo(
    implrPaths,
    { x: 0, filter: 'blur(0px)', autoAlpha: 1 },
    {
      x: -20,
      filter: 'blur(10px)',
      autoAlpha: 0,
      stagger: 0.1,
      duration: 0.2,
      immediateRender: false,
    },
    0.35,
  )

  if (tagline) {
    timeline.fromTo(
      tagline,
      { scale: 1, x: 0, y: 0, autoAlpha: 1 },
      {
        scale: taglineScale,
        y: taglineY,
        x: taglineX,
        duration: 0.5,
        immediateRender: false,
      },
      0.3,
    )
  }

  if (isCompactLogoTabletUp()) {
    if (header) {
      timeline.fromTo(
        header,
        { y: 0 },
        { y: -20, duration: 0.5, immediateRender: false },
        0.3,
      )
    }

    if (desktopNav) {
      timeline.fromTo(
        desktopNav,
        { y: 0 },
        { y: -20, duration: 0.5, immediateRender: false },
        0.3,
      )
    }

    if (navHolder) {
      timeline.to(
        navHolder,
        {
          height: '30px',
          duration: 0.1,
          immediateRender: false,
        },
        0,
      )
    }
  }

  // One settle pass only — do not loop scrollToTopImmediate (it stops Lenis).
  requestAnimationFrame(() => {
    if (ScrollTrigger.scroll() <= 2) {
      timeline.progress(0)
      setLogoExpandedState(scope)
    }
  })

  return () => {
    timeline.scrollTrigger?.kill()
    timeline.kill()
  }
}

export function createLogoPageAnimation(scope) {
  if (!scope) {
    return () => undefined
  }

  registerPlugins()

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => undefined
  }

  const isDesktop = window.matchMedia('(min-width: 1024px)').matches
  const { header, desktopNav, navHolder } = getLogoTargets(scope)

  const timeline = gsap.timeline({
    defaults: {
      ease: 'none',
    },
    scrollTrigger: {
      start: 0,
      end: 320,
      scrub: true,
      invalidateOnRefresh: true,
    },
  })

  if (isDesktop) {
    if (header) {
      timeline.fromTo(
        header,
        { y: 0 },
        { y: -20, duration: 0.5, immediateRender: false },
        0.3,
      )
    }

    if (desktopNav) {
      timeline.fromTo(
        desktopNav,
        { y: 0 },
        { y: -20, duration: 0.5, immediateRender: false },
        0.3,
      )
    }

    if (navHolder) {
      timeline.to(
        navHolder,
        {
          height: '30px',
          duration: 0.1,
          immediateRender: false,
        },
        0,
      )
    }
  }

  return () => {
    timeline.scrollTrigger?.kill()
    timeline.kill()
  }
}
