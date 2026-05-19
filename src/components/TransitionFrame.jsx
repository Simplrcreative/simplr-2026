import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { siteConfig } from '../config/site.js'
import { createSurfaceColorTransitions, createSlideUpAnimations } from '../lib/animations/index.js'

const PAGE_TRANSITION_COMPLETE_EVENT = 'page-transition:complete'
const PAGE_TRANSITION_CAPTURE_EVENT = 'page-transition:capture'
const COFFEE = '#300F1D'
const WHITE = '#FFFFFF'
const DARK_PATHS = new Set(['/about', '/contact', '/est-2014'])
const WORK_SINGLE_PATH_RE = /^\/work\/[^/]+\/?$/

function resolveBgFromPath(pathname) {
  return DARK_PATHS.has(pathname) ? 'dark' : 'light'
}

export default function TransitionFrame({ children }) {
  const layoutRef = useRef(null)
  const ref = useRef(null)
  const snapshotRef = useRef(null)
  const altTransitionRef = useRef(null)
  const headerSnapshotRef = useRef(null)
  const compactLogoSnapshotRef = useRef(null)
  const capturedPageBgRef = useRef(null)
  const capturedPathRef = useRef(null)
  const isFirstMount = useRef(true)
  // Separate ref so we can detect the first useEffect run independently of
  // useLayoutEffect (which runs before effects and would already have cleared isFirstMount).
  const isFirstEffectRun = useRef(true)
  const location = useLocation()
  const logo = layoutRef.current?.querySelector('.logo')
  const implrPaths = layoutRef.current?.querySelectorAll('#logo-implr g')

  function applyCompactLogoState() {
    gsap.set('.logo', {
      scale: 0.35,
      y: -10,
      transformOrigin: 'left top',
      willChange: 'transform',
    })
    gsap.set('#logo-implr g', {
      x: -20,
      filter: 'blur(10px)',
      autoAlpha: 0,
    })
    gsap.set('.tagline', {
      y: -213,
      x: 65,
      scale: 0.68,
      transformOrigin: 'left top',
      willChange: 'transform',
    })
  }

  function animateHomeLogoIn() {
    const timeline = gsap.timeline({
      defaults: {
        ease: 'power2.out',
      },
    })

    timeline.to('.logo', { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0)

    timeline.to('.tagline', { autoAlpha: 1, y: 0, x: 0, scale: 1, duration: 0.6, ease: 'power2.out' }, 0)

    timeline.to(
      '#logo-implr g',
      { x: 0, filter: 'blur(0px)', autoAlpha: 1, stagger: -0.1, duration: 0.4, ease: 'power2.out' },
      0.15,
    )
  }

  function extractSameOriginLink(target) {
    const link = target?.closest?.('a[href]')
    if (!link) return null
    const href = link.getAttribute('href')
    if (!href || href.startsWith('#') || link.hasAttribute('download') || link.target === '_blank') return null
    const url = new URL(link.href, window.location.href)
    if (url.origin !== window.location.origin) return null
    return { link, url }
  }

  function resolveAltTransitionSource(target, link) {
    const directImageTrigger = target?.closest?.('.alt-transition-img')
    if (directImageTrigger && directImageTrigger.closest('a[href]') === link) {
      return directImageTrigger
    }
    const textTrigger = target?.closest?.('.alt-transition-text')
    if (!textTrigger || textTrigger.closest('a[href]') !== link) return null
    const relatedSlug = textTrigger.closest('.client-name')?.dataset?.client
    if (!relatedSlug) return null
    return document.getElementById(relatedSlug)?.querySelector('.alt-transition-img') ?? null
  }

  // Capture the outgoing snapshot synchronously at the moment the user triggers
  // navigation — before React has any chance to re-render or batch state updates.
  // Using a click/popstate listener (rather than reacting to navState) avoids the
  // race condition where React 18 batches loading→idle in a single commit cycle
  // (e.g. instant/cached loaders), which caused the snapshot to be stale or missed.
  // The footer is appended to the clone so navigating from the footer area produces
  // a complete outgoing snapshot instead of a blank lower half.
  useEffect(() => {
    const capture = (target = null) => {
      if (!ref.current) return

      capturedPageBgRef.current = document.documentElement.dataset.pageBg || null
      capturedPathRef.current = window.location.pathname || null

      altTransitionRef.current = null
      if (target) {
        const nav = extractSameOriginLink(target)
        const altSource = nav ? resolveAltTransitionSource(target, nav.link) : null
        if (nav && altSource && WORK_SINGLE_PATH_RE.test(nav.url.pathname)) {
          const rect = altSource.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) {
            altTransitionRef.current = {
              pathname: nav.url.pathname,
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              borderRadius: getComputedStyle(altSource).borderRadius,
              clone: altSource.cloneNode(true),
            }
          }
        }
      }

      // --- Header clone ---
      const liveHeader = document.querySelector('.header')
      headerSnapshotRef.current = liveHeader?.cloneNode(true) ?? null
      if (headerSnapshotRef.current) {
        // Bake in the computed opacity/visibility of .logo-holder so CSS rules
        // tied to html.compact-logo-active don't hide it after the class changes.
        const liveLogoHolder = liveHeader?.querySelector('.logo-holder')
        const clonedLogoHolder = headerSnapshotRef.current.querySelector('.logo-holder')
        if (liveLogoHolder && clonedLogoHolder) {
          const cs = getComputedStyle(liveLogoHolder)
          clonedLogoHolder.style.opacity = cs.opacity
          clonedLogoHolder.style.visibility = cs.visibility
        }
      }

      // --- Compact-logo clone (only when it's the currently visible logo) ---
      const isCompactLogoActive = document.documentElement.classList.contains('compact-logo-active')
      const liveCompactLogo = isCompactLogoActive ? document.querySelector('.compact-logo') : null
      if (liveCompactLogo) {
        const rect = liveCompactLogo.getBoundingClientRect()
        const clonedCompact = liveCompactLogo.cloneNode(true)
        // Bake in position/dimensions so the clone renders identically when
        // detached from its Tailwind layout context.
        Object.assign(clonedCompact.style, {
          position: 'fixed',
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          opacity: '1',
          visibility: 'visible',
          pointerEvents: 'none',
          zIndex: '10000',
        })
        compactLogoSnapshotRef.current = clonedCompact
      } else {
        compactLogoSnapshotRef.current = null
      }

      const clone = ref.current.cloneNode(true)

      // Replace each cloned <video> with a canvas snapshot of the live frame
      // so the outgoing snapshot shows what was visible, not a blank element.
      const liveVideos = Array.from(ref.current.querySelectorAll('video'))
      const clonedVideos = Array.from(clone.querySelectorAll('video'))
      let capturedVisibleVideos = 0

      liveVideos.forEach((video, index) => {
        if (capturedVisibleVideos >= 2) return

        const rect = video.getBoundingClientRect()
        const isVisible = (
          rect.bottom > 0 &&
          rect.top < window.innerHeight &&
          rect.right > 0 &&
          rect.left < window.innerWidth
        )

        if (!isVisible) return
        capturedVisibleVideos += 1

        const clonedVideo = clonedVideos[index]
        if (!clonedVideo || video.readyState < 2) return
        try {
          const computed = getComputedStyle(video)
          const vw = video.videoWidth
          const vh = video.videoHeight
          const cw = Math.round(rect.width)
          const ch = Math.round(rect.height)
          if (!cw || !ch || !vw || !vh) return
          // Replicate object-fit: cover crop
          const scale = Math.max(cw / vw, ch / vh)
          const sw = cw / scale
          const sh = ch / scale
          const sx = (vw - sw) / 2
          const sy = (vh - sh) / 2
          const canvas = document.createElement('canvas')
          canvas.width = cw
          canvas.height = ch
          // Preserve CSS classes and GSAP inline styles (transforms, borderRadius, etc.)
          canvas.className = clonedVideo.className
          if (clonedVideo.style.cssText) canvas.style.cssText = clonedVideo.style.cssText
          // Enforce explicit pixel dimensions so the canvas doesn't rely on
          // aspect-ratio / object-fit CSS that only applies to replaced elements.
          const cssWidth = computed.width && computed.width !== 'auto' ? computed.width : `${cw}px`
          const cssHeight = computed.height && computed.height !== 'auto' ? computed.height : `${ch}px`
          canvas.style.width = cssWidth
          canvas.style.height = cssHeight
          canvas.style.display = 'block'
          if (!canvas.style.borderRadius) {
            canvas.style.borderRadius = getComputedStyle(video).borderRadius
          }
          canvas.getContext('2d').drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch)
          clonedVideo.replaceWith(canvas)
        } catch {
          // Cross-origin video — leave the cloned element (poster will show)
        }
      })

      const footerOffItems = Array.from(document.querySelectorAll('.footer-off')).filter(
        (node) => !ref.current.contains(node),
      )
      const footer = document.querySelector('footer')
      footerOffItems.forEach((item) => {
        clone.appendChild(item.cloneNode(true))
      })
      if (footer) clone.appendChild(footer.cloneNode(true))
      snapshotRef.current = clone
    }

    const canCaptureFromEventTarget = (target) => Boolean(extractSameOriginLink(target))

    const handlePointerDown = (e) => {
      // Only primary-button navigations; ignore modified clicks/new-tab gestures.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (!canCaptureFromEventTarget(e.target)) return
      capture(e.target)
    }

    const handleClick = (e) => {
      // Ignore modified clicks that open a new tab / window
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (!canCaptureFromEventTarget(e.target)) return
      capture(e.target)
    }

    document.addEventListener('pointerdown', handlePointerDown, { capture: true })
    document.addEventListener('click', handleClick, { capture: true })
    window.addEventListener(PAGE_TRANSITION_CAPTURE_EVENT, capture)
    window.addEventListener('popstate', capture)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, { capture: true })
      document.removeEventListener('click', handleClick, { capture: true })
      window.removeEventListener(PAGE_TRANSITION_CAPTURE_EVENT, capture)
      window.removeEventListener('popstate', capture)
    }
  }, [])

  // MAIN TRANSITION — synchronous before browser paint on every route change.
  useLayoutEffect(() => {
    const isFirst = isFirstMount.current
    if (isFirst) isFirstMount.current = false

    if (!siteConfig.transitions.enabled || isFirst) return

    const el = ref.current
    const snapshot = snapshotRef.current
    if (!el || !snapshot) return

    snapshotRef.current = null

    const altData = altTransitionRef.current
    altTransitionRef.current = null
    let altCloneEl = null

    // Child layout effects run before parent (React bottom-up order), so at
    // this point RootLayout has NOT yet updated dataset.pageBg — it still holds
    // the OUTGOING page's value. Use it to colour the overlay background.
    const outgoingPageBg = capturedPageBgRef.current
      || resolveBgFromPath(capturedPathRef.current || '')
      || document.documentElement.dataset.pageBg
    const bgColor = outgoingPageBg === 'dark' ? COFFEE : WHITE
    capturedPageBgRef.current = null
    capturedPathRef.current = null

    const scrollY = window.scrollY
    const snapshotHeight = snapshot.scrollHeight || snapshot.getBoundingClientRect().height || 0
    const minSnapshotTop = Math.min(0, window.innerHeight - snapshotHeight)
    const snapshotTop = Math.max(-scrollY, minSnapshotTop)

    // Two-layer overlay:
    //   wrapper  — full-screen, z-9999, overflow:hidden, solid background.
    //              NEVER scales, so the real header (z-5) is always fully
    //              covered. The solid bgColor fills any transparent gaps in
    //              the snapshot (e.g. the padding area that sits behind the
    //              fixed header on every page).
    //   content  — receives scale/blur/opacity animation. Contains the page
    //              snapshot AND a frozen header clone positioned at viewport-
    //              top (top:0 of content), so the outgoing nav/logo state is
    //              always visible and animates out together with the page.
    const wrapper = document.createElement('div')
    const content = document.createElement('div')

    Object.assign(wrapper.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: '9999',
      background: bgColor,
    })
    Object.assign(content.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      transformOrigin: '50% 50%',
    })
    Object.assign(snapshot.style, {
      position: 'absolute',
      top: `${snapshotTop}px`,
      left: '0',
      width: '100%',
      pointerEvents: 'none',
    })

    if (location.pathname === '/') {
      snapshot.querySelectorAll('.compact-logo').forEach((node) => {
        node.style.opacity = '0'
        node.style.visibility = 'hidden'
      })
    }

    content.appendChild(snapshot)
    wrapper.appendChild(content)
    document.body.appendChild(wrapper)

    // --- Alt transition clone (image expands to fullscreen → docks to .featured-image) ---
    if (altData && altData.pathname === location.pathname) {
      const { top, left, width, height, borderRadius, clone } = altData
      Object.assign(clone.style, {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
        borderRadius,
        overflow: 'hidden',
        zIndex: '10001',
        pointerEvents: 'none',
        margin: '0',
        padding: '0',
      })
      document.body.appendChild(clone)
      altCloneEl = clone
    }

    // --- Compact-logo clone (icon-only logo state) ---
    // Animate the compact-logo out when it was the active logo at capture time.
    const compactLogoClone = compactLogoSnapshotRef.current
    compactLogoSnapshotRef.current = null
    if (compactLogoClone) {
      // Use data-frozen-clone so html.page-transitioning .compact-logo:not([data-frozen-clone])
      // doesn't fire, while keeping the class so fill/mix-blend-mode CSS still applies.
      compactLogoClone.dataset.frozenClone = 'true'
      document.body.appendChild(compactLogoClone)
      gsap.to(compactLogoClone, {
        autoAlpha: 0,
        y: -20,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => compactLogoClone.remove(),
      })
    }

    // --- Outgoing header clone (Logo Device + nav) ---
    // Animate the outgoing header out using the frozen clone captured on pointerdown.
    // The clone is appended directly to <body> (fixed, above the overlay) so it
    // slides up independently of the wrapper's own scroll animation.
    const headerClone = headerSnapshotRef.current
    headerSnapshotRef.current = null
    if (headerClone) {
      // Remove 'header' class so html.page-transitioning .header { opacity:0 !important }
      // doesn't instantly kill the clone when we add the page-transitioning class below.
      headerClone.classList.remove('header')
      Object.assign(headerClone.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        zIndex: '10000',
        pointerEvents: 'none',
      })
      document.body.appendChild(headerClone)
      gsap.to(headerClone, {
        autoAlpha: 0,
        y: -30,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => headerClone.remove(),
      })
    }

    // Hide the real header via CSS class before the first paint. By the time
    // useLayoutEffect runs, React has already committed the incoming render so
    // .header contains the new logo. The overlay's solid bgColor covers the
    // header area so the instant hide is invisible. Class-based so it survives
    // RootLayout's gsap.set('.header', { clearProps:'all' }).
    document.documentElement.classList.add('page-transitioning')

    // Suppress scrollbar flash while content is translated off-screen.
    document.documentElement.style.overflowX = 'hidden'

    // Alt transitions keep the incoming page at its natural position (the clone
    // covers it). Standard transitions start the page below the viewport.
    if (altCloneEl) {
      gsap.set(el, { y: 0, scale: 1, autoAlpha: 1 })
    } else {
      gsap.set(el, { y: window.innerHeight * 1.5, scale: 0.9, autoAlpha: 1 })
    }

    const done = () => {
      // Remove transitioning class then immediately pin header to autoAlpha:0
      // via GSAP so the incoming header doesn't snap visible before fade-in.
      document.documentElement.classList.remove('page-transitioning')
      const realHeader = document.querySelector('.header')
      if (realHeader) gsap.set(realHeader, { autoAlpha: 0, y: -20 })
      
      const isHomePage = location.pathname === '/'

      applyCompactLogoState()
      gsap.set('.compact-logo', { clearProps: 'all' })

      if (isHomePage) {
        document.documentElement.classList.remove('compact-logo-active')
        animateHomeLogoIn()
      }

      wrapper.remove()
      document.documentElement.style.overflowX = ''

      // Apply the correct nav/logo colour theme for the INCOMING page before
      // fading the header in. dataset.pageBg has now been updated by
      // RootLayout's layout effect (parent runs after child).
      const incomingPageBg = document.documentElement.dataset.pageBg
      const nav = document.querySelector('nav.main')
      const logoHolder = document.querySelector('.logo-holder')
      if (incomingPageBg === 'dark') {
        nav?.classList.add('light')
        logoHolder?.classList.add('light')
      } else {
        nav?.classList.remove('light')
        logoHolder?.classList.remove('light')
      }

      // Recalculate all scroll-trigger positions now that the transition is
      // complete and elements are in their final layout positions.
      requestAnimationFrame(() => ScrollTrigger.refresh())
      window.dispatchEvent(new Event(PAGE_TRANSITION_COMPLETE_EVENT))

      // Slide the incoming header in from above. clearProps:'all' removes all
      // GSAP inline styles afterwards so CSS fully owns the element.
      if (realHeader) {
        gsap.to(realHeader, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'all' })
      }
    }

    const tl = gsap.timeline({ onComplete: done, onInterrupt: done })

    if (altCloneEl) {
      // --- Alt transition: thumbnail expands → fullscreen → docks to .featured-image ---
      const getDockRect = () => {
        for (const selector of ['.featured-image picture', '.featured-image .ratio', '.featured-image']) {
          const target = el.querySelector(selector)
          if (!target) continue
          const rect = target.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) return { target, rect }
        }
        return null
      }

      const crossfadeToTarget = (target) => {
        gsap.set(target, { autoAlpha: 1 })
        gsap.to(altCloneEl, {
          autoAlpha: 0,
          delay: 0.1,
          duration: 0.42,
          ease: 'power4.in',
          onComplete: () => { altCloneEl?.remove(); altCloneEl = null },
        })
      }

      const altCloneImg = altCloneEl.querySelector('img')
      const smoothEase = 'power3.inOut'
      const expandDuration = 0.75
      const pauseDuration = 0.15
      const dockDuration = 1.5
      const dockStart = expandDuration + pauseDuration
      const dock = getDockRect()

      // 1. Expand clone from thumbnail position to fullscreen
      tl.to(altCloneEl, {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        borderRadius: 0,
        duration: expandDuration,
        ease: smoothEase,
      }, 0)

      // 2. Brief hold at fullscreen before docking
      tl.to({}, { duration: pauseDuration }, expandDuration)

      if (dock) {
        // Image zooms in slightly during expand, then settles during dock
        if (altCloneImg) {
          tl.to(altCloneImg, {
            scale: 1.12,
            transformOrigin: '50% 50%',
            duration: expandDuration,
            ease: smoothEase,
          }, 0)
          tl.to(altCloneImg, {
            scale: 1,
            transformOrigin: '50% 50%',
            duration: dockDuration,
            ease: smoothEase,
          }, dockStart)
        }

        // 3. Dock clone from fullscreen into .featured-image position, then crossfade
        tl.to(altCloneEl, {
          top: dock.rect.top,
          left: dock.rect.left,
          width: dock.rect.width,
          height: dock.rect.height,
          borderRadius: getComputedStyle(dock.target).borderRadius || altData.borderRadius,
          duration: dockDuration,
          ease: smoothEase,
          onComplete: () => {
            // Re-read rect in case layout shifted during the animation
            const finalDock = getDockRect()
            if (finalDock) {
              gsap.set(altCloneEl, {
                top: finalDock.rect.top,
                left: finalDock.rect.left,
                width: finalDock.rect.width,
                height: finalDock.rect.height,
                borderRadius: getComputedStyle(finalDock.target).borderRadius || altData.borderRadius,
              })
              crossfadeToTarget(finalDock.target)
            } else {
              crossfadeToTarget(dock.target)
            }
          },
        }, dockStart)
      } else {
        // No dock target found — fade clone out gracefully
        tl.to(altCloneEl, { autoAlpha: 0, duration: 0.5, ease: 'power4.in' }, dockStart)
      }

      // 4. Fade the snapshot wrapper out as the clone finishes docking
      tl.to(wrapper, {
        autoAlpha: 0,
        duration: 0.3,
        ease: 'power4.out',
      }, dock ? dockStart + dockDuration - 0.12 : dockStart)

    } else {
      // --- Standard slide transition ---
      tl.to(content, { scale: 0.9, duration: 0.5, ease: 'power4.in', transformOrigin: '50% 50%' }, 0)
      tl.to(wrapper, { y: -window.innerHeight * 1.5, duration: 1, ease: 'power4.in' }, 0.1)
      tl.to(el, { y: 0, duration: 1, ease: 'power4.out' }, 0.5)
      tl.to(el, { scale: 1, duration: 0.75, ease: 'power4.out', clearProps: 'all' }, 1)
    }

    return () => {
      tl.kill()
      wrapper.remove()
      if (altCloneEl) {
        gsap.killTweensOf(altCloneEl)
        altCloneEl.remove()
        altCloneEl = null
      }
      document.documentElement.classList.remove('page-transitioning')
      document.documentElement.style.overflowX = ''
      const realHeader = document.querySelector('.header')
      if (realHeader) {
        gsap.killTweensOf(realHeader)
        gsap.set(realHeader, { clearProps: 'all' })
      }
    }
  }, [location.pathname])

  // Register per-route animation listeners BEFORE dispatching the event below.
  // React guarantees useEffects run in definition order, so these two are
  // registered before the "fire immediately" effect that follows.
  useEffect(() => {
    const handler = () => createSurfaceColorTransitions(ref.current)
    window.addEventListener(PAGE_TRANSITION_COMPLETE_EVENT, handler, { once: true })
    return () => window.removeEventListener(PAGE_TRANSITION_COMPLETE_EVENT, handler)
  }, [location.pathname])

  useEffect(() => {
    const handler = () => createSlideUpAnimations(ref.current)
    window.addEventListener(PAGE_TRANSITION_COMPLETE_EVENT, handler, { once: true })
    return () => window.removeEventListener(PAGE_TRANSITION_COMPLETE_EVENT, handler)
  }, [location.pathname])

  // For first page load and when transitions are disabled, dispatch the event
  // immediately so the listeners above still fire. Runs after them (effect order).
  useEffect(() => {
    const isFirst = isFirstEffectRun.current
    isFirstEffectRun.current = false

    if (!siteConfig.transitions.enabled || isFirst) {
      if (isFirst && location.pathname === '/') {
        applyCompactLogoState()
        // Skip animateHomeLogoIn() on first load — RootLayout handles the
        // initial home logo reveal after the intro overlay finishes.
      }
      window.dispatchEvent(new Event(PAGE_TRANSITION_COMPLETE_EVENT))
    }
  }, [location.pathname])

  return (
    <div key={location.pathname} ref={ref}>
      {children}
    </div>
  )
}