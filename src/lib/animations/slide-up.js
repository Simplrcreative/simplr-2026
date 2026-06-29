import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let pluginsRegistered = false

function registerPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger)
    pluginsRegistered = true
  }
}

/** Default true — only explicit `data-mobile-animation="false"` opts out on mobile. */
function getMobileAnimationDisabledTargets(scope) {
  return new Set(
    Array.from(scope.querySelectorAll('[data-mobile-animation="false"]')),
  )
}

function buildSlideUpAnimations({
  slideUpFromLeftTargets,
  slideUpTargets,
  slideUpSubtleTargets,
}) {
  const createAnimations = (animationTargets, fromVars, toVars) => animationTargets.map((target) => {
    gsap.set(target, {
      autoAlpha: 1,
      willChange: 'transform, opacity',
      ...fromVars,
    })

    return gsap.to(target, {
      autoAlpha: 1,
      overwrite: 'auto',
      ...toVars,
      scrollTrigger: {
        trigger: target,
        start: 'top 100%',
        end: 'top 50%',
        scrub: true,
        stagger: 0.01,
        invalidateOnRefresh: true,
        refreshPriority: -15,
      },
    })
  })

  return [
    ...createAnimations(
      slideUpFromLeftTargets,
      {
        y: 0,
        transformOrigin: 'top left',
        scale: 0.2,
        ease: 'none',
      },
      {
        y: 0,
        scale: 1,
        duration: 1,
        ease: 'none',
      },
    ),
    ...createAnimations(
      slideUpTargets,
      { y: 200 },
      { y: 0, duration: 1, ease: 'none' },
    ),
    ...createAnimations(
      slideUpSubtleTargets,
      { y: 60, autoAlpha: 1 },
      { y: 0, autoAlpha: 1, duration: 1, ease: 'none' },
    ),
  ]
}

function cleanupSlideUpAnimations(animations) {
  animations.forEach((animation) => {
    animation.scrollTrigger?.kill()
    animation.kill()
    const target = animation.targets()[0]
    if (target) {
      gsap.set(target, { clearProps: 'opacity,transform,willChange' })
    }
  })
}

export function createSlideUpAnimation(
  target,
  fromVars = { y: 200 },
  toVars = { y: 0, duration: 1, ease: 'none' },
  triggerVars = {}
) {
  if (!target) {
    return () => undefined
  }

  registerPlugins()

  const media = gsap.matchMedia()

  media.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.set(target, {
      autoAlpha: 1,
      willChange: 'transform, opacity',
      ...fromVars,
    })

    const animation = gsap.to(target, {
      autoAlpha: 1,
      overwrite: 'auto',
      ...toVars,
      scrollTrigger: {
        trigger: target,
        start: 'top 100%',
        end: 'top 50%',
        scrub: true,
        invalidateOnRefresh: true,
        refreshPriority: -15,
        ...triggerVars,
      },
    })

    return () => {
      animation.scrollTrigger?.kill()
      animation.kill()
      gsap.set(target, { clearProps: 'opacity,transform,willChange' })
    }
  })

  media.add('(prefers-reduced-motion: reduce)', () => {
    gsap.set(target, { autoAlpha: 1, y: 0, clearProps: 'opacity,transform,willChange' })

    return undefined
  })

  return () => {
    media.revert()
  }
}

export function createSlideUpAnimations(scope) {
  if (!scope) {
    return () => undefined
  }

  registerPlugins()

  const slideUpFromLeftTargets = Array.from(scope.querySelectorAll('.slide-up-from-left'))
  const slideUpTargets = Array.from(scope.querySelectorAll('.slide-up'))
  const slideUpSubtleTargets = Array.from(scope.querySelectorAll('.slide-up-subtle'))
  const mobileAnimationDisabledTargets = getMobileAnimationDisabledTargets(scope)
  const allTargets = [...slideUpFromLeftTargets, ...slideUpTargets, ...slideUpSubtleTargets]

  if (!allTargets.length) {
    return () => undefined
  }

  const media = gsap.matchMedia()

  media.add('(prefers-reduced-motion: no-preference) and (min-width: 768px)', () => {
    const animations = buildSlideUpAnimations({
      slideUpFromLeftTargets,
      slideUpTargets,
      slideUpSubtleTargets,
    })

    return () => cleanupSlideUpAnimations(animations)
  })

  media.add('(prefers-reduced-motion: no-preference) and (max-width: 767.9px)', () => {
    const animations = buildSlideUpAnimations({
      slideUpFromLeftTargets: slideUpFromLeftTargets.filter(
        (target) => !mobileAnimationDisabledTargets.has(target),
      ),
      slideUpTargets: slideUpTargets.filter(
        (target) => !mobileAnimationDisabledTargets.has(target),
      ),
      slideUpSubtleTargets: slideUpSubtleTargets.filter(
        (target) => !mobileAnimationDisabledTargets.has(target),
      ),
    })

    return () => cleanupSlideUpAnimations(animations)
  })

  media.add('(prefers-reduced-motion: reduce)', () => {
    allTargets.forEach((target) => {
      gsap.set(target, { autoAlpha: 1, y: 0, clearProps: 'opacity,transform,willChange' })
    })

    return undefined
  })

  return () => {
    media.revert()
  }
}