import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

let lenisInstance
let scrollTriggerRegistered = false
let subscriberCount = 0
let tickerCallback

function registerScrollTrigger() {
  if (!scrollTriggerRegistered) {
    gsap.registerPlugin(ScrollTrigger)
    scrollTriggerRegistered = true
  }
}

function ensureLenis() {
  registerScrollTrigger()

  if (lenisInstance) {
    return lenisInstance
  }

  lenisInstance = new Lenis({
    autoRaf: false,
    duration: 1.05,
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 0.9,
    touchMultiplier: 1,
  })

  lenisInstance.on('scroll', ScrollTrigger.update)

  tickerCallback = (time) => {
    lenisInstance?.raf(time * 1000)
  }

  gsap.ticker.add(tickerCallback)
  gsap.ticker.lagSmoothing(0)

  requestAnimationFrame(() => {
    lenisInstance?.resize()
  })

  return lenisInstance
}

function destroyLenis() {
  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback)
    tickerCallback = undefined
  }

  lenisInstance?.destroy()
  lenisInstance = undefined
}

export function createSmoothScroll() {
  subscriberCount += 1
  ensureLenis()

  return () => {
    subscriberCount -= 1

    if (subscriberCount <= 0) {
      subscriberCount = 0
      destroyLenis()
    }
  }
}

export function refreshSmoothScroll() {
  if (!lenisInstance) {
    return
  }

  requestAnimationFrame(() => {
    lenisInstance?.resize()
    ScrollTrigger.refresh()
  })
}