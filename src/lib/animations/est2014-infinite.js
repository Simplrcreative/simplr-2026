import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let pluginsRegistered = false

function registerPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger)
    pluginsRegistered = true
  }
}

const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '])

function bindUserScrollGate(onUserScroll) {
  const markScrolled = () => onUserScroll()

  const onKeyDown = (event) => {
    if (SCROLL_KEYS.has(event.key)) {
      onUserScroll()
    }
  }

  window.addEventListener('wheel', markScrolled, { passive: true })
  window.addEventListener('touchmove', markScrolled, { passive: true })
  window.addEventListener('keydown', onKeyDown)

  return () => {
    window.removeEventListener('wheel', markScrolled)
    window.removeEventListener('touchmove', markScrolled)
    window.removeEventListener('keydown', onKeyDown)
  }
}

export function createEst2014HeroScrollAnimation(scope, { canPlay = () => true, canvasLayer = null } = {}) {
  if (!scope) return () => undefined

  registerPlugins()

  const hero = scope.querySelector('.hero')
  if (!hero) return () => undefined

  //gsap.set(hero, { y: 250, willChange: 'transform' })
  if (canvasLayer) {
    gsap.set(canvasLayer, { opacity: 0, willChange: 'opacity' })
  }

  let hasPlayed = false
  let timeline

  const playOnce = () => {
    if (hasPlayed || !timeline || !canPlay()) return
    hasPlayed = true
    timeline.restart()
  }

  timeline = gsap.timeline({
    paused: true,
    delay: 1,
    scrollTrigger: {
      trigger: scope,
      start: 'top top+=1',
      end: '+=700',
      pin: true,
      invalidateOnRefresh: true,
      onRefresh: () => {
        if (!hasPlayed && timeline) {
          timeline.pause(0)
        }
      },
    },
  })

  timeline.to(hero, { y: '-80vh', duration: 1.5, ease: 'power4.out' }, 0)

  if (canvasLayer) {
    timeline.to(canvasLayer, { opacity: 1, duration: 2, ease: 'power4.out' }, 0)
  }

  const unbindUserScrollGate = bindUserScrollGate(playOnce)

  return () => {
    unbindUserScrollGate()
    timeline.scrollTrigger?.kill()
    timeline.kill()
    gsap.set(hero, { clearProps: 'transform' })
    if (canvasLayer) {
      gsap.set(canvasLayer, { clearProps: 'opacity,willChange' })
    }
  }
}
