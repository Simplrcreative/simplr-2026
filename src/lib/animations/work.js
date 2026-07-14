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
    //const endX = -startX
    const endX = '-15%'

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
    const pictures = gsap.utils.toArray('.work-content .ratio')

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

/**
 * Recreates the client-work image handoff motion on hover for thumb-swap cards:
 * - secondary image slides up into frame
 * - primary image slides up and out of frame
 */
export function createWorkThumbHoverAnimation(scope = document) {
  // Mobile taps fire pointerenter then click; handleClick preventDefaults while
  // the hover timeline is incomplete, which blocks navigation. Skip entirely
  // on coarse pointers / narrow viewports so cards link normally (test).
  if (
    window.matchMedia('(hover: none), (pointer: coarse)').matches
    || window.matchMedia('(max-width: 1023.9px)').matches
  ) {
    return () => {}
  }

  const root = scope && typeof scope.querySelectorAll === 'function' ? scope : document
  const triggers = Array.from(root.querySelectorAll('.thumb-swap-trigger'))

  if (!triggers.length) return () => {}

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const cleanups = []

  triggers.forEach((trigger) => {
    // Case studies use CSS hover-active toggles from the scroll animation.
    // GSAP thumb timelines here fight scroll transforms and defer navigation.
    if (trigger.closest('.case-studies')) return

    const picture = trigger.querySelector('.thumb-swap')
    if (!picture) return

    const primary = picture.querySelector('.thumb-primary')
    const secondary = picture.querySelector('.thumb-secondary')

    if (!primary || !secondary) return

    if (prefersReducedMotion) {
      const setHovered = (isHovered) => {
        picture.classList.toggle('hover-active', isHovered)
      }

      const onPointerEnter = () => setHovered(true)
      const onPointerLeave = () => setHovered(false)

      trigger.addEventListener('pointerenter', onPointerEnter)
      trigger.addEventListener('pointerleave', onPointerLeave)
      trigger.addEventListener('focusin', onPointerEnter)
      trigger.addEventListener('focusout', onPointerLeave)

      cleanups.push(() => {
        trigger.removeEventListener('pointerenter', onPointerEnter)
        trigger.removeEventListener('pointerleave', onPointerLeave)
        trigger.removeEventListener('focusin', onPointerEnter)
        trigger.removeEventListener('focusout', onPointerLeave)
        picture.classList.remove('hover-active')
      })

      return
    }

    gsap.set(primary, {
      yPercent: 0,
      autoAlpha: 1,
      clipPath: 'inset(0% 0% 0% 0%)',
      zIndex: 1,
      willChange: 'transform, clip-path',
    })
    gsap.set(secondary, {
      yPercent: 110,
      autoAlpha: 1,
      clipPath: 'inset(100% 0% 0% 0%)',
      zIndex: 2,
      willChange: 'transform, clip-path',
    })

    let allowImmediateClick = false
    const hoverTl = gsap.timeline({ paused: true, defaults: { duration: 0.5, ease: 'power2.in', overwrite: 'auto' } })

    hoverTl.to(
      primary,
      {
        yPercent: -100,
        clipPath: 'inset(0% 0% 100% 0%)',
      },
      0,
    )

    const hoverTl2 = gsap.timeline({ paused: true, defaults: { duration: 0.5, ease: 'power2.out', overwrite: 'auto' } })
    hoverTl2.to(
      secondary,
      {
        delay: 0.1,
        yPercent: 0,
        clipPath: 'inset(0% 0% 0% 0%)',
      },
      0,
    )

    const setHovered = (isHovered) => {
      if (isHovered) {
        trigger.classList.add('hover-active')
        picture.classList.add('hover-active')
        hoverTl.play()
        hoverTl2.play()
        return
      }

      trigger.classList.remove('hover-active')
      picture.classList.remove('hover-active')
      delete trigger.dataset.transitionHover
      delete picture.dataset.transitionHover
      hoverTl.reverse()
      hoverTl2.reverse()
    }

    const handleClick = (event) => {
      if (allowImmediateClick) {
        allowImmediateClick = false
        delete trigger.dataset.transitionHover
        delete picture.dataset.transitionHover
        return
      }

      const isHovering = trigger.matches(':hover')
        || trigger.classList.contains('hover-active')
      const hoverInProgress = isHovering
        && (hoverTl.progress() < 0.999 || hoverTl2.progress() < 0.999)
      if (!hoverInProgress) return

      event.preventDefault()
      event.stopPropagation()

      hoverTl.tweenTo(hoverTl.duration(), {
        delay: 0,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: true,
        onComplete: () => {
          // Ensure the enter-state has fully settled before click replay.
          if (hoverTl.progress() < 0.999 || hoverTl2.progress() < 0.999) return
          trigger.classList.add('hover-active')
          picture.classList.add('hover-active')
          trigger.dataset.transitionHover = 'true'
          picture.dataset.transitionHover = 'true'
          allowImmediateClick = true
          trigger.click()
        },
      })

      hoverTl2.tweenTo(hoverTl2.duration(), {
        delay: 0.1,
        duration: 0.5,
        ease: 'power2.in',
        overwrite: true,
      })
    }

    const onPointerEnter = () => setHovered(true)
    const onPointerLeave = () => setHovered(false)

    trigger.addEventListener('pointerenter', onPointerEnter)
    trigger.addEventListener('pointerleave', onPointerLeave)
    trigger.addEventListener('focusin', onPointerEnter)
    trigger.addEventListener('focusout', onPointerLeave)
    trigger.addEventListener('click', handleClick)

    cleanups.push(() => {
      trigger.removeEventListener('pointerenter', onPointerEnter)
      trigger.removeEventListener('pointerleave', onPointerLeave)
      trigger.removeEventListener('focusin', onPointerEnter)
      trigger.removeEventListener('focusout', onPointerLeave)
      trigger.removeEventListener('click', handleClick)
      hoverTl.kill()
      hoverTl2.kill()
      gsap.set([primary, secondary], { clearProps: 'willChange,clipPath,transform' })
      trigger.classList.remove('hover-active')
      picture.classList.remove('hover-active')
      delete trigger.dataset.transitionHover
      delete picture.dataset.transitionHover
    })
  })

  return () => {
    cleanups.forEach((cleanup) => cleanup())
  }
}
