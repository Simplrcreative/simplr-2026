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

export function createEst2014HeroScrollAnimation(scope, { canPlay = () => true } = {}) {
  if (!scope) return () => undefined

  registerPlugins()

  const hero = scope.querySelector('.hero')
  if (!hero) return () => undefined

  gsap.set(hero, { y: 250, willChange: 'transform' })

  let hasPlayed = false
  let tween

  const playOnce = () => {
    if (hasPlayed || !tween || !canPlay()) return
    hasPlayed = true
    tween.restart()
  }

  tween = gsap.to(hero, {
    y: -500,
    duration: 2,
    ease: 'power4.out',
    paused: true,
    delay:1,
    scrollTrigger: {
      trigger: scope,
      start: 'top top+=1',
      end: '+=700',
      pin: true,
      invalidateOnRefresh: true,
      onRefresh: () => {
        if (!hasPlayed && tween) {
          tween.pause(0)
        }
      },
    },
  })

  const unbindUserScrollGate = bindUserScrollGate(playOnce)

  return () => {
    unbindUserScrollGate()
    tween.scrollTrigger?.kill()
    tween.kill()
    gsap.set(hero, { clearProps: 'transform' })
  }
}
