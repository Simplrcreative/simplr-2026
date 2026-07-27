import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getCompactLogoTransform, isCompactLogoTabletUp } from './compact-logo-transform.js'

let pluginsRegistered = false

const FOOTER_LIGHT_CLASS = 'footer'

/**
 * Header logo / tagline expand–collapse at the footer.
 * Kept in this file but disabled while we simplify — flip to `true` to restore.
 * Circle text + footer logo icon extras still run when this is `false`.
 */
export const FOOTER_LOGO_ANIMATION_ENABLED = false

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
    const parent = trigger.section.parentElement
    const measureEl =
      parent?.classList?.contains('pin-spacer') ? parent : trigger.section
    const bounds = measureEl.getBoundingClientRect()

    if (bounds.top > threshold || bounds.top < activeSectionTop) {
      continue
    }

    activeSectionTop = bounds.top
    activeState = trigger.isCompact
  }

  return activeState
}

function createFooterLogoExtras(footer) {
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
        toggleActions: 'restart none restart reset',
        invalidateOnRefresh: false,
        refreshPriority: -30,
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
        toggleActions: 'restart none restart reset',
        invalidateOnRefresh: false,
        refreshPriority: -30,
      },
    })
  }

  return {
    circleText,
    logoIcon,
    cleanup() {
      circleTimeline?.scrollTrigger?.kill()
      circleTimeline?.kill()
      iconTween?.scrollTrigger?.kill()
      iconTween?.kill()
    },
  }
}

