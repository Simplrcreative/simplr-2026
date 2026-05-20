import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let pluginsRegistered = false

function registerPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger)
    pluginsRegistered = true
  }
}

/**
 * Reveals work-content images by scaling their height from the top edge.
 * Uses clipPath so layout is unaffected. Non-scrubable, fires once on
 * viewport entry. Pictures in the same section (e.g. Two Images) are
 * batched together so stagger feels intentional.
 */
export function createWorkImagesAnimation() {
  registerPlugins()

  const media = gsap.matchMedia()

  media.add('(prefers-reduced-motion: no-preference)', () => {
    const pictures = gsap.utils.toArray('.work-content picture.ratio')

    if (!pictures.length) return undefined

    // Collapsed at start — no height visible, anchored at top edge
    gsap.set(pictures, { autoAlpha: 0, y: 100, clipPath: 'inset(0% 0% 100% 0%)' })

    ScrollTrigger.batch(pictures, {
      start: 'top 100%',
      once: true,
      interval: 0,
      onEnter: (batch) => {
        gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.75,
            ease: 'power4.in',
            stagger: 0.15,
            onComplete() {
                gsap.set(batch, { clearProps: 'clipPath' })
            },
        })
      },
    })

    return () => {
      ScrollTrigger.getAll()
        .filter((t) => pictures.includes(t.trigger))
        .forEach((t) => t.kill())

      gsap.set(pictures, { clearProps: 'clipPath' })
    }
  })

  media.add('(prefers-reduced-motion: reduce)', () => {
    return undefined
  })

  return () => {
    media.revert()
  }
}
