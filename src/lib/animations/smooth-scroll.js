import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

let lenisInstance
let scrollTriggerRegistered = false
let subscriberCount = 0
let tickerCallback
let visibilityListenerAdded = false
const activeScrollLocks = new Set()
const scrollLockOptions = new Map()
let nativeLockApplied = false
const originalScrollStyles = {
  htmlOverflow: '',
  bodyOverflow: '',
  htmlTouchAction: '',
  bodyTouchAction: '',
}

function shouldPreventTouchForActiveLocks() {
  return [...activeScrollLocks].some((lockId) => {
    const options = scrollLockOptions.get(lockId)
    return options?.preventTouch !== false
  })
}

function applyNativeScrollLock() {
  if (activeScrollLocks.size === 0) return

  if (!nativeLockApplied) {
    originalScrollStyles.htmlOverflow = document.documentElement.style.overflow
    originalScrollStyles.bodyOverflow = document.body.style.overflow
    originalScrollStyles.htmlTouchAction = document.documentElement.style.touchAction
    originalScrollStyles.bodyTouchAction = document.body.style.touchAction
    nativeLockApplied = true
  }

  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'

  if (shouldPreventTouchForActiveLocks()) {
    document.documentElement.style.touchAction = 'none'
    document.body.style.touchAction = 'none'
  } else {
    document.documentElement.style.touchAction = originalScrollStyles.htmlTouchAction
    document.body.style.touchAction = originalScrollStyles.bodyTouchAction
  }
}

function releaseNativeScrollLock() {
  if (activeScrollLocks.size > 0) return

  document.documentElement.style.overflow = originalScrollStyles.htmlOverflow
  document.body.style.overflow = originalScrollStyles.bodyOverflow
  document.documentElement.style.touchAction = originalScrollStyles.htmlTouchAction
  document.body.style.touchAction = originalScrollStyles.bodyTouchAction
  nativeLockApplied = false
}

function syncLenisLockState() {
  if (!lenisInstance) return

  if (activeScrollLocks.size > 0) {
    lenisInstance.stop()
    return
  }

  lenisInstance.start()
}

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
    stopInertiaOnNavigate: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1,
  })

  lenisInstance.on('scroll', ScrollTrigger.update)

  tickerCallback = (time) => {
    lenisInstance?.raf(time * 1000)
  }

  gsap.ticker.add(tickerCallback)

  if (!visibilityListenerAdded && typeof document !== 'undefined') {
    visibilityListenerAdded = true
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || !lenisInstance) return
      gsap.ticker.wake()
      lenisInstance.resize()
      ScrollTrigger.refresh()
    })
  }

  requestAnimationFrame(() => {
    lenisInstance?.resize()
  })

  syncLenisLockState()

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

export function lenisScrollTo(target, options = {}) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, options)
    return
  }
  // Fallback when Lenis is not active (e.g. during page transitions)
  const top = typeof target === 'number'
    ? target
    : target instanceof Element
      ? target.getBoundingClientRect().top + window.scrollY
      : 0
  window.scrollTo({ top, behavior: 'smooth' })
}

export function scrollToTopImmediate() {
  if (lenisInstance) {
    lenisInstance.stop()
    lenisInstance.scrollTo(0, { immediate: true, force: true })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    window.scrollTo(0, 0)
    syncLenisLockState()
    ScrollTrigger.update()
    return
  }

  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
  window.scrollTo(0, 0)
}

export function lockScroll(lockId = 'global', options = {}) {
  activeScrollLocks.add(lockId)
  scrollLockOptions.set(lockId, options)
  applyNativeScrollLock()
  syncLenisLockState()
}

export function unlockScroll(lockId = 'global') {
  activeScrollLocks.delete(lockId)
  scrollLockOptions.delete(lockId)

  if (activeScrollLocks.size > 0) {
    applyNativeScrollLock()
  } else {
    releaseNativeScrollLock()
  }

  syncLenisLockState()
}