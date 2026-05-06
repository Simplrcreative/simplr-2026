import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function createPeopleScatterAnimation(section, scatter) {
  if (!section || !scatter) return () => undefined

  const anim = gsap.fromTo(
    scatter,
    { y: 500, opacity: 0.2 },
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

  const bullet1 = section.querySelector('#bullet-item-1')
  const bullet2 = section.querySelector('#bullet-item-2')
  const bullet3 = section.querySelector('#bullet-item-3')

  if (!bullet1 || !bullet2 || !bullet3) return () => undefined

  const dot1 = bullet1.querySelector('.bullet-dot')
  const dot2 = bullet2.querySelector('.bullet-dot')
  const dot3 = bullet3.querySelector('.bullet-dot')

  const heading1 = bullet1.querySelector('.bullet-heading')
  const text1    = bullet1.querySelector('.bullet-text')
  const heading2 = bullet2.querySelector('.bullet-heading')
  const text2    = bullet2.querySelector('.bullet-text')
  const heading3 = bullet3.querySelector('.bullet-heading')
  const text3    = bullet3.querySelector('.bullet-text')

  const r1 = dot1.getBoundingClientRect()
  const r2 = dot2.getBoundingClientRect()
  const r3 = dot3.getBoundingClientRect()
  const x2 = r1.left - r2.left
  const x3 = r2.left - r3.left

  gsap.set([bullet2, bullet3], { autoAlpha: 0 })
  gsap.set([heading1, text1, heading2, text2, heading3, text3], { autoAlpha: 0, x: -50 })
  gsap.set(dot1, { scale: 1, y: 0, x: -200, opacity: 0,transformOrigin: 'top left' })
  gsap.set(dot2, { x: x2, scale: 0.85, transformOrigin: 'center center' })
  gsap.set(dot3, { x: x3, scale: 0.85, transformOrigin: 'center center' })

  const dot1ST = gsap.to(dot1, {
    scale: 1, 
    x: 0, 
    y: 0,
    opacity: 1,
    ease: 'none',   
    scrollTrigger: {
      trigger: section,
      start: 'top 70%',
      end: 'top 55%',
      scrub: 1,
      //markers: true,
    },
  })

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top 53%',
      end: 'top 30%',
      //end: '+=250%',
      //pin: true,
      //pinSpacing: true,
      scrub: 2,
      //markers: true,
    }
  })

  tl.to(heading1, { autoAlpha: 1, x: 0, duration: 5 }, '+=0')
  tl.to(text1,    { autoAlpha: 1, x: 0, duration: 5 }, '+=0')
  tl.to({},       { duration: 5 })

  tl.to(bullet2,  { autoAlpha: 1, duration: 0.01  })
  tl.to(dot2,     { x: 0, scale: 1, duration: 20, }, '+=0')
  tl.to(heading2, { autoAlpha: 1, x: 0, duration: 5 }, '+=0')
  tl.to(text2,    { autoAlpha: 1, x: 0, duration: 5 }, '+=0')
  tl.to({},       { duration: 5 }, '+=0')

  tl.to(bullet3,  { autoAlpha: 1, duration: 0.01 })
  tl.to(dot3,     { x: 0, scale: 1, duration: 20 }, '+=0')
  tl.to(heading3, { autoAlpha: 1, x: 0, duration: 5 }, '+=0')
  tl.to(text3,    { autoAlpha: 1, x: 0, duration: 5 }, '+=0')
  //tl.to({},       { duration: 1 }, '+=1')

  const allEls = [
    bullet1, bullet2, bullet3,
    dot1, dot2, dot3,
    heading1, text1, heading2, text2, heading3, text3,
  ]

  return () => {
    dot1ST.scrollTrigger?.kill()
    dot1ST.kill()
    tl.scrollTrigger?.kill()
    tl.kill()
    gsap.set(allEls, { clearProps: 'all' })
  }
}