export function createFooterAnimation(scope) {
  if (!scope) {
    return () => undefined
  }

  registerPlugins()

  const footer = scope.matches?.('footer') ? scope : scope.querySelector('footer')
  if (!footer) {
    return () => undefined
  }

  // Circle / icon extras stay active; header logo expand–collapse stays behind the flag.
  if (!FOOTER_LOGO_ANIMATION_ENABLED) {
    document.querySelector('#desktop-nav')?.classList.remove(FOOTER_LIGHT_CLASS)
    document.querySelector('.logo-holder')?.classList.remove(FOOTER_LIGHT_CLASS)

    const extras = createFooterLogoExtras(footer)
    return () => {
      extras.cleanup()
    }
  }

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
  const root = document.documentElement

  if (!footer || !logo || !tagline || !implrPaths.length) {
    return () => undefined
  }

  const media = gsap.matchMedia()
  const tweenTargets = [logo, ...implrPaths, logoS, logoDot, tagline, header, nav, navHolder, footerBlock].filter(Boolean)

  const applyFooterLightState = (isActive) => {
    nav?.classList.toggle(FOOTER_LIGHT_CLASS, isActive)
    logoHolder?.classList.toggle(FOOTER_LIGHT_CLASS, isActive)
  }

  const clearFooterChrome = () => {
    nav?.classList.remove(FOOTER_LIGHT_CLASS)
    logoHolder?.classList.remove(FOOTER_LIGHT_CLASS)
  }

  /**
   * Snap expand/collapse (no scrub).
   * Scroll-linked scrub desyncs logo vs tagline when iOS Safari chrome
   * changes innerHeight or when content height changes invalidate mid-flight.
   * Time-based tweens cannot get stuck at mismatched scrub progress.
   */
  media.add('(prefers-reduced-motion: no-preference)', () => {
    let previousCompactLogoState = root.classList.contains('compact-logo-active')
    let isExpanded = false
    const extras = createFooterLogoExtras(footer)

    const expandFooterChrome = () => {
      if (isExpanded) return
      isExpanded = true
      previousCompactLogoState = root.classList.contains('compact-logo-active')
      root.classList.remove('compact-logo-active')
      applyFooterLightState(true)

      const tween = {
        duration: 0.55,
        ease: 'power3.out',
        overwrite: 'auto',
      }

      gsap.to(logo, { scale: 1, y: 0, autoAlpha: 1, ...tween })
      if (logoS) gsap.to(logoS, { x: 0, y: 0, autoAlpha: 1, filter: 'blur(0px)', ...tween })
      if (logoDot) gsap.to(logoDot, { x: 0, y: 0, autoAlpha: 1, filter: 'blur(0px)', ...tween })
      gsap.to(implrPaths, {
        x: 0,
        filter: 'blur(0px)',
        autoAlpha: 1,
        stagger: { each: 0.05, from: 'end' },
        ...tween,
      })
      gsap.to(tagline, { x: 0, y: 0, scale: 1, autoAlpha: 1, ...tween })
      if (header) gsap.to(header, { y: 0, height: 'auto', ...tween })
      if (nav) gsap.to(nav, { y: 0, ...tween })
      if (navHolder) gsap.to(navHolder, { height: 'auto', duration: 0.2, overwrite: 'auto' })
      if (footerBlock) gsap.to(footerBlock, { autoAlpha: 1, y: 0, ...tween })
    }

    const collapseFooterChrome = () => {
      if (!isExpanded) return
      isExpanded = false

      root.classList.toggle(
        'compact-logo-active',
        resolveCurrentCompactLogoState(nav, previousCompactLogoState),
      )
      clearFooterChrome()

      const {
        logoScale,
        logoY,
        taglineScale,
        taglineY,
        taglineX,
      } = getCompactLogoTransform()
      const tabletUp = isCompactLogoTabletUp()

      const tween = {
        duration: 0.45,
        ease: 'power2.inOut',
        overwrite: 'auto',
      }

      gsap.to(logo, { scale: logoScale, y: logoY, autoAlpha: 1, ...tween })
      gsap.to(implrPaths, {
        x: -20,
        filter: 'blur(10px)',
        autoAlpha: 0,
        stagger: 0.04,
        ...tween,
      })
      gsap.to(tagline, {
        scale: taglineScale,
        y: taglineY,
        x: taglineX,
        autoAlpha: 1,
        ...tween,
      })
      // logoS / logoDot stay in the mark; no separate compact offset from logo scroll
      if (logoS) gsap.to(logoS, { clearProps: 'transform,opacity,filter', duration: 0.2, overwrite: 'auto' })
      if (logoDot) gsap.to(logoDot, { clearProps: 'transform,opacity,filter', duration: 0.2, overwrite: 'auto' })

      if (tabletUp) {
        if (header) gsap.to(header, { y: -20, ...tween })
        if (nav) gsap.to(nav, { y: -20, ...tween })
        if (navHolder) gsap.to(navHolder, { height: '30px', duration: 0.2, overwrite: 'auto' })
      } else {
        if (header) gsap.to(header, { clearProps: 'transform,height', ...tween })
        if (nav) gsap.to(nav, { clearProps: 'transform', ...tween })
        if (navHolder) gsap.to(navHolder, { clearProps: 'height', duration: 0.2, overwrite: 'auto' })
      }

      if (footerBlock) {
        gsap.to(footerBlock, {
          autoAlpha: 0,
          y: '-20vh',
          ...tween,
          onComplete: () => {
            // Re-sync logo scroll scrub ownership after the reverse settles.
            ScrollTrigger.update()
          },
        })
      } else {
        gsap.delayedCall(tween.duration, () => ScrollTrigger.update())
      }
    }

    const syncFromTrigger = (self) => {
      // Past the start line (scrolling down into / through footer) → expanded.
      if (self.direction === 1 && self.progress > 0) {
        expandFooterChrome()
        return
      }
      if (self.isActive) {
        expandFooterChrome()
        return
      }
      collapseFooterChrome()
    }

    const trigger = ScrollTrigger.create({
      id: 'footer-logo-reset',
      trigger: footer,
      start: 'top 85%',
      end: 'bottom top',
      invalidateOnRefresh: false,
      refreshPriority: -30,
      onEnter: expandFooterChrome,
      onEnterBack: expandFooterChrome,
      onLeaveBack: collapseFooterChrome,
      onRefresh: syncFromTrigger,
    })

    // Orientation only — never visualViewport resize (Safari chrome).
    const handleOrientationChange = () => {
      window.requestAnimationFrame(() => {
        ScrollTrigger.refresh()
      })
    }
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
      trigger.kill()
      extras.cleanup()
      gsap.killTweensOf(tweenTargets)
      gsap.set([...tweenTargets, extras.circleText, extras.logoIcon].filter(Boolean), { clearProps: 'all' })
      clearFooterChrome()
    }
  })

  media.add('(prefers-reduced-motion: reduce)', () => {
    let previousCompactLogoState = root.classList.contains('compact-logo-active')
    let isExpanded = false

    const expandFooterChrome = () => {
      if (isExpanded) return
      isExpanded = true
      previousCompactLogoState = root.classList.contains('compact-logo-active')
      root.classList.remove('compact-logo-active')
      applyFooterLightState(true)
      gsap.set(logo, { scale: 1, y: 0 })
      gsap.set(implrPaths, { x: 0, filter: 'blur(0px)', autoAlpha: 1 })
      if (footerBlock) gsap.set(footerBlock, { autoAlpha: 1, y: 0 })
      gsap.set([logoS, logoDot, tagline, header, nav, navHolder].filter(Boolean), {
        clearProps: 'transform,opacity,filter,height',
      })
    }

    const collapseFooterChrome = () => {
      if (!isExpanded) return
      isExpanded = false
      root.classList.toggle(
        'compact-logo-active',
        resolveCurrentCompactLogoState(nav, previousCompactLogoState),
      )
      clearFooterChrome()

      const {
        logoScale,
        logoY,
        taglineScale,
        taglineY,
        taglineX,
      } = getCompactLogoTransform()
      const tabletUp = isCompactLogoTabletUp()

      gsap.set(logo, { scale: logoScale, y: logoY, autoAlpha: 1 })
      gsap.set(implrPaths, { x: -20, filter: 'blur(10px)', autoAlpha: 0 })
      gsap.set(tagline, {
        scale: taglineScale,
        y: taglineY,
        x: taglineX,
        autoAlpha: 1,
      })
      if (tabletUp) {
        if (header) gsap.set(header, { y: -20 })
        if (nav) gsap.set(nav, { y: -20 })
        if (navHolder) gsap.set(navHolder, { height: '30px' })
      }
      if (footerBlock) gsap.set(footerBlock, { autoAlpha: 0, y: '-50vh' })
      ScrollTrigger.update()
    }

    const trigger = ScrollTrigger.create({
      id: 'footer-logo-reset-reduced',
      trigger: footer,
      start: 'top 85%',
      end: 'bottom top',
      invalidateOnRefresh: false,
      refreshPriority: -30,
      onEnter: expandFooterChrome,
      onEnterBack: expandFooterChrome,
      onLeaveBack: collapseFooterChrome,
      onRefresh: (self) => {
        if (self.isActive || (self.direction === 1 && self.progress > 0)) {
          expandFooterChrome()
        } else {
          collapseFooterChrome()
        }
      },
    })

    return () => {
      trigger.kill()
      gsap.set(tweenTargets, { clearProps: 'all' })
      clearFooterChrome()
    }
  })

  return () => {
    media.revert()
  }
}
