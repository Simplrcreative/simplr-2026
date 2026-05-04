import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

let pluginsRegistered = false

function registerPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger, SplitText)
    pluginsRegistered = true
  }
}

export function refreshScrollTriggers() {
  registerPlugins()
  requestAnimationFrame(() => ScrollTrigger.refresh())
}

function createScopedSplitTextAnimation({
  elementSelector,
  triggerSelector,
  fromColor,
  toColor,
}) {
  const elements = Array.from(document.querySelectorAll(elementSelector))

  elements.forEach((element) => {
    const customTriggerSelector = element.dataset.splitTrigger
    const trigger = customTriggerSelector
      ? document.querySelector(customTriggerSelector)
      : element.closest(triggerSelector)

    if (!trigger) {
      return
    }

    const split = SplitText.create(element, { type: 'words' })

    gsap.set(split.words, { color: fromColor })

    gsap.fromTo(split.words,
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
  })
}

export function createSplitTextAnimation() {
  registerPlugins()

  createScopedSplitTextAnimation({
    elementSelector: '.split-text',
    triggerSelector: '.trigger-split-text',
    fromColor: 'rgba(255, 255, 255, 0)',
    toColor: 'rgba(255, 255, 255, 1)',
  })

  createScopedSplitTextAnimation({
    elementSelector: '.split-text-coffee',
    triggerSelector: '.trigger-split-text-coffee',
    fromColor: 'rgba(48, 15, 29, 0)',
    toColor: 'rgba(48, 15, 29, 1)',
  })
}

