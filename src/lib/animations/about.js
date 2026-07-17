import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function createPeopleScatterAnimation(section, scatter) {
  if (!section || !scatter) return () => undefined

  const isDesktop = window.matchMedia('(min-width: 1024px)').matches

  let yScroll = 50
  if(isDesktop) {
    yScroll = 150
  }

  const anim = gsap.fromTo(
    scatter,
    { y: yScroll, opacity: 0.2 },
    {
      y: 0,
      opacity: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top 60%',
        end: 'top 10%',
        scrub: true,
      },
    },
  )

  return () => {
    anim.scrollTrigger?.kill()
    anim.kill()
    gsap.set(scatter, { clearProps: 'all' })
  }
}

export function createPeopleSectionClear(section, onClear) {
  if (!section) return () => undefined

  const trigger = ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onLeave: onClear,
    onLeaveBack: onClear,
  })

  return () => trigger.kill()
}

export function createBulletsAnimation(section) {
  if (!section) return () => undefined

  // Tablet up only — mobile gets the pinned stacking version instead.
  if (!window.matchMedia('(min-width: 768px)').matches) return () => undefined

  const bullets = Array.from(section.querySelectorAll('.bullet-item'))
  if (!bullets.length) return () => undefined

  const bodyNodes = bullets
    .map((bullet) => bullet.querySelector('.bullet-body'))
    .filter(Boolean)

  if (!bodyNodes.length) return () => undefined

  gsap.set(bodyNodes, { autoAlpha: 0, x: -50 })

  const tl = gsap.timeline({
    defaults: { ease: 'power4.out' },
    scrollTrigger: {
      trigger: section,
      start: 'top 95%',
    },
  })

  tl.to(bodyNodes, {
    autoAlpha: 1,
    x: 0,
    duration: 1,
    stagger: 0.12,
  })

  return () => {
    tl.scrollTrigger?.kill()
    tl.kill()
    gsap.set(bodyNodes, { clearProps: 'all' })
  }
}

/**
 * Mobile-only (<768px) companion to createBulletsAnimation.
 * Bullet 1 scrolls naturally with the lead via inner parallax only.
 * Bullets 2+ shoot in during pin with uniform duration and spacing.
 */
