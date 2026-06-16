import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let pluginsRegistered = false

function registerPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger)
    pluginsRegistered = true
  }
}

export function createParallaxAnimation(
  target,
  fromVars = { y: 0, scale: 1 },
  toVars = { y: 120, scale: 1.08, duration: 1, ease: 'none' },
  triggerVars = {}
) {
  if (!target) {
    return () => undefined
  }

  registerPlugins()

  const media = gsap.matchMedia()

  media.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.set(target, {
      scale: 1,
      y: 0,
      willChange: 'transform, scale',
      ...fromVars,
    })

    const animation = gsap.to(target, {
      overwrite: 'auto',
      ...toVars,
      scrollTrigger: {
        trigger: target,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
        refreshPriority: -15,
        ...triggerVars,
      },
    })

    return () => {
      animation.scrollTrigger?.kill()
      animation.kill()
      gsap.set(target, { clearProps: 'scale,transform,willChange' })
    }
  })

  media.add('(prefers-reduced-motion: reduce)', () => {
    gsap.set(target, { scale: 1, y: 0, clearProps: 'scale,transform,willChange' })

    return undefined
  })

  return () => {
    media.revert()
  }
}

export function createParallaxAnimations(scope) {
  if (!scope) {
    return () => undefined
  }

  if (window.innerWidth < 768) {
    return () => undefined
  }

  registerPlugins()

  const ParallaxTargets = Array.from(scope.querySelectorAll('.parallax'))
  const ParallaxSubtleTargets = Array.from(scope.querySelectorAll('.parallax-subtle'))
  const targets = [ ...ParallaxTargets, ...ParallaxSubtleTargets]

  if (!targets.length) {
    return () => undefined
  }

  const media = gsap.matchMedia()

  media.add('(prefers-reduced-motion: no-preference)', () => {
    const createAnimations = (animationTargets, fromVars, toVars) => animationTargets.map((target) => {
      gsap.set(targets, {
        scale: 1,
        y: 0,
        willChange: 'transform, opacity',
        ...fromVars,
      })
     

      return gsap.to(target, {
        overwrite: 'auto',
        ...toVars,
        scrollTrigger: {
          trigger: target,
          start: 'top 50%',
          end: 'top -60%',
          scrub: true,
          stagger: 0.01,
          invalidateOnRefresh: true,
          refreshPriority: -15,
          //markers: true,
        },
      })
    })

    const animations = [
      ...createAnimations(
        ParallaxTargets,
        {
          y: 0,
          scale: 1
        },
        {
          transformOrigin: 'top right',
          y: 300,
          scale: 0.65,
          ease: 'none',
        },
      ),
      ...createAnimations(
        ParallaxSubtleTargets,
        {
          y: -30,
          scale: 1
        },
        {
          y: 0,
          scale: 1,
          duration: 1,
          ease: 'none',
        },
      ),
    ]

    return () => {
      animations.forEach((animation, index) => {
        animation.scrollTrigger?.kill()
        animation.kill()
        gsap.set(targets[index], { clearProps: 'scale,transform,willChange' })
      })
    }
  })

  media.add('(prefers-reduced-motion: reduce)', () => {
    targets.forEach((target) => {
      gsap.set(target, { scale: 1, y: 0, clearProps: 'scale,transform,willChange' })
    })

    return undefined
  })

  return () => {
    media.revert()
  }
}