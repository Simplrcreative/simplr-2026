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

  const testimonials = gsap.utils.toArray('.testimonial')
  if (!testimonials.length) return () => undefined

  const triggers = testimonials.map((el) =>
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => el.classList.add('is-visible'),
    }),
  )

  return () => {
    triggers.forEach((t) => t.kill())
  }
}
