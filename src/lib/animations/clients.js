import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let pluginsRegistered = false

/** Pixels per second — lower = slower. Independent of logo count. */
const MARQUEE_SPEED = 28
const MIN_TRACK_VIEWPORT_RATIO = 1.25

function registerPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger)
    pluginsRegistered = true
  }
}

function createLogoGroup() {
  const group = document.createElement('div')
  group.className = 'client-logo-group flex flex-nowrap items-center shrink-0'
  return group
}

function waitForImages(root) {
  const images = Array.from(root.querySelectorAll('img'))
  if (!images.length) return Promise.resolve()

  return Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve()
      return new Promise((resolve) => {
        const done = () => resolve()
        const timeout = window.setTimeout(done, 4000)
        const finish = () => {
          window.clearTimeout(timeout)
          done()
        }
        img.addEventListener('load', finish, { once: true })
        img.addEventListener('error', finish, { once: true })
      })
    }),
  )
}

function setupTickerTrack(logos) {
  const originalItems = Array.from(logos.children)
  const primaryGroup = createLogoGroup()

  originalItems.forEach((item) => {
    primaryGroup.appendChild(item)
  })

  logos.append(primaryGroup)

  // Duplicate until the track is wider than the viewport so the loop never gaps.
  const ensureCoverage = () => {
    const viewportWidth = sectionWidth(logos)
    let guard = 0
    while (primaryGroup.scrollWidth * logos.children.length < viewportWidth * MIN_TRACK_VIEWPORT_RATIO && guard < 8) {
      const cloneGroup = primaryGroup.cloneNode(true)
      cloneGroup.setAttribute('aria-hidden', 'true')
      cloneGroup.querySelectorAll('.client-logo').forEach((logo) => {
        logo.setAttribute('aria-hidden', 'true')
      })
      cloneGroup.querySelectorAll('img').forEach((img) => {
        img.setAttribute('alt', '')
      })
      logos.append(cloneGroup)
      guard += 1
    }

    // Always keep at least one clone for seamless wrapping.
    if (logos.children.length < 2) {
      const cloneGroup = primaryGroup.cloneNode(true)
      cloneGroup.setAttribute('aria-hidden', 'true')
      logos.append(cloneGroup)
    }
  }

  ensureCoverage()

  return {
    originalItems,
    primaryGroup,
    ensureCoverage,
    cleanup() {
      originalItems.forEach((item) => {
        logos.appendChild(item)
      })
      Array.from(logos.querySelectorAll('.client-logo-group')).forEach((group) => group.remove())
    },
  }
}

function sectionWidth(logos) {
  return logos.parentElement?.clientWidth || window.innerWidth || 1
}

function getTickerBounds(logos, primaryGroup) {
  if (!logos || !primaryGroup) {
    return { distance: 0, startX: 0, endX: 0 }
  }

  // Distance of one full set — clone sits immediately after primary in the flex row.
  const distance = Math.max(0, primaryGroup.offsetWidth)
  const startsFromLeft = logos.classList.contains('logo-slider-2')

  return {
    distance,
    startX: startsFromLeft ? -distance : 0,
    endX: startsFromLeft ? 0 : -distance,
  }
}

function createSectionTicker(section) {
  const logos = section.querySelector('.client-logos')
  if (!logos || logos.dataset.tickerReady === 'true') return null

  logos.dataset.tickerReady = 'true'

  let cancelled = false
  let tickerTween = null
  let tickerTrack = null
  let isIntersecting = false
  let lastDistance = 0

  const syncPlayback = () => {
    if (!tickerTween) return
    if (isIntersecting && !document.hidden) {
      tickerTween.play()
      return
    }
    tickerTween.pause()
  }

  const buildTween = () => {
    if (!tickerTrack) return

    tickerTrack.ensureCoverage()
    const { distance, startX, endX } = getTickerBounds(logos, tickerTrack.primaryGroup)
    if (distance < 1) return

    lastDistance = distance
    const duration = Math.max(distance / MARQUEE_SPEED, 20)

    tickerTween?.kill()
    gsap.set(section, { overflow: 'hidden' })
    gsap.set(logos, { x: startX, force3D: true })

    tickerTween = gsap.to(logos, {
      x: endX,
      duration,
      ease: 'none',
      repeat: -1,
      paused: true,
      immediateRender: false,
    })

    syncPlayback()
  }

  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      isIntersecting = Boolean(entry?.isIntersecting)
      syncPlayback()
    },
    { threshold: 0 },
  )

  visibilityObserver.observe(section)

  const onVisibilityChange = () => syncPlayback()
  document.addEventListener('visibilitychange', onVisibilityChange)

  const handleRefreshInit = () => {
    if (!tickerTrack || !tickerTween) return
    const { distance } = getTickerBounds(logos, tickerTrack.primaryGroup)
    // Only rebuild when the measured loop width actually changed (images/layout).
    if (Math.abs(distance - lastDistance) < 2) return
    buildTween()
  }

  ScrollTrigger.addEventListener('refreshInit', handleRefreshInit)

  const start = async () => {
    await waitForImages(logos)
    if (cancelled) return

    tickerTrack = setupTickerTrack(logos)
    // Second measure after layout with decoded images.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    if (cancelled) return

    buildTween()
  }

  start()

  return () => {
    cancelled = true
    visibilityObserver.disconnect()
    document.removeEventListener('visibilitychange', onVisibilityChange)
    ScrollTrigger.removeEventListener('refreshInit', handleRefreshInit)
    tickerTween?.kill()
    tickerTrack?.cleanup()
    delete logos.dataset.tickerReady
    gsap.set([section, logos], { clearProps: 'all' })
  }
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

    const cleanups = sections.map((section) => createSectionTicker(section)).filter(Boolean)

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  })

  return () => media.revert()
}
