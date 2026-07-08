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
      //end: 'top 25%',
      //end: '+=250%',
      //pin: true,
      //pinSpacing: true,
      //scrub: 2,
      //markers: true,
    }
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
