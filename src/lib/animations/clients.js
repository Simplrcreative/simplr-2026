import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let pluginsRegistered = false

function registerPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger)
    pluginsRegistered = true
  }
}

function createLogoGroup() {
  const group = document.createElement('div')
  group.className = 'client-logo-group flex flex-nowrap items-center gap-[7rem] shrink-0'
  return group
}

function setupTickerTrack(logos) {
  const originalItems = Array.from(logos.children)
  const primaryGroup = createLogoGroup()

  originalItems.forEach((item) => {
    primaryGroup.appendChild(item)
  })

  const cloneGroup = primaryGroup.cloneNode(true)
  cloneGroup.setAttribute('aria-hidden', 'true')
  cloneGroup.querySelectorAll('.client-logo').forEach((logo) => {
    logo.setAttribute('aria-hidden', 'true')
  })

  logos.append(primaryGroup, cloneGroup)

  return {
    originalItems,
    primaryGroup,
    cloneGroup,
    cleanup() {
      originalItems.forEach((item) => {
        logos.appendChild(item)
      })
      primaryGroup.remove()
      cloneGroup.remove()
    },
  }
}

function getTickerBounds(logos, primaryGroup, cloneGroup) {
  if (!logos || !primaryGroup || !cloneGroup) {
    return { distance: 0, startX: 0, endX: 0 }
  }

  const distance = Math.max(0, cloneGroup.offsetLeft - primaryGroup.offsetLeft)
  const startsFromLeft = logos.classList.contains('logo-slider-2')

  return {
    distance,
    startX: startsFromLeft ? -distance : 0,
    endX: startsFromLeft ? 0 : -distance,
  }
}

function updateLogoTransforms(section, logoItems) {
  if (!section || !logoItems.length) return

  const sectionRect = section.getBoundingClientRect()
  const sectionCenter = sectionRect.left + sectionRect.width / 2
  const halfWidth = Math.max(sectionRect.width / 2, 1)

  logoItems.forEach((logo) => {
    const logoRect = logo.getBoundingClientRect()
    const logoCenter = logoRect.left + logoRect.width / 2
    const offset = Math.max(-1, Math.min(1, (logoCenter - sectionCenter) / halfWidth))
    const intensity = Math.abs(offset)
    const focus = Math.pow(Math.max(0, 0.85 - intensity), 1.85)

    gsap.set(logo, {
      //rotationY: offset * -26,
      //skewY: offset * -8,
      scale: 0.5 + focus * 0.5,
      z: (1 - intensity) * 36,
      opacity: focus,
    })
  })
}

export function createClientsScrollAnimation(scope) {
  if (!scope) return () => undefined

  registerPlugins()

  const media = gsap.matchMedia()

  media.add('(prefers-reduced-motion: no-preference)', () => {
    const sections = scope.matches?.('.clients')
      ? [scope]
      : Array.from(scope.querySelectorAll('.clients'))

    if (!sections.length) return undefined

    const cleanups = sections
      .map((section) => {
        const logos = section.querySelector('.client-logos')
        if (!logos || logos.dataset.tickerReady === 'true') return null

        const tickerTrack = setupTickerTrack(logos)
        const logoItems = Array.from(section.querySelectorAll('.client-logo'))

        if (!logoItems.length) {
          tickerTrack.cleanup()
          return null
        }

        logos.dataset.tickerReady = 'true'

        const applyTransforms = () => updateLogoTransforms(section, logoItems)
        const applyInitialState = () => {
          const { startX } = getTickerBounds(
            logos,
            tickerTrack.primaryGroup,
            tickerTrack.cloneGroup
          )

          gsap.set(section, { overflow: 'hidden', perspective: 1200 })
          gsap.set(logos, { x: startX })
          gsap.set(logoItems, {
            transformOrigin: '50% 50%',
            transformPerspective: 1200,
            force3D: true,
            willChange: 'transform, opacity',
          })
          applyTransforms()
        }

        applyInitialState()

        const tickerTween = gsap.to(logos, {
          x: () =>
            getTickerBounds(
              logos,
              tickerTrack.primaryGroup,
              tickerTrack.cloneGroup
            ).endX,
          duration: () => {
            const { distance } = getTickerBounds(
              logos,
              tickerTrack.primaryGroup,
              tickerTrack.cloneGroup
            )

            return Math.max(distance / 80, 14)
          },
          ease: 'none',
          repeat: -1,
          paused: false,
          repeatRefresh: true,
          immediateRender: false,
          onUpdate: applyTransforms
        })

        const handleRefreshInit = () => {
          tickerTween.pause(0)
          applyInitialState()
          tickerTween.invalidate()
          tickerTween.play()
        }

        ScrollTrigger.addEventListener('refreshInit', handleRefreshInit)

        return () => {
          ScrollTrigger.removeEventListener('refreshInit', handleRefreshInit)
          tickerTween?.kill()
          delete logos.dataset.tickerReady
          tickerTrack.cleanup()
          gsap.set([section, logos, ...Array.from(section.querySelectorAll('.client-logo'))], {
            clearProps: 'all',
          })
        }
      })
      .filter(Boolean)

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  })

  return () => media.revert()
}
