import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

let pluginsRegistered = false
const initializedElements = new Set()

function registerPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger, SplitText)
    pluginsRegistered = true
  }
}

export function refreshScrollTriggers() {
  registerPlugins()
  requestAnimationFrame(() => {
    // Only refresh if there are active ScrollTriggers
    if (ScrollTrigger.getAll().length > 0) {
      ScrollTrigger.refresh()
    }
  })
}

/**
 * Initialize SplitText animation for a single element.
 * Prevents double initialization via Set tracking.
 * Returns the created tween so the caller can clean it up.
 */
function initializeSplitTextForElement(element, triggerSelector, fromColor, toColor) {
  if (initializedElements.has(element)) {
    return null
  }

  const customTriggerSelector = element.dataset.splitTrigger
  const trigger = customTriggerSelector
    ? document.querySelector(customTriggerSelector)
    : element.closest(triggerSelector)

  if (!trigger) {
    return null
  }

  const split = SplitText.create(element, { type: 'words' })
  gsap.set(split.words, { color: fromColor })

  const tween = gsap.fromTo(
    split.words,
    { color: fromColor },
    {
      color: toColor,
      stagger: 0.1,
      scrollTrigger: {
        trigger,
        start: 'top 90%',
        end: 'top 50%',
        scrub: true,
        //markers: true,
        invalidateOnRefresh: true,
        refreshPriority: -10,
      },
    }
  )

  initializedElements.add(element)
  return { element, tween }
}

export function createSplitTextAnimation() {
  registerPlugins()

  const observers = []
  const splitTextInstances = []
  let mutationObserver = null
  let needsWhiteObserver = false
  let needsCoffeeObserver = false

  /**
   * Create Intersection Observer for lazy initialization of SplitText animations.
   * Animations only initialize when elements enter viewport, reducing main thread load.
   */
  function createLazySplitTextObserver(elementSelector, triggerSelector, fromColor, toColor) {
    const elements = Array.from(document.querySelectorAll(elementSelector))

    if (elements.length === 0) {
      return false
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const instance = initializeSplitTextForElement(entry.target, triggerSelector, fromColor, toColor)
            if (instance) splitTextInstances.push(instance)
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '100px' }
    )

    elements.forEach((el) => observer.observe(el))
    observers.push(observer)
    return true
  }

  function createLazyMountObserver() {
    if (mutationObserver) return

    mutationObserver = new MutationObserver(() => {
      if (needsWhiteObserver && document.querySelector('.split-text')) {
        needsWhiteObserver = !createLazySplitTextObserver(
          '.split-text',
          '.trigger-split-text',
          'rgba(255, 255, 255, 0.05)',
          'rgba(255, 255, 255, 1)'
        )
      }

      if (needsCoffeeObserver && document.querySelector('.split-text-coffee')) {
        needsCoffeeObserver = !createLazySplitTextObserver(
          '.split-text-coffee',
          '.trigger-split-text-coffee',
          'rgba(48, 15, 29, 0.05)',
          'rgba(48, 15, 29, 1)'
        )
      }

      if (!needsWhiteObserver && !needsCoffeeObserver) {
        mutationObserver?.disconnect()
        mutationObserver = null
      }
    })

    mutationObserver.observe(document.body, { childList: true, subtree: true })
  }

  needsWhiteObserver = !createLazySplitTextObserver(
    '.split-text',
    '.trigger-split-text',
    'rgba(255, 255, 255, 0.05)',
    'rgba(255, 255, 255, 1)'
  )

  needsCoffeeObserver = !createLazySplitTextObserver(
    '.split-text-coffee',
    '.trigger-split-text-coffee',
    'rgba(48, 15, 29, 0.05)',
    'rgba(48, 15, 29, 1)'
  )

  if (needsWhiteObserver || needsCoffeeObserver) {
    createLazyMountObserver()
  }

  return () => {
    observers.forEach((obs) => obs.disconnect())
    mutationObserver?.disconnect()
    splitTextInstances.forEach(({ element, tween }) => {
      tween.scrollTrigger?.kill()
      tween.kill()
      initializedElements.delete(element)
    })
  }
}

