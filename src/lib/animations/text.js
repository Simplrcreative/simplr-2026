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
 * Prevents double initialization via WeakSet tracking.
 */
function initializeSplitTextForElement(element, triggerSelector, fromColor, toColor) {
  if (initializedElements.has(element)) {
    return
  }

  const customTriggerSelector = element.dataset.splitTrigger
  const trigger = customTriggerSelector
    ? document.querySelector(customTriggerSelector)
    : element.closest(triggerSelector)

  if (!trigger) {
    return
  }

  const split = SplitText.create(element, { type: 'words' })
  gsap.set(split.words, { color: fromColor })

  gsap.fromTo(
    split.words,
    { color: fromColor },
    {
      color: toColor,
      stagger: 0.1,
      scrollTrigger: {
        trigger,
        start: 'top 70%',
        end: 'bottom 60%',
        scrub: true,
        invalidateOnRefresh: true,
        refreshPriority: -10,
      },
    }
  )

  initializedElements.add(element)
}

/**
 * Create Intersection Observer for lazy initialization of SplitText animations.
 * Animations only initialize when elements enter viewport, reducing main thread load.
 */
function createLazySplitTextObserver(elementSelector, triggerSelector, fromColor, toColor) {
  const elements = Array.from(document.querySelectorAll(elementSelector))

  if (elements.length === 0) {
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          initializeSplitTextForElement(entry.target, triggerSelector, fromColor, toColor)
          observer.unobserve(entry.target)
        }
      })
    },
    { rootMargin: '100px' } // Start loading 100px before element enters viewport
  )

  elements.forEach((el) => observer.observe(el))
}

export function createSplitTextAnimation() {
  registerPlugins()

  createLazySplitTextObserver(
    '.split-text',
    '.trigger-split-text',
    'rgba(255, 255, 255, 0.1)',
    'rgba(255, 255, 255, 1)'
  )

  createLazySplitTextObserver(
    '.split-text-coffee',
    '.trigger-split-text-coffee',
    'rgba(48, 15, 29, 0.1)',
    'rgba(48, 15, 29, 1)'
  )
}

