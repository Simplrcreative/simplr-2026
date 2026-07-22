import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

let pluginsRegistered = false
const initializedElements = new WeakSet()

function registerPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger, SplitText)
    pluginsRegistered = true
  }
}

function isTransitionChrome(element) {
  return Boolean(
    element?.closest?.('[data-transition-snapshot], [data-frozen-clone]'),
  )
}

export function refreshScrollTriggers() {
  registerPlugins()
  requestAnimationFrame(() => {
    if (ScrollTrigger.getAll().length > 0) {
      ScrollTrigger.refresh()
    }
  })
}

/**
 * Initialize SplitText animation for a single element.
 * Prevents double initialization via WeakSet tracking.
 * Returns the created tween so the caller can clean it up.
 */
function initializeSplitTextForElement(element, triggerSelector, fromColor, toColor) {
  if (initializedElements.has(element)) {
    return null
  }

  // TransitionFrame clones leave mid-scrub word colors in the outgoing snapshot.
  // Re-running SplitText on those nodes flashes full text then resets — skip them.
  if (isTransitionChrome(element)) {
    return null
  }

  const customTriggerSelector = element.dataset.splitTrigger
  const trigger = customTriggerSelector
    ? document.querySelector(customTriggerSelector)
    : element.closest(triggerSelector)

  if (!trigger || isTransitionChrome(trigger)) {
    return null
  }

  const DESKTOP_START = 'top 75%'
  const DESKTOP_END = 'top 30%'
  const MOBILE_START = 'top 80%'
  const MOBILE_END = 'top 35%'
  const isDesktop = window.matchMedia('(min-width: 768px)').matches

  const start = element.dataset.splitStart || (isDesktop ? DESKTOP_START : MOBILE_START)
  const end = element.dataset.splitEnd || (isDesktop ? DESKTOP_END : MOBILE_END)

  const split = SplitText.create(element, { type: 'words' })
  gsap.set(split.words, { color: fromColor })

  const tween = gsap.fromTo(
    split.words,
    { color: fromColor },
    {
      color: toColor,
      stagger: 0.1,
      immediateRender: false,
      scrollTrigger: {
        trigger,
        start,
        end,
        scrub: true,
        //markers: true,
        invalidateOnRefresh: true,
        refreshPriority: -10,
        // If the block is already in/through range on init (route return),
        // snap words to the correct scrubbed color instead of staying near-invisible.
        onRefresh(self) {
          self.animation?.progress(self.progress)
        },
      },
    },
  )

  initializedElements.add(element)
  return { element, tween, split }
}

export function createSplitTextAnimation() {
  registerPlugins()

  const observers = []
  const splitTextInstances = []
  let mutationObserver = null
  let needsWhiteObserver = false
  let needsCoffeeObserver = false
  let disposed = false

  /**
   * Create Intersection Observer for lazy initialization of SplitText animations.
   * Animations only initialize when elements enter viewport, reducing main thread load.
   */
  function createLazySplitTextObserver(elementSelector, triggerSelector, fromColor, toColor) {
    const elements = Array.from(document.querySelectorAll(elementSelector))
      .filter((el) => !initializedElements.has(el) && !isTransitionChrome(el))

    if (elements.length === 0) {
      return false
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || disposed) return
          if (isTransitionChrome(entry.target)) {
            observer.unobserve(entry.target)
            return
          }
          const instance = initializeSplitTextForElement(
            entry.target,
            triggerSelector,
            fromColor,
            toColor,
          )
          if (instance) {
            splitTextInstances.push(instance)
            requestAnimationFrame(() => ScrollTrigger.refresh())
          }
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '100px' },
    )

    elements.forEach((el) => observer.observe(el))
    observers.push(observer)
    return true
  }

  function scanForSplitText() {
    if (disposed) return
    // Transition clones are ignored via isTransitionChrome; still skip while the
    // overlay is mutating the DOM so we don't work against the handoff.
    if (document.documentElement.classList.contains('page-transitioning')) return

    if (needsWhiteObserver) {
      needsWhiteObserver = !createLazySplitTextObserver(
        '.split-text',
        '.trigger-split-text',
        'rgba(255, 255, 255, 0.15)',
        'rgba(255, 255, 255, 1)',
      )
    }

    if (needsCoffeeObserver) {
      needsCoffeeObserver = !createLazySplitTextObserver(
        '.split-text-coffee',
        '.trigger-split-text-coffee',
        'rgba(48, 15, 29, 0.15)',
        'rgba(48, 15, 29, 1)',
      )
    }

    // Keep watching for late mounts (lazy ClientLogos quote, deferred content).
    // Only disconnect when disposed — pages often mount split targets after first paint.
    if (!needsWhiteObserver && !needsCoffeeObserver && mutationObserver) {
      // Re-arm flags if uninitialized targets still exist in the document.
      needsWhiteObserver = Array.from(document.querySelectorAll('.split-text'))
        .some((el) => !initializedElements.has(el) && !isTransitionChrome(el))
      needsCoffeeObserver = Array.from(document.querySelectorAll('.split-text-coffee'))
        .some((el) => !initializedElements.has(el) && !isTransitionChrome(el))

      if (!needsWhiteObserver && !needsCoffeeObserver) {
        mutationObserver.disconnect()
        mutationObserver = null
      }
    }
  }

  function onTransitionComplete() {
    if (disposed) return
    needsWhiteObserver = true
    needsCoffeeObserver = true
    scanForSplitText()
  }

  function createLazyMountObserver() {
    if (mutationObserver) return

    let rafId = null
    mutationObserver = new MutationObserver(() => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        // Always re-check — ClientLogos / deferred home content can mount late,
        // including on return visits when the lazy chunk is already cached.
        needsWhiteObserver = Array.from(document.querySelectorAll('.split-text'))
          .some((el) => !initializedElements.has(el) && !isTransitionChrome(el))
          || needsWhiteObserver
        needsCoffeeObserver = Array.from(document.querySelectorAll('.split-text-coffee'))
          .some((el) => !initializedElements.has(el) && !isTransitionChrome(el))
          || needsCoffeeObserver
        scanForSplitText()
      })
    })

    mutationObserver.observe(document.body, { childList: true, subtree: true })
  }

  needsWhiteObserver = true
  needsCoffeeObserver = true
  scanForSplitText()
  createLazyMountObserver()
  window.addEventListener('page-transition:complete', onTransitionComplete)

  return () => {
    disposed = true
    observers.forEach((obs) => obs.disconnect())
    mutationObserver?.disconnect()
    mutationObserver = null
    window.removeEventListener('page-transition:complete', onTransitionComplete)
    const isTransitioning = document.documentElement.classList.contains('page-transitioning')

    splitTextInstances.forEach(({ element, tween, split }) => {
      // Bake current mid-scrub colors before killing so GSAP revert cannot flash
      // full inherited text color on the live page under the overlay.
      split?.words?.forEach((word) => {
        word.style.color = getComputedStyle(word).color
      })

      // kill(revert=false, allowAnimation=true) — leave mid-scrub word colors
      // as they are; do not reset back to start values.
      tween.scrollTrigger?.kill(false, true)
      tween.kill()

      // Revert only when staying on the page. During route transitions the node
      // is unmounting; split.revert() unwraps words and briefly shows full text.
      if (!isTransitioning) {
        split?.revert?.()
      }

      initializedElements.delete(element)
    })
  }
}
