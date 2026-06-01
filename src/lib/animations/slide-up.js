import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let pluginsRegistered = false

function registerPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger)
    pluginsRegistered = true
  }
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
  const targets = [...slideUpFromLeftTargets, ...slideUpTargets, ...slideUpSubtleTargets]

  if (!targets.length) {
    return () => undefined
  }

  const media = gsap.matchMedia()

  media.add('(prefers-reduced-motion: no-preference)', () => {
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
          markers: true,
        },
      })
    })

    const animations = [
      ...createAnimations(
        slideUpFromLeftTargets,
        {
          y: 0,
          transformOrigin: 'top left',
          scale: 0.2,
          ease: 'none'
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
        {
          y: 200,
        },
        {
          y: 0,
          duration: 1,
          ease: 'none',
        },
      ),
      ...createAnimations(
        slideUpSubtleTargets,
        {
          y: 50,
          autoAlpha: 0.2
        },
        {
          y: 0,
          autoAlpha: 1,
          duration: 1,
          ease: 'none',
        },
      ),
    ]

    return () => {
      animations.forEach((animation, index) => {
        animation.scrollTrigger?.kill()
        animation.kill()
        gsap.set(targets[index], { clearProps: 'opacity,transform,willChange' })
      })
    }
  })

  media.add('(prefers-reduced-motion: reduce)', () => {
    targets.forEach((target) => {
      gsap.set(target, { autoAlpha: 1, y: 0, clearProps: 'opacity,transform,willChange' })
    })

    return undefined
  })

  return () => {
    media.revert()
  }
}