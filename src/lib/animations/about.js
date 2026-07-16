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
      scrub: 1,
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

export function createHowWeWorkAnimation(section) {
  if (!section) return () => undefined

  const stage = section.querySelector('.how-we-work-stage')
  const track = section.querySelector('.how-we-work-track')
  const medias = Array.from(section.querySelectorAll('.how-we-work-item-media'))
  const contents = Array.from(section.querySelectorAll('.how-we-work-item-content'))

  if (!stage || !track || !medias.length || !contents.length) {
    return () => undefined
  }

  const count = contents.length
  const getViewportWidth = () => window.innerWidth
  const mediaStack = section.querySelector('.how-we-work-media-stack')
  // Use layout width (not bounding box) so parent scale transforms during route
  // transitions don't shrink the measured settled position.
  const getMediaSize = () => mediaStack?.offsetWidth || getViewportWidth() * 0.5
  // Settled (screenshot 2): left edge flush with media right edge.
  // Crossover (screenshot 1): outgoing at -50vw, incoming at settled.
  // Fully out: left edge at -100vw.
  const settledX = () => getMediaSize()
  const crossoverX = () => getViewportWidth() * -0.56
  const exitX = () => getViewportWidth() * -1
  const entrantStartX = () => getViewportWidth() + getMediaSize()

  const PHASE_A = 1
  const PHASE_B = 0.5
  const transitionCount = Math.max(count - 1, 0)
  const mediaFade = Math.min(0.12, PHASE_A * 0.2)

  gsap.set(medias, { autoAlpha: 0 })
  gsap.set(medias[0], { autoAlpha: 1 })

  contents.forEach((content, index) => {
    gsap.set(content, {
      x: index === 0 ? settledX : entrantStartX,
      yPercent: -50,
    })
  })

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${Math.max(transitionCount, 1) * getViewportWidth() * 1.5}`,
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  })

  for (let index = 0; index < transitionCount; index += 1) {
    const current = contents[index]
    const next = contents[index + 1]
    const currentMedia = medias[index]
    const nextMedia = medias[index + 1]
    const phaseAStart = index * (PHASE_A + PHASE_B)

    // Phase A: current exits halfway, next enters halfway (screenshot 1).
    tl.to(current, { x: crossoverX, duration: PHASE_A }, phaseAStart)
    tl.fromTo(
      next,
      { x: entrantStartX, yPercent: -50 },
      { x: settledX, yPercent: -50, duration: PHASE_A },
      phaseAStart,
    )

    // Media swap only at the halfway crossover.
    tl.to(currentMedia, { autoAlpha: 0, duration: mediaFade }, phaseAStart + PHASE_A - mediaFade)
    tl.to(nextMedia, { autoAlpha: 1, duration: mediaFade }, phaseAStart + PHASE_A - mediaFade)

    // Phase B: hold next at settled position while current finishes exiting (screenshot 2).
    tl.to(current, { x: exitX, duration: PHASE_B }, phaseAStart + PHASE_A)
  }

  return () => {
    tl.scrollTrigger?.kill()
    tl.kill()
    gsap.set([...contents, ...medias], { clearProps: 'transform,opacity,visibility' })
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
