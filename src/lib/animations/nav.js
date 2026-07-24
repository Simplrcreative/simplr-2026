import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getCompactLogoTransform, isCompactLogoTabletUp } from './compact-logo-transform.js'

let pluginsRegistered = false

function registerPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger)
    pluginsRegistered = true
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

  const logo = scope.querySelector('.logo')
  const tagline = scope.querySelector('.tagline')
  const header = scope.querySelector('.header')
  const desktopNav = scope.querySelector('#desktop-nav')
  const navHolder = scope.querySelector('.nav-holder')
  const implrPaths = scope.querySelectorAll('#logo-implr g')

  if (!logo || !implrPaths.length) {
    return () => undefined
  }

  // Scrub must start from the fully expanded entrance state.
  gsap.set(logo, {
    scale: 1,
    y: 0,
    autoAlpha: 1,
    transformOrigin: 'left top',
    willChange: 'transform',
  })

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

  gsap.set(implrPaths, {
    x: 0,
    filter: 'blur(0px)',
    autoAlpha: 1,
    willChange: 'transform, opacity',
  })

  const timeline = gsap.timeline({
    defaults: {
      ease: 'none',
    },
    scrollTrigger: {
      trigger: scope,
      start: 'top top',
      end: '+=320',
      scrub: true,
      invalidateOnRefresh: true,
    },
  })

  const {
    logoScale,
    logoY,
    logoDuration,
    taglineScale,
    taglineY,
    taglineX,
  } = getCompactLogoTransform()

  timeline.to(
    logo,
    {
      scale: logoScale,
      y: logoY,
      duration: logoDuration
    },
    0,
  )

  timeline.to(
    implrPaths,
    {
      x: -20,
      filter: 'blur(10px)',
      autoAlpha: 0,
      stagger: 0.1,
      duration: 0.2,
    },
    0.35,
  )

  if (tagline) {
    timeline.to(
      tagline,
      {
        scale: taglineScale,
        y: taglineY,
        x: taglineX,
        duration: 0.5,
      },
      0.3,
    )
  }

  if (isCompactLogoTabletUp()) {
    if (header) {
      timeline.to(
        header,
        {
          y: -20,
          duration: 0.5,
        },
        0.3,
      )
    }

    if (desktopNav) {
      timeline.to(
        desktopNav,
        {
          y: -20,
          duration: 0.5,
        },
        0.3,
      )
    }

    if (navHolder) {
      timeline.to(
        navHolder,
        {
          height: '30px',
          duration: 0.1,
        },
        0,
      )
    }
  }

  // If scroll isn't truly at top (Lenis settling / bad ST math after a route
  // transition), scrub would freeze the logo mid-fold. Force expanded.
  const syncExpandedAtTop = () => {
    const st = timeline.scrollTrigger
    if (!st) return
    st.refresh()
    if (ScrollTrigger.scroll() <= st.start + 2) {
      timeline.progress(0)
    }
  }

  requestAnimationFrame(syncExpandedAtTop)

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

  const timeline = gsap.timeline({
    defaults: {
      ease: 'none',
    },
    scrollTrigger: {
      trigger: scope,
      start: 'top top',
      end: '+=320',
      scrub: true,
    },
  })

  if (isDesktop) {
    timeline.to(
      '.header',
      {
        y: -20,
        duration: 0.5,
      },
      0.3,
    )

    timeline.to(
      '#desktop-nav',
      {
        y: -20,
        duration: 0.5,
      },
      0.3,
    )

    timeline.to(
      '.nav-holder',
      {
        height: '30px',
        duration: 0.1,
      },
      0,
    )
  }

  return () => {
    timeline.kill()
  }
}