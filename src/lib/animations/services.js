import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const SERVICES_PIN_TOP = 95
const SERVICES_ENTRY_START = 'top bottom'
const TITLE_TRIGGER_LEFT_OFFSET = 120
const INACTIVE_TITLE_OPACITY = 0.2
const ACTIVE_TITLE_OPACITY = 1

let pluginsRegistered = false

function registerPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger)
    pluginsRegistered = true
  }
}

function getHorizontalScrollDistance(section, titles) {
  if (!section || !titles) {
    return 0
  }

  return Math.max(0, titles.scrollWidth - section.clientWidth)
}

function parseStatValue(value) {
  const parsed = Number.parseFloat(value)

  if (!Number.isFinite(parsed)) {
    return 0
  }

  return parsed
}

function formatStatValue(value) {
  return Math.round(value).toString()
}

export function createServicesScrollAnimation(scope) {
  if (!scope) {
    return () => undefined
  }

  registerPlugins()

  const media = gsap.matchMedia()

  media.add('(prefers-reduced-motion: no-preference)', () => {
    const section = scope.matches?.('.services') ? scope : scope.querySelector('.services')
    const titles = section?.querySelector('.services-titles')
    const serviceTitles = Array.from(titles?.querySelectorAll('[data-stat], [data-color], [data-detail]') ?? [])
    const statNo = section?.querySelector('.stat-no')
    const statPlus = section?.querySelector('.stat-plus')
    const statDetail = section?.querySelector('.stat-detail')
    let entranceTween
    let scrubTimeline
    let activeStatTween
    let activeTitleKey = null

    if (!section || !titles) {
      return undefined
    }

    const statColorClasses = Array.from(
      new Set(
        serviceTitles
          .map((title) => title.dataset.color)
          .filter(Boolean),
      ),
    )

    const defaultStatDetailText = statDetail?.textContent ?? ''
    const defaultStatColorClass = serviceTitles[0]?.dataset.color || 'text-strategy'

    const setActiveTitleOpacity = (activeTitle = null) => {
      if (serviceTitles.length === 0) {
        return
      }

      for (const title of serviceTitles) {
        title.classList.toggle('active', title === activeTitle)
      }

      gsap.to(serviceTitles, {
        opacity: INACTIVE_TITLE_OPACITY,
        duration: 0.3
      })

      if (activeTitle) {
        gsap.to(activeTitle, {
          opacity: ACTIVE_TITLE_OPACITY,
          duration: 0.5
        })
      }
    }

    const animateStatNoTo = (targetValue) => {
      if (!statNo) {
        return
      }

      const counter = {
        value: parseStatValue(statNo.textContent),
      }

      activeStatTween?.kill()

      activeStatTween = gsap.to(counter, {
        value: targetValue,
        duration:1,
        ease: 'power4.out',
        onUpdate: () => {
          statNo.textContent = formatStatValue(counter.value)
        },
      })
    }

    const applyTitleStatState = (title) => {
      if (!title) {
        return
      }

      const nextColorClass = title.dataset.color
      const nextStatValue = parseStatValue(title.dataset.stat)
      const nextDetail = title.dataset.detail

      if (statNo && nextColorClass) {
        statNo.classList.remove(...statColorClasses)
        statNo.classList.add(nextColorClass)
      }

      if (statPlus && nextColorClass) {
        statPlus.classList.remove(...statColorClasses)
        statPlus.classList.add(nextColorClass)
      }

      animateStatNoTo(nextStatValue)

      if (statDetail) {
        statDetail.textContent = nextDetail || defaultStatDetailText
      }
    }

    const resetStatState = () => {
      activeTitleKey = null
      setActiveTitleOpacity()

      if (statNo) {
        statNo.textContent = '0'
        if (statColorClasses.length > 0) {
          statNo.classList.remove(...statColorClasses)
        }
        statNo.classList.add(defaultStatColorClass)
      }

      if (statPlus) {
        if (statColorClasses.length > 0) {
          statPlus.classList.remove(...statColorClasses)
        }
        statPlus.classList.add(defaultStatColorClass)
      }

      if (statDetail) {
        statDetail.textContent = defaultStatDetailText
      }
    }

    const getLeftReachedTitle = () => {
      let currentTitle = null
      let closestLeft = -Infinity

      for (const title of serviceTitles) {
        const bounds = title.getBoundingClientRect()

        if (bounds.left > TITLE_TRIGGER_LEFT_OFFSET) {
          continue
        }

        if (bounds.left > closestLeft) {
          closestLeft = bounds.left
          currentTitle = title
        }
      }

      return currentTitle
    }

    const syncActiveTitleState = () => {
      const currentTitle = getLeftReachedTitle()

      if (!currentTitle) {
        if (activeTitleKey !== null) {
          resetStatState()
        }
        return
      }

      const key = currentTitle.id || currentTitle.dataset.stat || currentTitle.textContent

      if (key === activeTitleKey) {
        return
      }

      activeTitleKey = key
      setActiveTitleOpacity(currentTitle)
      applyTitleStatState(currentTitle)
    }

    gsap.set(titles, {
      x: 0,
    })

    if (statNo) {
      gsap.set(statNo, {
        textContent: '0',
      })
    }

    gsap.set(section, {
      overflow: 'hidden',
    })

    setActiveTitleOpacity()

    entranceTween = gsap.to(titles, {
      x: 0,
      ease: 'none',
      immediateRender: false,
      scrollTrigger: {
        trigger: section,
        start: SERVICES_ENTRY_START,
        end: () => `top ${SERVICES_PIN_TOP}`,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: syncActiveTitleState,
        onRefresh: syncActiveTitleState,
        onLeaveBack: resetStatState,
      },
    })

    scrubTimeline = gsap.timeline({
      defaults: {
        ease: 'none',
      },
      scrollTrigger: {
        trigger: section,
        pin: true,
        start: () => `top ${SERVICES_PIN_TOP}`,
        end: () => `+=${getHorizontalScrollDistance(section, titles)}`,
        scrub: true,
        invalidateOnRefresh: true,
        refreshPriority: -1,
        anticipatePin: 0,
        onUpdate: syncActiveTitleState,
        onRefresh: syncActiveTitleState,
        onLeaveBack: resetStatState,
      },
    })

    scrubTimeline.to(titles, {
      x: () => -getHorizontalScrollDistance(section, titles),
      duration: 1,
      immediateRender: false,
    })

    gsap.set(titles, {
      x: '100vw',
    })

    return () => {
      entranceTween?.kill()
      scrubTimeline?.kill()
      activeStatTween?.kill()
      gsap.set([section, titles], { clearProps: 'all' })
    }
  })

  return () => media.revert()
}