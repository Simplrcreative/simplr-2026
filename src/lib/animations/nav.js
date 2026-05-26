import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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
  const implrPaths = scope.querySelectorAll('#logo-implr g')

  if (!logo || !implrPaths.length) {
    return () => undefined
  }

  gsap.set(logo, {
    transformOrigin: 'left top',
    willChange: 'transform',
  })

  gsap.set('.tagline', {
    transformOrigin: 'left top',
    willChange: 'transform',
  })

  gsap.set(implrPaths, {
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
    },
  })

  const isDesktop = window.matchMedia('(min-width: 768px)').matches

  //RESPONSIVE VALUES
  let logoScale = 1
  let logoY = 0
  let logoDuration = 0

  let taglineScale = 0.65
  let taglineY = -88
  let taglineX = 65

  if (isDesktop) {
    logoY = -10
    logoScale = 0.35
    logoDuration = 0.5

    taglineScale = 0.68
    taglineY = -213
    taglineX = 65
  }

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

  timeline.to(
    '.tagline',
    {
      scale: taglineScale,
      y: taglineY,
      x: taglineX,
      stagger: 0.02,
      duration: 0.5,
    },
    0.3,
  )

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
      'nav.main',
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

export function createLogoPageAnimation(scope) {
  if (!scope) {
    return () => undefined
  }

  registerPlugins()

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => undefined
  }

  const isDesktop = window.matchMedia('(min-width: 768px)').matches

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
      'nav.main',
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