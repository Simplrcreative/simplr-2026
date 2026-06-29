import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const TRIGGER_RATIO = 0.44

export function createPeopleMobileScroll(section, {
  list,
  onActiveChange,
  onPortraitVisibilityChange,
  isDetailOpen = () => false,
} = {}) {
  if (!section || !list) {
    return () => undefined
  }

  const findActiveFromScroll = () => {
    if (isDetailOpen()) {
      return
    }

    const buttons = [...list.querySelectorAll('[data-person-index]')]
    if (!buttons.length) {
      onPortraitVisibilityChange?.(false)
      onActiveChange?.(null)
      return
    }

    const triggerY = window.innerHeight * TRIGGER_RATIO
    const firstRect = buttons[0].getBoundingClientRect()
    const lastRect = buttons[buttons.length - 1].getBoundingClientRect()
    const firstCenter = firstRect.top + firstRect.height * 0.5
    const lastCenter = lastRect.top + lastRect.height * 0.5
    const listIsCrossingTrigger = firstCenter <= triggerY && lastCenter >= triggerY

    onPortraitVisibilityChange?.(listIsCrossingTrigger)

    if (!listIsCrossingTrigger) {
      onActiveChange?.(null)
      return
    }

    let closestIndex = null
    let closestDistance = Number.POSITIVE_INFINITY

    buttons.forEach((button) => {
      const rect = button.getBoundingClientRect()
      const distance = Math.abs(rect.top + rect.height * 0.5 - triggerY)

      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = Number(button.dataset.personIndex)
      }
    })

    onActiveChange?.(closestIndex)
  }

  const trigger = ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    invalidateOnRefresh: true,
    onUpdate: findActiveFromScroll,
    onRefresh: findActiveFromScroll,
  })

  const onResize = () => findActiveFromScroll()
  window.addEventListener('resize', onResize)
  findActiveFromScroll()

  return () => {
    window.removeEventListener('resize', onResize)
    trigger.kill()
  }
}
