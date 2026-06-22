import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let pluginsRegistered = false

const FOOTER_LIGHT_CLASS = 'footer'

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
  const nav = document.querySelector('#desktop-nav')
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

    const applyFooterLightState = (isActive) => {
      nav?.classList.toggle(FOOTER_LIGHT_CLASS, isActive)
      logoHolder?.classList.toggle(FOOTER_LIGHT_CLASS, isActive)
    }

    const restorePageState = () => {
      root.classList.toggle(
        'compact-logo-active',
        resolveCurrentCompactLogoState(nav, previousCompactLogoState),
      )
      nav?.classList.remove(FOOTER_LIGHT_CLASS)
      logoHolder?.classList.remove(FOOTER_LIGHT_CLASS)
    }

    const shouldApplyFooterLightState = (self) =>
      self.progress > 0 || (self.isActive && self.direction === 1)

    const syncFooterNavState = (self) => {
      if (shouldApplyFooterLightState(self)) {
        root.classList.remove('compact-logo-active')
        applyFooterLightState(true)
        return
      }

      restorePageState()
    }

    const timeline = gsap.timeline({
      defaults: {
        ease: 'power4.out',
      },
      scrollTrigger: {
        id: 'footer-logo-reset',
        trigger: footer,
        start: 'top 80%',
        end: 'top 50%',
        //markers: true,
        scrub: true,
        invalidateOnRefresh: true,
        refreshPriority: -30,
        onEnter: () => {
          previousCompactLogoState = root.classList.contains('compact-logo-active')
          syncFooterNavState(timeline.scrollTrigger)
        },
        onEnterBack: () => {
          syncFooterNavState(timeline.scrollTrigger)
        },
        onLeaveBack: () => {
          restorePageState()
        },
        onUpdate: (self) => {
          syncFooterNavState(self)
        },
        onRefresh: (self) => {
          syncFooterNavState(self)
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
            each: 0.2,
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

    // Footer logo: circle text spins in, pauses, spins out; icon fades in.
    // The wrapper uses `items-end` — the SVG sits at the bottom of the div, but
    // its overall height is set by the taller left column. `start: 'top …'` fires
    // against the div's top edge, long before the SVG is visible. Switching to
    // `bottom 95%` fires when the div's bottom (= the SVG) enters the viewport.
    const footerLogoTrigger = footer.querySelector('.footer-logo-trigger')
    const circleText = footer.querySelector('.footer-logo-circle-text')
    const logoIcon = footer.querySelector('.footer-logo-icon')

    let circleTimeline = null
    let iconTween = null

    if (circleText) {
      gsap.set(circleText, { scale: 0, autoAlpha: 0, transformOrigin: '50% 50%' })
      circleTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: footerLogoTrigger,
          start: 'top 95%',
          toggleActions: 'play none none none',
          invalidateOnRefresh: true,
          refreshPriority: -30,
          //markers: true
        },
      })
      circleTimeline
        .to(circleText, {
          scale: 1,
          rotation: 360,
          autoAlpha: 1,
          duration: 1.6,
          ease: 'power3.out',
          transformOrigin: '50% 50%',
        })
        .to(circleText, {
          rotation: 720,
          scale: 0,
          autoAlpha: 0,
          duration: 1.2,
          ease: 'power3.in',
          delay: 0.5,
          transformOrigin: '50% 50%',
        })
    }

    if (logoIcon) {
      gsap.set(logoIcon, { autoAlpha: 0 })
      iconTween = gsap.to(logoIcon, {
        autoAlpha: 1,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0.4,
        scrollTrigger: {
          trigger: footerLogoTrigger,
          start: 'top 95%',
          toggleActions: 'play none none none',
          invalidateOnRefresh: true,
          refreshPriority: -30,
        },
      })
    }

    return () => {
      timeline.kill()
      circleTimeline?.scrollTrigger?.kill()
      circleTimeline?.kill()
      iconTween?.scrollTrigger?.kill()
      iconTween?.kill()
      gsap.set([logo, ...implrPaths, logoS, logoDot, tagline, header, nav, navHolder, footerBlock, circleText, logoIcon].filter(Boolean), { clearProps: 'all' })
      gsap.set(document.body, { clearProps: 'backgroundColor' })
      nav?.classList.remove(FOOTER_LIGHT_CLASS)
      logoHolder?.classList.remove(FOOTER_LIGHT_CLASS)
    }
  })

  media.add('(prefers-reduced-motion: reduce)', () => {
    let previousCompactLogoState = root.classList.contains('compact-logo-active')

    const applyFooterLightState = () => {
      nav?.classList.add(FOOTER_LIGHT_CLASS)
      logoHolder?.classList.add(FOOTER_LIGHT_CLASS)
    }

    const restorePageState = () => {
      root.classList.toggle(
        'compact-logo-active',
        resolveCurrentCompactLogoState(nav, previousCompactLogoState),
      )
      nav?.classList.remove(FOOTER_LIGHT_CLASS)
      logoHolder?.classList.remove(FOOTER_LIGHT_CLASS)
    }

    const shouldApplyFooterLightState = (self) =>
      self.progress > 0 || (self.isActive && self.direction === 1)

    const syncFooterNavState = (self) => {
      if (shouldApplyFooterLightState(self)) {
        root.classList.remove('compact-logo-active')
        applyFooterLightState()
        return
      }

      restorePageState()
    }

    const trigger = ScrollTrigger.create({
      id: 'footer-logo-reset-reduced',
      trigger: footer,
      start: 'top 70%',
      end: 'bottom bottom',
      invalidateOnRefresh: true,
      refreshPriority: -30,
      onEnter: () => {
        previousCompactLogoState = root.classList.contains('compact-logo-active')
        syncFooterNavState(trigger)
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
        syncFooterNavState(trigger)
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
      onUpdate: (self) => {
        syncFooterNavState(self)
      },
      onRefresh: (self) => {
        syncFooterNavState(self)
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
