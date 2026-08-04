import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { createFeaturedMediaHeaderLightControls } from './hero.js'

let pluginsRegistered = false

function registerPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger)
    pluginsRegistered = true
  }
}

function getFillMetrics(element) {
  // Must be measured at identity transform — same approach as home hero.
  const bounds = element.getBoundingClientRect()

  if (bounds.width <= 0 || bounds.height <= 0) {
    return {
      scale: 1,
      x: 0,
      y: 0,
    }
  }

  return {
    scale: window.innerWidth / bounds.width,
    x: window.innerWidth - bounds.right,
    y: window.innerHeight - bounds.bottom,
  }
}

function resolveFillMedia(container) {
  return (
    container.matches?.('.service-featured-media, video, picture, img')
      ? container
      : null
  )
    || container.querySelector('.service-featured-media')
    || container.querySelector('video, picture, img')
    || container
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

function isMeasurable(element) {
  if (!element) return false
  const bounds = element.getBoundingClientRect()
  return bounds.width > 0 && bounds.height > 0
}

function whenMediaReady(element, callback) {
  if (!element) {
    callback()
    return () => undefined
  }

  const video = element.matches?.('video')
    ? element
    : element.querySelector?.('video')
  const image = element.matches?.('img')
    ? element
    : element.querySelector?.('img')

  if (video) {
    if (video.readyState >= 1 && isMeasurable(element)) {
      callback()
      return () => undefined
    }

    const onReady = () => {
      if (isMeasurable(element)) callback()
    }
    video.addEventListener('loadedmetadata', onReady, { once: true })
    return () => video.removeEventListener('loadedmetadata', onReady)
  }

  if (image) {
    if (image.complete && image.naturalWidth > 0 && isMeasurable(element)) {
      callback()
      return () => undefined
    }

    const onReady = () => {
      if (isMeasurable(element)) callback()
    }
    image.addEventListener('load', onReady, { once: true })
    image.decode?.().then(onReady).catch(() => undefined)
    return () => image.removeEventListener('load', onReady)
  }

  if (isMeasurable(element)) {
    callback()
  } else {
    requestAnimationFrame(callback)
  }

  return () => undefined
}

function createParallaxFillAnimations(scope) {
  const containers = Array.from(scope.querySelectorAll('.parallax-fill'))
  if (!containers.length) {
    return () => undefined
  }

  const media = gsap.matchMedia()

  media.add('(prefers-reduced-motion: no-preference)', () => {
    const cleanups = []

    containers.forEach((container) => {
      const mediaEl = resolveFillMedia(container)
      // Pin the hero section that owns the fill media (same pattern as home .landing).
      const section = container.closest('.parallax-fill-section, .page-hero, section') || container
      if (!mediaEl || !section) return

      let metrics = { scale: 1, x: 0, y: 0 }
      let timeline
      let resizeTimer
      let headerLightControls = null
      const isServiceFeatured = container.matches('[data-transition-dock="service-featured-media"]')

      const measureAtRest = () => {
        gsap.set(mediaEl, { x: 0, y: 0, scale: 1 })
        metrics = getFillMetrics(mediaEl)
      }

      const build = () => {
        timeline?.scrollTrigger?.kill()
        timeline?.kill()
        headerLightControls?.cleanup()
        headerLightControls = isServiceFeatured
          ? createFeaturedMediaHeaderLightControls(mediaEl)
          : null

        const isDesktop = window.matchMedia('(min-width: 1024px)').matches
        const blurTargets = Array.from(section.querySelectorAll('[data-blur]'))

        gsap.set(mediaEl, {
          display: 'block',
          transformOrigin: 'right bottom',
          willChange: 'transform',
          borderRadius: getComputedStyle(mediaEl).borderRadius || '10px',
          zIndex: 0,
          position: 'relative',
        })

        if (blurTargets.length) {
          gsap.set(blurTargets, {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            willChange: 'opacity, transform, filter',
          })
        }

        // Always measure from identity so end values stay correct on reverse scrub.
        measureAtRest()

        const syncHeaderLight = () => headerLightControls?.sync()

        timeline = gsap.timeline({
          defaults: {
            ease: 'none',
          },
          scrollTrigger: {
            id: 'parallax-fill',
            trigger: section,
            pin: isDesktop ? section : false,
            start: 'top top',
            end: () => `+=${window.innerHeight}`,
            scrub: true,
            // Do NOT invalidateOnRefresh — re-reading bounds while scaled
            // collapses end values to ~identity and breaks reverse scrub.
            invalidateOnRefresh: false,
            anticipatePin: 0,
            refreshPriority: 1,
            onUpdate: syncHeaderLight,
            onRefresh: syncHeaderLight,
            onLeave: syncHeaderLight,
            onLeaveBack: syncHeaderLight,
          },
        })

        syncHeaderLight()

        // Static end values (captured at rest). Function values + refresh were
        // remeasuring the scaled element and wiping the fill on the way back up.
        // Mobile: keep y at 0 so the fill only expands on x/scale.
        timeline.to(mediaEl, {
          x: metrics.x,
          y: isDesktop ? metrics.y : 0,
          scale: metrics.scale,
          borderRadius: '0px',
          duration: 1,
        }, 0)

        // Match home hero title: lift + blur as the featured media fills.
        if (blurTargets.length) {
          timeline.to(blurTargets, {
            opacity: 0,
            y: -400,
            filter: 'blur(20px)',
            duration: 1,
            delay: 0.1,
          }, 0)
        }
      }

      const onResize = () => {
        window.clearTimeout(resizeTimer)
        resizeTimer = window.setTimeout(build, 150)
      }

      const cancelReady = whenMediaReady(mediaEl, build)
      window.addEventListener('resize', onResize)

      cleanups.push(() => {
        cancelReady()
        window.removeEventListener('resize', onResize)
        window.clearTimeout(resizeTimer)
        timeline?.scrollTrigger?.kill()
        timeline?.kill()
        headerLightControls?.cleanup()
        headerLightControls = null
        gsap.set(mediaEl, { clearProps: 'transform,willChange,borderRadius,zIndex,position' })
        gsap.set(section.querySelectorAll('[data-blur]'), {
          clearProps: 'opacity,transform,filter,willChange',
        })
      })
    })

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  })

  return () => {
    media.revert()
  }
}

export function createParallaxAnimations(scope) {
  if (!scope) {
    return () => undefined
  }

  registerPlugins()

  const fillCleanup = createParallaxFillAnimations(scope)

  if (window.innerWidth < 768) {
    return () => {
      fillCleanup()
    }
  }

  const ParallaxTargets = Array.from(scope.querySelectorAll('.parallax'))
  const ParallaxSubtleTargets = Array.from(scope.querySelectorAll('.parallax-subtle'))
  const targets = [...ParallaxTargets, ...ParallaxSubtleTargets]

  if (!targets.length) {
    return () => {
      fillCleanup()
    }
  }

  const media = gsap.matchMedia()

  media.add('(prefers-reduced-motion: no-preference)', () => {
    const createAnimations = (animationTargets, fromVars, toVars) => animationTargets.map((target) => {
      gsap.set(target, {
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
        },
      })
    })

    const animations = [
      ...createAnimations(
        ParallaxTargets,
        {
          y: 0,
          scale: 1,
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
          scale: 1,
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
      animations.forEach((animation) => {
        animation.scrollTrigger?.kill()
        animation.kill()
      })
      targets.forEach((target) => {
        gsap.set(target, { clearProps: 'scale,transform,willChange' })
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
    fillCleanup()
    media.revert()
  }
}
