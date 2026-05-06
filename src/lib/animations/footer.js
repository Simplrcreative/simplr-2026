import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let pluginsRegistered = false

const FOOTER_LIGHT_CLASS = 'footer-light__'

function registerPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger)
    pluginsRegistered = true
  }
}

function getCompactLogoThreshold(nav) {
  const navBounds = nav?.getBoundingClientRect()

  if (navBounds && navBounds.height > 0) {
    return Math.round(navBounds.bottom)
  }

  return 95
}

function resolveCurrentCompactLogoState(nav, fallbackState = false) {
  const changeLogoSections = Array.from(document.querySelectorAll('.change-logo'))
  const changeLogoBackSections = Array.from(document.querySelectorAll('.change-logo-back'))
  const triggerSections = [
    ...changeLogoSections.map((section) => ({ section, isCompact: true })),
    ...changeLogoBackSections.map((section) => ({ section, isCompact: false })),
  ]

  if (!triggerSections.length) {
    return fallbackState
  }

  const threshold = getCompactLogoThreshold(nav)
  let activeSectionTop = -Infinity
  let activeState = fallbackState

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

export function createFooterAnimation(scope) {
  if (!scope) {
    return () => undefined
  }

  registerPlugins()

  const footer = scope.matches?.('footer') ? scope : scope.querySelector('footer')
  const logo = document.querySelector('.logo')
  const implrPaths = Array.from(document.querySelectorAll('#logo-implr g'))
  const logoS = document.querySelector('#logo-s')
  const logoDot = document.querySelector('#logo-dot')
  const tagline = document.querySelector('.tagline')
  const header = document.querySelector('.header')
  const nav = document.querySelector('nav.main')
  const logoHolder = document.querySelector('.logo-holder')
  const navHolder = document.querySelector('.nav-holder')
  const footerBlock = document.querySelector('.footer-block')
  const footerOffItems = Array.from(document.querySelectorAll('.footer-off'))
  const root = document.documentElement

  if (!footer || !logo || !tagline || !implrPaths.length) {
    return () => undefined
  }

  const media = gsap.matchMedia()

  media.add('(prefers-reduced-motion: no-preference)', () => {
    let previousCompactLogoState = root.classList.contains('compact-logo-active')
    let previousNavFooterLightState = nav?.classList.contains(FOOTER_LIGHT_CLASS) ?? false
    let previousLogoHolderFooterLightState = logoHolder?.classList.contains(FOOTER_LIGHT_CLASS) ?? false

    const applyFooterLightState = (isActive) => {
      nav?.classList.toggle(FOOTER_LIGHT_CLASS, isActive)
      logoHolder?.classList.toggle(FOOTER_LIGHT_CLASS, isActive)
    }

    const restorePageState = () => {
      root.classList.toggle(
        'compact-logo-active',
        resolveCurrentCompactLogoState(nav, previousCompactLogoState),
      )
      nav?.classList.toggle(FOOTER_LIGHT_CLASS, previousNavFooterLightState)
      logoHolder?.classList.toggle(FOOTER_LIGHT_CLASS, previousLogoHolderFooterLightState)
    }

    const timeline = gsap.timeline({
      defaults: {
        ease: 'none',
      },
      scrollTrigger: {
        id: 'footer-logo-reset',
        trigger: footer,
        start: 'top 70%',
        end: 'top 50%',
        scrub: true,
        invalidateOnRefresh: true,
        refreshPriority: -30,
        onEnter: () => {
          previousCompactLogoState = root.classList.contains('compact-logo-active')
          previousNavFooterLightState = nav?.classList.contains(FOOTER_LIGHT_CLASS) ?? false
          previousLogoHolderFooterLightState = logoHolder?.classList.contains(FOOTER_LIGHT_CLASS) ?? false
          root.classList.remove('compact-logo-active')
          applyFooterLightState(true)
        },
        onEnterBack: () => {
          previousCompactLogoState = root.classList.contains('compact-logo-active')
          previousNavFooterLightState = nav?.classList.contains(FOOTER_LIGHT_CLASS) ?? false
          previousLogoHolderFooterLightState = logoHolder?.classList.contains(FOOTER_LIGHT_CLASS) ?? false
          root.classList.remove('compact-logo-active')
          applyFooterLightState(true)
        },
        onLeaveBack: () => {
          restorePageState()
        },
        onUpdate: (self) => {
          if (self.progress > 0 || self.isActive) {
            root.classList.remove('compact-logo-active')
            applyFooterLightState(true)
          }
        },
        onRefresh: (self) => {
          if (self.progress > 0 || self.isActive) {
            root.classList.remove('compact-logo-active')
            applyFooterLightState(true)
          } else {
            restorePageState()
          }
        },
      },
    })

    if (footerBlock) {
      timeline.to(
        footerBlock,
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
        },
        0,
      )
    }

    if (footerOffItems.length) {
     

      timeline.to(
        footerOffItems,
        {
          //autoAlpha: 1,
          //filter: 'blur(20px)',
          //y: '-50vh',
          //duration: 1,
          //immediateRender: false,
        },
        0,
      )
      
    }

    timeline.to(
      logo,
      {
        scale: 1,
        y: 0,
        autoAlpha: 1,
        duration: 1,
        immediateRender: false,
      },
      0.75,
    )

    if (logoS) {
      timeline.to(
        logoS,
        {
          x: 0,
          y: 0,
          autoAlpha: 1,
          filter: 'blur(0px)',
          duration: 1,
        },
        0.8,
      )
    }

    if (logoDot) {
      timeline.to(
        logoDot,
        {
          x: 0,
          y: 0,
          autoAlpha: 1,
          filter: 'blur(0px)',
          duration: 1,
        },
        0.85,
      )
    }

    timeline.to(
      implrPaths,
      {
        x: 0,
        filter: 'blur(0px)',
        autoAlpha: 1,
         stagger: {
            each: 0.1,
            from: 'end',
            },
        duration: 1,
        immediateRender: false,
      },
      0.9,
    )

    timeline.to(
      tagline,
      {
        x: 0,
        y: 0,
        autoAlpha: 1,
        scale: 1,
        duration: 1,
        immediateRender: false,
      },
      0.75,
    )

    if (header) {
      timeline.to(
        header,
        {
          y: 0,
          height: 'auto',
          duration: 1,
          immediateRender: false,
        },
        0.75,
      )
    }

    if (nav) {
      timeline.to(
        nav,
        {
          y: 0,
          duration: 1,
          immediateRender: false,
        },
        0.75,
      )
    }

    if (navHolder) {
      timeline.to(
        navHolder,
        {
          height: 'auto',
          duration: 0.1,
          immediateRender: false,
        },
        0.75,
      )
    }

    return () => {
      timeline.kill()
      gsap.set([logo, ...implrPaths, logoS, logoDot, tagline, header, nav, navHolder, footerBlock].filter(Boolean), { clearProps: 'all' })
      gsap.set(document.body, { clearProps: 'backgroundColor' })
      nav?.classList.remove(FOOTER_LIGHT_CLASS)
      logoHolder?.classList.remove(FOOTER_LIGHT_CLASS)
    }
  })

  media.add('(prefers-reduced-motion: reduce)', () => {
    let previousCompactLogoState = root.classList.contains('compact-logo-active')
    let previousNavFooterLightState = nav?.classList.contains(FOOTER_LIGHT_CLASS) ?? false
    let previousLogoHolderFooterLightState = logoHolder?.classList.contains(FOOTER_LIGHT_CLASS) ?? false

    const restorePageState = () => {
      root.classList.toggle(
        'compact-logo-active',
        resolveCurrentCompactLogoState(nav, previousCompactLogoState),
      )
      nav?.classList.toggle(FOOTER_LIGHT_CLASS, previousNavFooterLightState)
      logoHolder?.classList.toggle(FOOTER_LIGHT_CLASS, previousLogoHolderFooterLightState)
    }

    const trigger = ScrollTrigger.create({
      id: 'footer-logo-reset-reduced',
      trigger: footer,
      start: 'top 60%',
      end: 'bottom bottom',
      invalidateOnRefresh: true,
      refreshPriority: -30,
      onEnter: () => {
        previousCompactLogoState = root.classList.contains('compact-logo-active')
        previousNavFooterLightState = nav?.classList.contains(FOOTER_LIGHT_CLASS) ?? false
        previousLogoHolderFooterLightState = logoHolder?.classList.contains(FOOTER_LIGHT_CLASS) ?? false
        root.classList.remove('compact-logo-active')
        nav?.classList.add(FOOTER_LIGHT_CLASS)
        logoHolder?.classList.add(FOOTER_LIGHT_CLASS)
        gsap.set(logo, { scale: 1, y: 0 })
        gsap.set(implrPaths, { x: 0, filter: 'blur(0px)', autoAlpha: 1 })
        if (footerBlock) {
          gsap.set(footerBlock, { autoAlpha: 1, y: 0 })
        }
        gsap.set([logoS, logoDot, tagline, header, nav, navHolder].filter(Boolean), {
          clearProps: 'transform,opacity,filter,height',
        })
      },
      onEnterBack: () => {
        previousCompactLogoState = root.classList.contains('compact-logo-active')
        previousNavFooterLightState = nav?.classList.contains(FOOTER_LIGHT_CLASS) ?? false
        previousLogoHolderFooterLightState = logoHolder?.classList.contains(FOOTER_LIGHT_CLASS) ?? false
        root.classList.remove('compact-logo-active')
        nav?.classList.add(FOOTER_LIGHT_CLASS)
        logoHolder?.classList.add(FOOTER_LIGHT_CLASS)
        gsap.set(logo, { scale: 1, y: 0 })
        gsap.set(implrPaths, { x: 0, filter: 'blur(0px)', autoAlpha: 1 })
        if (footerBlock) {
          gsap.set(footerBlock, { autoAlpha: 1, y: 0})
        }
        gsap.set([logoS, logoDot, tagline, header, nav, navHolder].filter(Boolean), {
          clearProps: 'transform,opacity,filter,height',
        })
      },
      onLeaveBack: () => {
        restorePageState()
        if (footerBlock) {
          gsap.set(footerBlock, { autoAlpha: 0, y: '-50vh'})
        }
      },
    })

    return () => {
      trigger.kill()
      gsap.set([logo, ...implrPaths, logoS, logoDot, tagline, header, nav, navHolder, footerBlock].filter(Boolean), { clearProps: 'all' })
      nav?.classList.remove(FOOTER_LIGHT_CLASS)
      logoHolder?.classList.remove(FOOTER_LIGHT_CLASS)
    }
  })

  return () => {
    media.revert()
  }
}
