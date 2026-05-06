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

  timeline.to(
    logo,
    {
      scale: 0.35,
      y: -10,
      duration: 0.5,
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
      y: -213,
      x: 65,
      scale: 0.68,
      stagger: 0.02,
      duration: 0.5,
    },
    0.3,
  )

  timeline.to(
    '.header',
    {
      y: -30,
      height: '130px',
      duration: 0.5,
    },
    0.3,
  )

  timeline.to(
    'nav.main',
    {
      y: -10,
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

  return () => {
    timeline.kill()
  }
}