export function createBulletsStackAnimation(section) {
  if (!section) return () => undefined

  // Mobile only — tablet up uses the fade-in version instead.
  if (window.matchMedia('(min-width: 768px)').matches) return () => undefined

  const stage = section.querySelector('.bullets-grid')
  const inner = section.querySelector('.bullets-grid-inner')
  const items = Array.from(section.querySelectorAll('.bullet-item'))
  if (!stage || !inner || items.length < 2) return () => undefined

  section.classList.add('bullets--stack')

  const BULLET_PIN_START = 0.1
  const BULLET_DURATION = 0.32
  const BULLET_DELAY = 0.2
  const scrollUnit = () => window.innerHeight * 0.85

  const lead = inner.querySelector('.lead')
  const leadStyles = lead ? getComputedStyle(lead) : null
  const leadHeight = (lead?.offsetHeight || 0)
    + (leadStyles ? parseFloat(leadStyles.marginBottom) || 0 : 0)

  const stackItems = items.slice(1)
  const itemHeights = items.map((item) => item.offsetHeight)
  const peeks = items.map((item) => {
    const heading = item.querySelector('.bullet-heading')
    const body = item.querySelector('.bullet-body')
    const paddingTop = body ? parseFloat(getComputedStyle(body).paddingTop) || 0 : 0
    return (heading?.offsetHeight || 0) + paddingTop * 1
  })

  const landingY = [0]
  for (let i = 1; i < items.length; i += 1) {
    landingY.push(landingY[i - 1] + peeks[i - 1])
  }

  const stackHeight = landingY[items.length - 1] + itemHeights[items.length - 1]
  const stageHeight = Math.max(window.innerHeight, itemHeights[0], stackHeight)
  const approachOffset = window.innerHeight * 0.08
  const parallaxTravel = window.innerHeight * 0.08
  const offScreenY = stageHeight + 100

  gsap.set(stage, {
    position: 'relative',
    height: stageHeight,
    minHeight: window.innerHeight,
    overflow: 'hidden',
  })
  gsap.set(inner, {
    position: 'relative',
    width: '100%',
    y: approachOffset,
  })
  gsap.set(items[0], { clearProps: 'position,top,left,right,width,transform,zIndex' })
  gsap.set(stackItems, { position: 'absolute', top: 0, left: 0, right: 0, width: '100%' })
  stackItems.forEach((item, index) => {
    gsap.set(item, { y: offScreenY, zIndex: index + 1 })
  })

  const approachTl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: 'top top',
      scrub: true,
      invalidateOnRefresh: true,
    },
  })

  // Lead + bullet 1 scroll in together — no separate motion on bullet 1.
  approachTl.to(inner, { y: 0, ease: 'none', duration: 1 }, 0)

  const pinDuration = stackItems.length
    ? BULLET_PIN_START + stackItems.length * BULLET_DURATION + (stackItems.length - 1) * BULLET_DELAY
    : 1

  const stackTl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${pinDuration * scrollUnit()}`,
      pin: true,
      pinSpacing: true,
      scrub: true,
      invalidateOnRefresh: true,
      anticipatePin: 0,
    },
  })

  stackTl.fromTo(inner, { y: 0 }, { y: -parallaxTravel, ease: 'none', duration: pinDuration }, 0)

  stackItems.forEach((item, index) => {
    const start = BULLET_PIN_START + index * (BULLET_DURATION + BULLET_DELAY)
    stackTl.fromTo(
      item,
      { y: offScreenY },
      { y: landingY[index + 1], ease: 'power2.out', duration: BULLET_DURATION },
      start,
    )
  })

  return () => {
    approachTl.scrollTrigger?.kill()
    approachTl.kill()
    stackTl.scrollTrigger?.kill()
    stackTl.kill()
    section.classList.remove('bullets--stack')
    gsap.set(stackItems, { clearProps: 'all' })
    gsap.set(items[0], { clearProps: 'position,top,left,right,width,transform,zIndex' })
    gsap.set(inner, { clearProps: 'all' })
    gsap.set(stage, { clearProps: 'position,height,minHeight,overflow' })
  }
}

// Ease-in-out-back: smoothly accelerates then decelerates (no dead zone at
// either end, unlike a plain ease-out) with a gentle overshoot right at
// arrival — the fluid, spring/liquid "dock" bounce used throughout the
// how-we-work motion. `BOUNCE` controls how pronounced that overshoot is;
// 0 = a plain, no-bounce ease-in-out.
const BOUNCE = 0.5
function easeInOutBack(x) {
  const c1 = BOUNCE
  const c2 = c1 * 1.525
  return x < 0.5
    ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
    : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2
}

/**
 * Chain of media-circle + content-pill pairs, scrubbed by scroll.
 * Each pair sits in a horizontal track: the active pair's circle is docked at
 * the stage's left edge with its pill expanded to the right. Advancing to the
 * next pair contracts the current pill (which "pushes" its circle offscreen)
 * while the next circle slides in and its own pill grows out to dock —
 * a single eased(u) value drives both the contraction/expansion and the
 * track's translate so the push and the slide are perfectly in sync.
 */
export function createHowWeWorkAnimation(section) {
  if (!section) return () => undefined

  const stage = section.querySelector('.how-we-work-stage')
  const track = section.querySelector('.how-we-work-track')
  const medias = Array.from(section.querySelectorAll('.how-we-work-item-media'))
  const contents = Array.from(section.querySelectorAll('.how-we-work-item-content'))

  if (!stage || !track || !medias.length || !contents.length) {
    return () => undefined
  }

  const count = medias.length
  const mediaInners = medias.map((item) => item.querySelector('.how-we-work-media-inner') || item)
  const contentTexts = contents.map((item) => item.querySelector('.how-we-work-content') || item)

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

  // Short pause once a pair has fully docked before the next transition begins.
  const HOLD = 0.05
  const CIRCLE_VH = 0.75
  const PILL_ACTIVE_VW = 1.3
  const PILL_CONTRACT_VW = 0.05
  const PARALLAX_STRENGTH = 0.35
  const TEXT_REVEAL_AT = 0.6
  const TEXT_HIDE_AT = 0.3
  // Group 0 starts this many viewport-widths off to the right; index -1 is a
  // virtual "offscreen" slot that slides straight into group 0's rest spot
  // using the exact same chain-translate math as every other transition —
  // no separate entrance system, so nothing can drift out of sync with it.
  const ENTRANCE_DISTANCE_VW = 1

  let circleSize = 0
  let pillActive = 0
  let pillContracted = 0

  const measure = () => {
    circleSize = window.innerHeight * CIRCLE_VH
    pillActive = window.innerWidth * PILL_ACTIVE_VW
    pillContracted = window.innerWidth * PILL_CONTRACT_VW

    stage.style.height = `${circleSize}px`
    medias.forEach((media) => {
      media.style.width = `${circleSize}px`
      media.style.height = `${circleSize}px`
    })
    contents.forEach((content) => {
      content.style.height = `${circleSize}px`
    })
  }

  function render(progress) {
    const safeProgress = clamp(progress, -1, count - 1)
    const rawIndex = Math.min(Math.floor(safeProgress), count - 1)
    const rawPhase = clamp(safeProgress - rawIndex, 0, 1)
    const isEntrance = rawIndex < 0
    const nextIndex = rawIndex + 1
    const hasNext = Boolean(medias[nextIndex])

    const u = rawPhase <= HOLD ? 0 : (rawPhase - HOLD) / (1 - HOLD)
    const eased = easeInOutBack(u)

    // Outgoing pill contracts toward ~90vw; incoming pill grows from ~90vw to
    // ~160vw. Both use the same eased value so the "push" and the dock are
    // one continuous motion, with easeInOutBack's overshoot giving the squish
    // and the landing a subtle liquid bounce. Nothing squishes during the
    // entrance — group 0 just slides in at its resting width.
    const pillWidths = contents.map((_, index) => {
      if (!isEntrance && hasNext && index === rawIndex) {
        return Math.max(pillActive - (pillActive - pillContracted) * eased, circleSize)
      }
      if (!isEntrance && hasNext && index === nextIndex) {
        return Math.max(pillContracted + (pillActive - pillContracted) * eased, circleSize)
      }
      return pillActive
    })

    const offsets = []
    let runningX = 0
    medias.forEach((_, index) => {
      offsets[index] = runningX
      runningX += circleSize + pillWidths[index]
    })

    const currentStopX = isEntrance ? window.innerWidth * ENTRANCE_DISTANCE_VW : -offsets[rawIndex]
    const nextStopX = hasNext ? -offsets[nextIndex] : currentStopX
    const chainX = currentStopX + (nextStopX - currentStopX) * eased

    track.style.transform = `translate3d(${chainX}px, 0, 0)`

    const displayProgress = rawIndex + clamp(eased, -0.25, 1.25)

    medias.forEach((media, index) => {
      const x = offsets[index]
      media.style.transform = `translate3d(${x}px, 0, 0)`

      const content = contents[index]
      if (content) {
        content.style.width = `${pillWidths[index]}px`
        content.style.transform = `translate3d(${x + circleSize}px, 0, 0)`
      }

      const inner = mediaInners[index]
      if (inner) {
        const localProgress = clamp(displayProgress - index, -1, 1)
        const parallax = localProgress * circleSize * PARALLAX_STRENGTH
        inner.style.transform = `translate3d(${parallax}px, 0, 0)`
      }
    })

    contentTexts.forEach((textEl, index) => {
      const isOutgoing = !isEntrance && index === rawIndex
      const isIncoming = hasNext && index === nextIndex

      let visible = false
      if (isIncoming) visible = u > TEXT_REVEAL_AT
      else if (isOutgoing) visible = u <= TEXT_HIDE_AT

      // Groups at or behind the active one have already been shown — when
      // hidden, they should exit left (matching their circle/pill), not
      // reset back to the default "waiting to enter from the right" state.
      const isPast = !isEntrance && index <= rawIndex

      textEl.classList.toggle('is-visible', visible)
      textEl.classList.toggle('is-past', isPast)
    })
  }

  gsap.set(track, { position: 'absolute', top: 0, left: 0, willChange: 'transform' })
  gsap.set(medias, { position: 'absolute', top: 0, left: 0, willChange: 'transform, width, height' })
  gsap.set(contents, { position: 'absolute', top: 0, left: 0, willChange: 'transform, width' })

  measure()
  render(-1)

  // Total scrubbed range is [-1, count - 1]: unit -1..0 is the entrance,
  // each further unit is one push/dock transition — so `units` below covers
  // all of it with one consistent per-unit scroll distance.
  const units = count
  const getViewportWidth = () => window.innerWidth
  const totalDistancePx = () => units * getViewportWidth() * 1.5

  // Pin once the section fills the viewport — since it's min-h-screen and
  // flex-centered, this is the only point where its centered content lines
  // up with the viewport's vertical center. Starting the pin any earlier
  // freezes the section box before it's fully in frame, which crops the
  // (still vertically centered) stage against the top of the viewport.
  const trigger = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => `+=${totalDistancePx()}`,
    pin: true,
    scrub: true,
    invalidateOnRefresh: true,
    anticipatePin: 1,
    onUpdate: (self) => render(-1 + self.progress * units),
    onRefresh: (self) => {
      measure()
      render(-1 + self.progress * units)
    },
  })

  let resizeTimer
  const onResize = () => {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      measure()
      trigger.refresh()
    }, 150)
  }
  window.addEventListener('resize', onResize)

  return () => {
    window.removeEventListener('resize', onResize)
    window.clearTimeout(resizeTimer)
    trigger.kill()
    contentTexts.forEach((textEl) => textEl.classList.remove('is-visible', 'is-past'))
    gsap.set([track, ...medias, ...contents, ...mediaInners], {
      clearProps: 'transform,width,height,position,top,left,willChange',
    })
    gsap.set(stage, { clearProps: 'height' })
  }
}

export function createBioAnimation(scatter, overlay, close, isOpen, onCloseComplete) {
  if (!scatter || !overlay) return () => undefined

  const bioContent = overlay.querySelector('.bio-content')
  const isDesktop = window.matchMedia('(min-width: 768px)').matches
  const scatterX = isDesktop ? '-60%' : '-101%'

  if (isOpen) {
    const tl = gsap.timeline()

    tl.to(scatter, { x: scatterX, opacity: 0.75, duration: 0.5, ease: 'power4.out' }, 0)

    if (isDesktop) {
      tl.fromTo(
        overlay,
        { opacity: 0, x: 500 },
        { opacity: 1, x: 0, duration: 0.75, ease: 'power4.out', pointerEvents: 'auto' },
        0.35,
      )
    } else {
      tl.fromTo(
        overlay,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: 'power4.out', pointerEvents: 'auto' },
        0.25,
      )
      if (bioContent) {
        tl.fromTo(bioContent, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power4.out' }, 0.35)
      }
    }

    if (close) {
      tl.fromTo(
        close,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power1.out', pointerEvents: 'auto' },
        0.3,
      )
    }

    return () => tl.kill()
  }

  const tl = gsap.timeline({
    onComplete: () => onCloseComplete?.(),
  })

  if (close) {
    tl.to(close, { opacity: 0, duration: 0.25, ease: 'power1.in', pointerEvents: 'none' }, 0)
  }

  if (isDesktop) {
    tl.to(
      overlay,
      { opacity: 0, x: 500, duration: 0.75, ease: 'power4.in', pointerEvents: 'none' },
      close ? 0.1 : 0.25,
    )
  } else {
    tl.to(overlay, { opacity: 0, duration: 0.45, ease: 'power4.in', pointerEvents: 'none' }, 0)
    if (bioContent) {
      tl.to(bioContent, { opacity: 0, duration: 0.45, ease: 'power4.in' }, 0)
    }
  }

  tl.to(scatter, { x: '0%', opacity: 1, duration: 0.75, ease: 'power4.in' }, 0.4)

  return () => tl.kill()
}
