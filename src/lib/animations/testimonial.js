import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let pluginsRegistered = false

function registerPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger)
    pluginsRegistered = true
  }
}

export function createTestimonialDotAnimation() {
  registerPlugins()

  const dots = gsap.utils.toArray('.testimonial-dot-slide')
  if (!dots.length) return () => undefined

  const tweens = dots.map((slideDot) => {
    const trigger = slideDot.closest('.testimonial')
    if (!trigger) return null

    gsap.set(slideDot, { x: -30 })

    return gsap.to(slideDot, {
      x: 0,
      ease: 'none',
      scrollTrigger: {
        trigger,
        start: 'top 70%',
        end: 'top 45%',
        scrub: true,
        invalidateOnRefresh: true,
        refreshPriority: -15,
      },
    })
  }).filter(Boolean)

  return () => {
    tweens.forEach((tween) => {
      tween.scrollTrigger?.kill()
      tween.kill()
    })
  }
}
