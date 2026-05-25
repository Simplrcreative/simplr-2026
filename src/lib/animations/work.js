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
 * Pins section.next-work and scrubs .next-title from right to left,
 * unpinning once the text has fully exited to the left.
 */
export function createNextWorkAnimation() {
  registerPlugins()

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const section = document.querySelector('section.next-work')
  const title = document.querySelector('.next-title')

  if (!section || !title) return () => {}

  let st = null
  let tween = null

  function setup() {
    // If el (the TransitionFrame content div) still has a CSS transform from the
    // page transition animation — even an identity matrix() left by GSAP — it
    // becomes the containing block for position:fixed descendants. ScrollTrigger
    // pins by setting position:fixed, so the pinned section would be fixed
    // relative to el (which scrolls) rather than the viewport, killing the pin.
    // Explicitly remove the inline transform to restore correct fixed scoping.
    const elDiv = section.closest('main > div')
    if (elDiv) elDiv.style.transform = ''

    const titleWidth = title.offsetWidth
    const vw = window.innerWidth
    const pinDuration = window.innerHeight
    const startX = (vw + titleWidth) / 3
    const endX = -startX

    if (tween) { tween.kill(); tween = null }
    if (st) { st.kill(); st = null }
    gsap.set(title, { clearProps: 'x', autoAlpha: 1 })

    tween = gsap.fromTo(title, { x: startX, autoAlpha: 1 }, { x: endX, autoAlpha: 1, ease: 'none', paused: true })
    st = ScrollTrigger.create({
      trigger: section,
      //start: 'top top',
      start: 'top 98%',
      //end: `+=${pinDuration}`,
      end: `top 0`,
      //pin: true,
      scrub: 2,
      //markers: true,
      anticipatePin: 1,
      animation: tween,
      invalidateOnRefresh: true,
    })
  }

  // On SPA routing the content div has a scale+y transform applied during the
  // transition, so BCR measurements are wrong until clearProps fires in done().
  // Wait for the event before setting up. On direct load / refresh there is no
  // transition, so set up immediately (the event may have already fired).
  if (document.documentElement.classList.contains('page-transitioning')) {
    window.addEventListener('page-transition:complete', setup, { once: true })
  } else {
    setup()
  }

  return () => {
    window.removeEventListener('page-transition:complete', setup)
    st?.kill()
    tween?.kill()
    gsap.set(title, { clearProps: 'x' })
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
    gsap.set(pictures, { autoAlpha: 0, y: 0, clipPath: 'inset(100% 100% 0% 0%)' })

    ScrollTrigger.batch(pictures, {
      start: 'top 100%',
      once: true,
      interval: 0,
      onEnter: (batch) => {
        gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1,
            ease: 'power4.out',
            stagger: 0.01,
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
