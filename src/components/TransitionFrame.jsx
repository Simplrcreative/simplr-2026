import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { siteConfig } from '../config/site.js'
import { createSurfaceColorTransitions, createSlideUpAnimations, scrollToTopImmediate } from '../lib/animations/index.js'

const PAGE_TRANSITION_COMPLETE_EVENT = 'page-transition:complete'
const PAGE_TRANSITION_CAPTURE_EVENT = 'page-transition:capture'
const PAGE_TRANSITION_PREPARE_CAPTURE_EVENT = 'page-transition:prepare-capture'
const PAGE_TRANSITION_CAPTURE_COMPLETE_EVENT = 'page-transition:capture-complete'
const COFFEE = '#300F1D'
const WHITE = '#FFFFFF'
const DARK_PATHS = new Set(['/about', '/contact', '/est-2014'])
const WORK_SINGLE_PATH_RE = /^\/work\/[^/]+\/?$/
const SERVICE_SINGLE_PATH_RE = /^\/services\/[^/]+\/?$/
const ALT_DOCK_MAX_WAIT_MS = 1600
const ALT_DOCK_POLL_MS = 50

function resolveBgFromPath(pathname) {
  return DARK_PATHS.has(pathname) ? 'dark' : 'light'
}

function normalizePathname(pathname) {
  if (!pathname) return '/'
  const path = pathname.split('?')[0].split('#')[0]
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1)
  return path || '/'
}

function transitionPathsMatch(capturedPath, currentPath) {
  return normalizePathname(capturedPath) === normalizePathname(currentPath)
}

function shouldMountAltTransitionClone(altTransition, currentPathname) {
  if (!altTransition?.clone) return false

  if (transitionPathsMatch(altTransition.pathname, currentPathname)) {
    return true
  }

  // Fallback for work-detail transitions if pathname formatting differs slightly.
  return WORK_SINGLE_PATH_RE.test(normalizePathname(currentPathname))
    && altTransition.variant === 'work-card'
}

function hideCaseStudyThumbnailInRoot(root, sourceKey) {
  if (!root || !sourceKey) return

  const escapedKey = escapeAttributeValue(sourceKey)
  const thumb = root.querySelector(`#${escapedKey} .client-work-img`)
  if (!thumb) return

  thumb.style.visibility = 'hidden'
  thumb.style.opacity = '0'
  thumb.style.pointerEvents = 'none'
}

function escapeAttributeValue(value) {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }

  return value.replace(/(["\\])/g, '\\$1')
}

function applyThinkingCardHoverSnapshot(liveRoot, cloneRoot, target) {
  const liveCard = target?.closest?.('[data-post-card]')
  if (!liveCard || !liveRoot?.contains?.(liveCard) || !cloneRoot) return

  const liveLink = liveCard.querySelector('.thinking-post-link')
  const isHovered = (
    liveCard.matches(':hover')
    || liveCard.classList.contains('hover-active')
    || liveLink?.matches?.(':hover')
  )

  if (!isHovered) return

  const cardKey = liveCard.dataset.postCardKey
  if (!cardKey) return

  const cloneCard = cloneRoot.querySelector(
    `[data-post-card-key="${escapeAttributeValue(cardKey)}"]`,
  )
  if (!cloneCard) return

  cloneCard.classList.add('hover-active')

  const liveRatio = liveCard.querySelector('.ratio')
  const cloneRatio = cloneCard.querySelector('.ratio')
  if (liveRatio && cloneRatio) {
    const ratioStyles = getComputedStyle(liveRatio)
    cloneRatio.style.paddingTop = ratioStyles.paddingTop
  }

  const liveTitle = liveCard.querySelector('[data-post-title]')
  const cloneTitle = cloneCard.querySelector('[data-post-title]')
  if (liveTitle && cloneTitle) {
    const titleStyles = getComputedStyle(liveTitle)
    cloneTitle.style.textDecorationColor = titleStyles.textDecorationColor
    cloneTitle.style.opacity = titleStyles.opacity
  }
}

function captureFixedSectionClones(container, selectors) {
  if (!container) return []

  return selectors.flatMap((selector) => {
    const section = container.querySelector(selector)
    if (!section) return []

    const rect = section.getBoundingClientRect()
    return [{
      clone: section.cloneNode(true),
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
    }]
  })
}

function mountFixedSectionClone({ clone, rect }, zIndex = '10000') {
  Object.assign(clone.style, {
    position: 'fixed',
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    pointerEvents: 'none',
    zIndex,
    margin: '0',
  })
  document.body.appendChild(clone)
  return clone
}

function captureBottomMenuClone(liveBottomMenu) {
  const rect = liveBottomMenu.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return null

  const computed = getComputedStyle(liveBottomMenu)
  const clone = liveBottomMenu.cloneNode(true)

  clone.classList.remove('hidden')
  clone.dataset.frozenClone = 'true'

  Object.assign(clone.style, {
    position: 'fixed',
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: '0',
    pointerEvents: 'none',
    zIndex: '10001',
    visibility: 'visible',
    display: computed.display === 'none' ? 'block' : computed.display,
    transform: 'none',
  })

  gsap.set(clone, { y: 0, opacity: 1, clearProps: 'transform' })

  return clone
}

function killBottomMenuScrollTrigger() {
  ScrollTrigger.getAll().forEach((instance) => {
    if (instance.trigger?.matches?.('.bottom-menu-trigger')) {
      instance.kill()
    }
  })
}

const CASE_STUDY_FULL_CLIP = 'inset(0% 0% 0% 0% round 10px)'

function applyCaseStudyCloneEndState(clone) {
  clone.querySelectorAll('.ratio').forEach((ratio) => {
    gsap.set(ratio, { y: 0, clearProps: 'transform,clipPath' })
    ratio.style.transform = 'none'
    ratio.style.clipPath = CASE_STUDY_FULL_CLIP
    ratio.style.webkitClipPath = CASE_STUDY_FULL_CLIP
  })

  clone.querySelectorAll('picture, img').forEach((node) => {
    gsap.set(node, { clearProps: 'transform,clipPath' })
    node.style.transform = 'none'
    node.style.clipPath = 'none'
    node.style.opacity = '1'
    node.style.visibility = 'visible'
    node.style.filter = 'none'
  })
}

function normalizeCaseStudyCaptureTransforms(altSource) {
  const nodes = Array.from(altSource.querySelectorAll('.ratio, .ratio picture, .ratio img, .thumb-primary, .thumb-secondary'))
  if (!nodes.length) return () => undefined

  const saved = nodes.map((node) => ({
    node,
    y: gsap.getProperty(node, 'y'),
    yPercent: gsap.getProperty(node, 'yPercent'),
    scale: gsap.getProperty(node, 'scale'),
    clipPath: node.style.clipPath || gsap.getProperty(node, 'clipPath') || '',
  }))

  gsap.set(nodes, { clearProps: 'transform,clipPath' })

  return () => {
    saved.forEach(({ node, y, yPercent, scale, clipPath }) => {
      const restore = {}
      if (Number.isFinite(y)) restore.y = y
      if (Number.isFinite(yPercent)) restore.yPercent = yPercent
      if (Number.isFinite(scale)) restore.scale = scale
      if (Object.keys(restore).length) gsap.set(node, restore)
      if (clipPath) node.style.clipPath = clipPath
    })
  }
}

function createFrozenWebGLCanvasNode(sourceCanvas) {
  if (!sourceCanvas || sourceCanvas.tagName !== 'CANVAS') return null

  const rect = sourceCanvas.getBoundingClientRect()
  const displayWidth = Math.round(rect.width)
  const displayHeight = Math.round(rect.height)
  if (displayWidth <= 0 || displayHeight <= 0) return null

  const bufferWidth = sourceCanvas.width
  const bufferHeight = sourceCanvas.height
  if (bufferWidth <= 0 || bufferHeight <= 0) return null

  const computed = getComputedStyle(sourceCanvas)

  try {
    const frozen = document.createElement('canvas')
    frozen.width = bufferWidth
    frozen.height = bufferHeight

    const ctx = frozen.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(sourceCanvas, 0, 0)

    frozen.className = sourceCanvas.className
    frozen.classList.add('transition-capture-canvas')
    if (sourceCanvas.style.cssText) {
      frozen.style.cssText = sourceCanvas.style.cssText
    }

    frozen.style.width = computed.width && computed.width !== 'auto' ? computed.width : `${displayWidth}px`
    frozen.style.height = computed.height && computed.height !== 'auto' ? computed.height : `${displayHeight}px`
    frozen.style.display = computed.display === 'inline' ? 'block' : computed.display || 'block'

    if (!frozen.style.borderRadius) {
      frozen.style.borderRadius = computed.borderRadius
    }

    frozen.dataset.frozenClone = 'true'
    return frozen
  } catch {
    return null
  }
}

function appendFixedCaptureCanvas(clone, liveCanvas, frozenCanvas) {
  const rect = liveCanvas.getBoundingClientRect()
  Object.assign(frozenCanvas.style, {
    position: 'fixed',
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: '0',
    padding: '0',
    zIndex: '0',
    pointerEvents: 'none',
  })

  clone.appendChild(frozenCanvas)

  clone.querySelectorAll('.transition-capture-canvas:not([data-frozen-clone])').forEach((node) => {
    node.style.visibility = 'hidden'
  })
}

function createFrozenVideoNode(video, options = {}) {
  const { fillContainer = false } = options

  if (!video) return null

  const rect = video.getBoundingClientRect()
  const width = Math.round(rect.width)
  const height = Math.round(rect.height)
  const computed = getComputedStyle(video)

  const applySharedStyles = (node) => {
    node.className = video.className
    if (video.style.cssText) {
      node.style.cssText = video.style.cssText
    }

    node.style.width = fillContainer
      ? '100%'
      : (computed.width && computed.width !== 'auto' ? computed.width : `${width}px`)
    node.style.height = fillContainer
      ? '100%'
      : (computed.height && computed.height !== 'auto' ? computed.height : `${height}px`)
    node.style.display = 'block'
    node.style.objectFit = computed.objectFit
    node.style.objectPosition = computed.objectPosition

    if (!node.style.borderRadius) {
      node.style.borderRadius = computed.borderRadius
    }
  }

  if (width > 0 && height > 0 && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const scale = Math.max(width / video.videoWidth, height / video.videoHeight)
      const sourceWidth = width / scale
      const sourceHeight = height / scale
      const sourceX = (video.videoWidth - sourceWidth) / 2
      const sourceY = (video.videoHeight - sourceHeight) / 2

      canvas.getContext('2d')?.drawImage(
        video,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        width,
        height,
      )

      applySharedStyles(canvas)
      return canvas
    } catch {
      // Cross-origin or unavailable frame capture; fall back to poster below.
    }
  }

  const poster = video.getAttribute('poster')
  if (!poster) return null

  const image = document.createElement('img')
  image.src = poster
  image.alt = video.getAttribute('title') || ''
  applySharedStyles(image)
  return image
}

function createTransitionClone(source, options = {}) {
  const { forceHover = false, preferSecondaryImage = false } = options
  const clone = source.cloneNode(true)

  const applyHoveredThumbState = (root) => {
    if (!root || typeof root.querySelectorAll !== 'function') return

    const thumbSwaps = root.matches?.('.thumb-swap')
      ? [root]
      : Array.from(root.querySelectorAll('.thumb-swap'))

    thumbSwaps.forEach((thumbSwap) => {
      const primary = thumbSwap.querySelector('.thumb-primary')
      const secondary = thumbSwap.querySelector('.thumb-secondary')
      if (!primary || !secondary) return

      // Lock clone visuals to the hovered end-frame so outgoing transition
      // always snapshots thumb2, even if pointerdown captured mid-hover tween.
      primary.style.opacity = '0'
      primary.style.visibility = 'hidden'
      primary.style.transform = 'translate3d(0, -100%, 0)'
      primary.style.clipPath = 'inset(0% 0% 100% 0%)'

      secondary.style.opacity = '1'
      secondary.style.visibility = 'inherit'
      secondary.style.transform = 'translate3d(0, 0%, 0)'
      secondary.style.clipPath = 'inset(0% 0% 0% 0%)'
    })
  }

  const sourceHasHoverState = (
    forceHover
    || source.matches(':hover')
    || source.classList.contains('hover-active')
    || source.dataset.transitionHover === 'true'
  )

  if (sourceHasHoverState) {
    clone.dataset.transitionHover = 'true'
    clone.classList.add('hover-active')
    applyHoveredThumbState(clone)
  }

  const liveHoverables = Array.from(source.querySelectorAll('.thumb-swap, .thumb-swap-trigger'))
  const clonedHoverables = Array.from(clone.querySelectorAll('.thumb-swap, .thumb-swap-trigger'))

  liveHoverables.forEach((node, index) => {
    const clonedNode = clonedHoverables[index]
    if (!clonedNode) return

    const shouldSetHover = (
      forceHover
      || node.matches(':hover')
      || node.classList.contains('hover-active')
      || node.dataset.transitionHover === 'true'
    )

    if (!shouldSetHover) return
    clonedNode.dataset.transitionHover = 'true'
    clonedNode.classList.add('hover-active')
    applyHoveredThumbState(clonedNode)
  })

  const liveButtons = [
    ...(source.matches('.btn') ? [source] : []),
    ...Array.from(source.querySelectorAll('.btn')),
  ]
  const clonedButtons = Array.from(clone.querySelectorAll('.btn'))

  liveButtons.forEach((button, index) => {
    const clonedButton = clonedButtons[index]
    if (!clonedButton) return

    if (button.matches(':hover')) {
      clonedButton.dataset.transitionHover = 'true'
    }
  })

  const liveVideos = source.matches('video') ? [source] : Array.from(source.querySelectorAll('video'))
  const clonedVideos = clone.matches('video') ? [clone] : Array.from(clone.querySelectorAll('video'))

  clonedVideos.forEach((video) => {
    video.muted = true
    video.defaultMuted = true
    video.volume = 0
    video.autoplay = false
    video.pause()
    video.setAttribute('muted', '')
    video.removeAttribute('autoplay')
  })

  liveVideos.forEach((video, index) => {
    const clonedVideo = clonedVideos[index]
    if (!clonedVideo) return

    const frozenNode = createFrozenVideoNode(video, { fillContainer: true })
    if (frozenNode) {
      clonedVideo.replaceWith(frozenNode)
    }
  })

  if (preferSecondaryImage) {
    const thumbSwaps = clone.matches?.('.thumb-swap')
      ? [clone]
      : Array.from(clone.querySelectorAll('.thumb-swap'))

    thumbSwaps.forEach((thumbSwap) => {
      const primary = thumbSwap.querySelector('.thumb-primary')
      const secondary = thumbSwap.querySelector('.thumb-secondary')
      if (!secondary) return

      // Guarantee thumb2 is the only visible media in the outgoing clone.
      primary?.remove()
      secondary.style.opacity = '1'
      secondary.style.visibility = 'visible'
      secondary.style.transform = 'translate3d(0, 0%, 0)'
      secondary.style.clipPath = 'inset(0% 0% 0% 0%)'
    })
  }

  return clone
}

export default function TransitionFrame({ children }) {
  const layoutRef = useRef(null)
  const ref = useRef(null)
  const snapshotRef = useRef(null)
  const altTransitionRef = useRef(null)
  const headerSnapshotRef = useRef(null)
  const compactLogoSnapshotRef = useRef(null)
  const bottomMenuSnapshotRef = useRef(null)
  const bottomMenuNavCaptureRef = useRef(false)
  const capturedScrollYRef = useRef(0)
  const capturedScrollHeightRef = useRef(0)
  const hasCapturedRef = useRef(false)
  const capturedPageBgRef = useRef(null)
  const capturedPathRef = useRef(null)
  const isFirstMount = useRef(true)
  // Separate ref so we can detect the first useEffect run independently of
  // useLayoutEffect (which runs before effects and would already have cleared isFirstMount).
  const isFirstEffectRun = useRef(true)
  const location = useLocation()
  const logo = layoutRef.current?.querySelector('.logo')
  const implrPaths = layoutRef.current?.querySelectorAll('#logo-implr g')
  const isDesktop = window.matchMedia('(min-width: 768px)').matches

  //RESPONSIVE VALUES
    let logoScale = 1
    let logoY = 0
    let logoDuration = 0

    let taglineScale = 0.65
    let taglineY = -88
    let taglineX = 65

    if (isDesktop) {
      logoY = -10
      logoScale = 0.35
      logoDuration = 0.5

      taglineScale = 0.68
      taglineY = -213
      taglineX = 65
    }

  function applyCompactLogoState() {
    gsap.set('.logo', {
      scale: logoScale,
      y: logoY,
      transformOrigin: 'left top',
      willChange: 'transform',
    })
    gsap.set('#logo-implr g', {
      x: -20,
      filter: 'blur(10px)',
      autoAlpha: 0,
    })
    gsap.set('.tagline', {
      y: taglineY,
      x: taglineX,
      scale: taglineScale,
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
    if (!href || href.startsWith('#') || link.hasAttribute('download') || link.target === '_blank') {
      return null
    }

    const url = new URL(link.href, window.location.href)
    if (url.origin !== window.location.origin) return null

    return { link, url }
  }

  function resolveSourceByKey(sourceKey) {
    if (!sourceKey) return null

    const escapedKey = escapeAttributeValue(sourceKey)

    return document.querySelector(
      `[data-transition-source="media"][data-transition-source-key="${escapedKey}"]`,
    )
  }

  function resolveAltTransitionSource(target, link) {
    const directImageTrigger = target?.closest?.('[data-transition-source="media"], .alt-transition-img')
    if (directImageTrigger && directImageTrigger.closest('a[href]') === link) {
      return directImageTrigger
    }

    const explicitSourceKey = link?.dataset?.transitionSourceKey
      || target?.closest?.('[data-transition-source-key]')?.dataset?.transitionSourceKey

    if (explicitSourceKey) {
      const keyedSource = resolveSourceByKey(explicitSourceKey)
      if (keyedSource) {
        return keyedSource
      }
    }

    const textTrigger = target?.closest?.('.alt-transition-text')
    if (!textTrigger || textTrigger.closest('a[href]') !== link) {
      return null
    }

    const relatedSlug = textTrigger.closest('.client-name')?.dataset?.client
    if (relatedSlug) {
      // Slugs are sanitized and used as IDs in HomePage.jsx.
      return document.getElementById(relatedSlug)?.querySelector('.alt-transition-img') ?? null
    }

    // Services cards: use the media trigger in the same card when the CTA text is clicked.
    return textTrigger.closest('.service-card')?.querySelector('.alt-transition-img') ?? null
  }

  function resolveDockTarget(preferredSelector = null) {
    if (preferredSelector) {
      const explicitTarget = document.querySelector(preferredSelector)
      if (explicitTarget) {
        const rect = explicitTarget.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) return explicitTarget
      }
    }

    const mediaContainer = document.querySelector('.featured-image .full-image')
    if (mediaContainer) {
      const rect = mediaContainer.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) return mediaContainer
    }

    const picture = document.querySelector('.featured-image picture')
    if (picture) {
      // Use the picture element as soon as it has CSS dimensions — the image
      // itself doesn't need to be fully decoded yet; it will load before the
      // 1.5 s dock animation completes, making the crossfade seamless.
      const rect = picture.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) return picture
      return null
    }

    return (
      document.querySelector('.featured-image .ratio')
      || document.querySelector('.featured-image')
    )
  }

  function getDockRect(preferredSelector = null) {
    const target = resolveDockTarget(preferredSelector)
    if (!target) return null

    const rect = target.getBoundingClientRect()
    if (target.tagName === 'IMG') {
      if (!target.complete || target.naturalWidth === 0 || rect.width <= 0 || rect.height <= 0) return null
    } else if (rect.width <= 0 || rect.height <= 0) {
      return null
    }

    return { target, rect }
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

      // Guard: pointerdown fires before React Router processes the click and
      // (with instant/cached loaders) before React commits the new route.
      // Subsequent calls from the click event or PAGE_TRANSITION_CAPTURE_EVENT
      // would run AFTER the commit, when ref.current is the new page — skip them.
      if (hasCapturedRef.current) return
      hasCapturedRef.current = true

      // Record scroll position at click time. window.scrollY at useLayoutEffect
      // time may already be 0 (browser clamps scroll for new page DOM).
      capturedScrollYRef.current = window.scrollY
      // Use the full document scrollHeight (not just ref.current) so the
      // minSnapshotTop clamp is correct when the user is scrolled into the
      // footer area. ref.current.scrollHeight excludes the footer-off spacer
      // and footer, causing snapshotTop to be clamped too high and pushing
      // absolutely-positioned footer clones outside the 150vh wrapper.
      capturedScrollHeightRef.current = document.documentElement.scrollHeight

      capturedPageBgRef.current = document.documentElement.dataset.pageBg || null
      capturedPathRef.current = window.location.pathname || null

      altTransitionRef.current = null
      bottomMenuNavCaptureRef.current = false

      let caseStudySourceKey = null

      if (target) {
        const nav = extractSameOriginLink(target)
        const altSource = nav ? resolveAltTransitionSource(target, nav.link) : null

        if (altSource?.closest('.case-studies')) {
          caseStudySourceKey = altSource.dataset?.transitionSourceKey
            || nav?.link?.dataset?.transitionSourceKey
            || altSource.closest('.client-work')?.id
            || null
        }

        window.dispatchEvent(new CustomEvent(PAGE_TRANSITION_PREPARE_CAPTURE_EVENT, {
          detail: { caseStudySourceKey },
        }))

        const shouldUseAltTransition = Boolean(
          nav
          && altSource
          && (WORK_SINGLE_PATH_RE.test(nav.url.pathname) || SERVICE_SINGLE_PATH_RE.test(nav.url.pathname)),
        )

        if (shouldUseAltTransition) {
          const captureTarget = altSource.closest('.case-studies')
            ? (altSource.querySelector('.ratio') || altSource)
            : altSource
          const restoreCaseStudyTransforms = altSource.closest('.case-studies')
            ? normalizeCaseStudyCaptureTransforms(altSource)
            : () => undefined
          const rect = captureTarget.getBoundingClientRect()

          if (rect.width > 0 && rect.height > 0) {
            const isCaseStudy = Boolean(altSource.closest('.case-studies'))
            const forceHoverSnapshot = nav.link?.dataset?.transitionSnapshotState === 'hover'
            const variant = altSource.closest('[data-transition-variant]')?.dataset.transitionVariant
              ?? nav.link?.dataset?.transitionVariant
              ?? null
            const clone = createTransitionClone(altSource, {
              forceHover: forceHoverSnapshot,
              preferSecondaryImage: forceHoverSnapshot && variant === 'work-card',
            })

            if (isCaseStudy) {
              applyCaseStudyCloneEndState(clone)
            }

            restoreCaseStudyTransforms()

            const hasVideoSource = altSource.matches('video') || Boolean(altSource.querySelector('video'))

            // Read the card aspect ratio for the current viewport so non-90% cards
            // (and mobile 65% ratios) flatten correctly during the expand animation.
            const sourcePicture = altSource.querySelector('.ratio')
            const isMobileViewport = window.matchMedia('(max-width: 767.9px)').matches
            const sourceAspectRatio = sourcePicture
              ? sourcePicture.style.getPropertyValue(
                  isMobileViewport ? '--aspect-ratio-mobile' : '--aspect-ratio-desktop',
                ).trim()
                || sourcePicture.style.getPropertyValue('--aspect-ratio-desktop').trim()
                || null
              : null
              
            altTransitionRef.current = {
              pathname: normalizePathname(nav.url.pathname),
              variant,
              mediaKind: hasVideoSource ? 'video' : 'image',
              mediaSelector: forceHoverSnapshot && variant === 'work-card'
                ? '.thumb-secondary, img, canvas, video'
                : 'img, canvas, video',
              dockSelector: nav.link?.dataset?.transitionDockSelector || null,
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              borderRadius: getComputedStyle(captureTarget).borderRadius || getComputedStyle(altSource).borderRadius,
              clone,
              sourceAspectRatio,
              isCaseStudy,
              caseStudySourceKey,
            }

            // Work-page cards hide the snapshot and use section clones instead.
            // Case studies keep the snapshot visible (minus the expanding thumbnail).
            if (variant === 'work-card' && !isCaseStudy) {
              const workSection = altSource.closest('.case-studies') || altSource.closest('section')
              if (workSection) {
                const sRect = workSection.getBoundingClientRect()
                altTransitionRef.current.workSectionClone = workSection.cloneNode(true)
                altTransitionRef.current.workSectionRect = {
                  top: sRect.top,
                  left: sRect.left,
                  width: sRect.width,
                }
              }

              altTransitionRef.current.prefixSectionClones = captureFixedSectionClones(
                ref.current,
                ['.page-hero', '.work-filter'],
              )
            }

            // For service-card: capture the service card container so it can
            // animate out independently while the snapshot is hidden.
            if (variant === 'service-card') {
              const serviceCard = altSource.closest('.service-card')
              if (serviceCard) {
                const sRect = serviceCard.getBoundingClientRect()
                altTransitionRef.current.serviceCardClone = serviceCard.cloneNode(true)
                altTransitionRef.current.serviceCardRect = {
                  top: sRect.top,
                  left: sRect.left,
                  width: sRect.width,
                }
              }
            }

            // For work-next: capture the 'Next Case Study' title separately so it
            // can animate out independently without showing the scrolled snapshot.
            if (variant === 'work-next') {
              const nextWorkSection = altSource.closest('.next-work')
              const titleWrapper = nextWorkSection?.querySelector('.next-title-wrapper')
              if (titleWrapper) {
                const titleRect = titleWrapper.getBoundingClientRect()
                // Only capture if the wrapper is at least partially visible in the viewport.
                if (titleRect.bottom > 0 && titleRect.top < window.innerHeight) {
                  altTransitionRef.current.nextTitleClone = titleWrapper.cloneNode(true)
                  altTransitionRef.current.nextTitleTop = titleRect.top
                  altTransitionRef.current.nextTitleHeight = titleRect.height
                }
              }
            }
          } else {
            restoreCaseStudyTransforms()
          }
        }
      } else {
        window.dispatchEvent(new CustomEvent(PAGE_TRANSITION_PREPARE_CAPTURE_EVENT, {
          detail: { caseStudySourceKey: null },
        }))
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

      bottomMenuSnapshotRef.current = null
      const navForBottomMenu = target ? extractSameOriginLink(target) : null
      if (navForBottomMenu?.link?.closest?.('.bottom-menu')) {
        bottomMenuNavCaptureRef.current = true
        killBottomMenuScrollTrigger()
        const liveBottomMenu = document.querySelector('.bottom-menu')
        if (liveBottomMenu) {
          gsap.killTweensOf(liveBottomMenu)
          bottomMenuSnapshotRef.current = captureBottomMenuClone(liveBottomMenu)
        }
      }

      const clone = ref.current.cloneNode(true)

      clone.querySelectorAll('.bottom-menu').forEach((menu) => {
        menu.style.visibility = 'hidden'
      })

      Array.from(clone.querySelectorAll('video')).forEach((video) => {
        video.muted = true
        video.defaultMuted = true
        video.volume = 0
        video.autoplay = false
        video.pause()
        video.setAttribute('muted', '')
        video.removeAttribute('autoplay')
      })

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

      const liveCaptureCanvases = Array.from(ref.current.querySelectorAll('canvas.transition-capture-canvas'))

      liveCaptureCanvases.forEach((liveCanvas) => {
        const frozenCanvas = createFrozenWebGLCanvasNode(liveCanvas)
        if (frozenCanvas) {
          appendFixedCaptureCanvas(clone, liveCanvas, frozenCanvas)
        }
      })

      const footerOffItems = Array.from(document.querySelectorAll('.footer-off')).filter(
        (node) => !ref.current.contains(node),
      )
      const footer = document.querySelector('footer')
      // Absolutely position footer-off and footer clones at their exact
      // document-space coordinates so they appear at the right place in the
      // snapshot regardless of how the detached clone's height compares to the
      // live page height.
      // Math: snapshot is placed at top = -scrollY; an absolute child at
      // top = rect.top + scrollY appears at snapshotTop + docTop = rect.top ✓
      const currentScrollY = window.scrollY
      footerOffItems.forEach((item) => {
        const itemClone = item.cloneNode(true)
        const rect = item.getBoundingClientRect()
        Object.assign(itemClone.style, {
          position: 'absolute',
          top: `${rect.top + currentScrollY}px`,
          left: '0',
          width: '100%',
          margin: '0',
        })
        clone.appendChild(itemClone)
      })
      if (footer) {
        const footerClone = footer.cloneNode(true)
        const rect = footer.getBoundingClientRect()
        Object.assign(footerClone.style, {
          position: 'absolute',
          top: `${rect.top + currentScrollY}px`,
          left: '0',
          width: '100%',
          margin: '0',
        })
        clone.appendChild(footerClone)
      }
      if (caseStudySourceKey) {
        hideCaseStudyThumbnailInRoot(clone, caseStudySourceKey)
      }

      applyThinkingCardHoverSnapshot(ref.current, clone, target)

      snapshotRef.current = clone
    }

    window.dispatchEvent(new Event(PAGE_TRANSITION_CAPTURE_COMPLETE_EVENT))

    const canCaptureFromEventTarget = (target) => Boolean(extractSameOriginLink(target))

    const handlePointerDown = (e) => {
      // Only primary-button navigations; ignore modified clicks/new-tab gestures.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const nav = extractSameOriginLink(e.target)
      if (!nav) return

      // Hover-snapshot links (e.g. work cards) must capture on click, not
      // pointerdown, otherwise we can snapshot before thumb2 reaches its
      // hovered end-frame.
      if (nav.link?.dataset?.transitionSnapshotState === 'hover') return

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
    const handleCaptureEvent = () => capture()
    const handlePopState = () => capture()

    window.addEventListener(PAGE_TRANSITION_CAPTURE_EVENT, handleCaptureEvent)
    window.addEventListener('popstate', handlePopState)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, { capture: true })
      document.removeEventListener('click', handleClick, { capture: true })
      window.removeEventListener(PAGE_TRANSITION_CAPTURE_EVENT, handleCaptureEvent)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // MAIN TRANSITION — synchronous before browser paint on every route change.
  useLayoutEffect(() => {
    const isFirst = isFirstMount.current
    if (isFirst) isFirstMount.current = false

    if (!siteConfig.transitions.enabled || isFirst) return

    const el = ref.current
    const snapshot = snapshotRef.current
    const altTransition = altTransitionRef.current
    if (!el || (!snapshot && !altTransition)) return

    // Child layout effects run before parent (React bottom-up order), so at
    // this point RootLayout has NOT yet updated dataset.pageBg — it still holds
    // the OUTGOING page's value. Use it to colour the overlay background.
    const outgoingPageBg = capturedPageBgRef.current
      || resolveBgFromPath(capturedPathRef.current || '')
      || document.documentElement.dataset.pageBg
    const bgColor = outgoingPageBg === 'dark' ? COFFEE : WHITE
    capturedPageBgRef.current = null
    capturedPathRef.current = null

    // Whether this is a work → next-work transition (card at bottom of WorkSinglePage).
    const isWorkNext = altTransition?.variant === 'work-next'
    // Whether this is a work-page → work-single transition (WorkCard / WorkFeatured).
    const isWorkCard = altTransition?.variant === 'work-card'
    // Whether this is a services-page → service-single transition from a card.
    const isServiceCard = altTransition?.variant === 'service-card'
    const isServiceDockTransition = Boolean(altTransition?.dockSelector?.includes('service-featured-media'))

    // Use the scroll position captured at click time — window.scrollY at
    // useLayoutEffect time may already be 0 (clamped by browser for the new page).
    const scrollY = capturedScrollYRef.current
    capturedScrollYRef.current = 0
    const snapshotHeight = capturedScrollHeightRef.current || 0
    capturedScrollHeightRef.current = 0
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
      height: '150vh',
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

    let altClone = null
    if (shouldMountAltTransitionClone(altTransition, location.pathname)) {
      altClone = altTransition.clone
      Object.assign(altClone.style, {
        position: 'fixed',
        top: `${altTransition.top}px`,
        left: `${altTransition.left}px`,
        width: `${altTransition.width}px`,
        height: `${altTransition.height}px`,
        borderRadius: altTransition.borderRadius,
        margin: '0',
        zIndex: '10001',
        overflow: 'hidden',
        pointerEvents: 'none',
        display: 'block',
      })
      if (altTransition.isCaseStudy) {
        applyCaseStudyCloneEndState(altClone)
      }
      gsap.set(altClone, { autoAlpha: 1, visibility: 'visible', clearProps: 'transform' })
      document.body.appendChild(altClone)
    }

    const hideSnapshotForAltClone = Boolean(
      altClone && (
        isWorkNext
        || isServiceDockTransition
        || (isWorkCard && !altTransition?.isCaseStudy)
      ),
    )

    if (snapshot) {
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

      // Only hide the snapshot when the alt clone is mounted — otherwise the
      // outgoing page disappears with nothing to replace it.
      if (hideSnapshotForAltClone) {
        snapshot.style.opacity = '0'
        snapshot.style.visibility = 'hidden'
      }

      content.appendChild(snapshot)
    }
    wrapper.appendChild(content)
    document.body.appendChild(wrapper)

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

    const bottomMenuClone = bottomMenuSnapshotRef.current
    bottomMenuSnapshotRef.current = null
    if (bottomMenuClone) {
      document.body.appendChild(bottomMenuClone)
      const liveBottomMenu = document.querySelector('.bottom-menu:not([data-frozen-clone])')
      if (liveBottomMenu) {
        gsap.set(liveBottomMenu, { opacity: 0, pointerEvents: 'none' })
      }
    }

    const isHomePage = location.pathname === '/'

    // Signal an in-progress route handoff so RootLayout can defer incoming
    // home entrance animations until the overlay has finished.
    document.documentElement.classList.add('page-transitioning')

    // Suppress scrollbar flash while content is translated off-screen.
    document.documentElement.style.overflowX = 'hidden'

    if (altClone) {
      // Alt transitions should not inherit any previous page transform state.
      gsap.set(el, { y: 0, scale: 1, autoAlpha: 1 })
    } else {
      // Entering page starts below the viewport at 0.85 scale.
      gsap.set(el, { y: window.innerHeight * 1.5, scale: 0.9, autoAlpha: 1 })
    }

    let transitionFinished = false

    const done = () => {
      if (transitionFinished) return
      transitionFinished = true

      document.documentElement.classList.remove('page-transitioning')

      // Immediately pin the real header off-screen so it doesn't snap
      // visible before the fade-in below.
      const realHeader = document.querySelector('.header')
      if (realHeader) gsap.set(realHeader, { autoAlpha: 0, y: -20 })

      // Always reset to compact logo geometry, then reverse for home.
      applyCompactLogoState()
      gsap.set('.compact-logo', { clearProps: 'all' })

      if (isHomePage) {
        document.documentElement.classList.remove('compact-logo-active')
        animateHomeLogoIn()
      }

      altClone?.remove()
      nextTitleEl?.remove()
      workSectionEl?.remove()
      serviceCardEl?.remove()
      prefixSectionEls.forEach((el) => el.remove())
      wrapper.remove()
      document.documentElement.style.overflowX = ''

      // Ensure the incoming page is fully reset after transition teardown.
      gsap.set(el, { clearProps: 'transform,opacity,visibility' })

      // Apply the correct nav/logo colour theme for the INCOMING page before
      // fading the header in. dataset.pageBg has now been updated by
      // RootLayout's layout effect (parent runs after child).
      const incomingPageBg = document.documentElement.dataset.pageBg
      const nav = document.querySelector('#desktop-nav')
      const logoHolder = document.querySelector('.logo-holder')
      if (incomingPageBg === 'dark') {
        nav?.classList.add('light')
        logoHolder?.classList.add('light')
      } else {
        nav?.classList.remove('light')
        logoHolder?.classList.remove('light')
      }

      const fromBottomMenuNav = bottomMenuNavCaptureRef.current
      bottomMenuNavCaptureRef.current = false

      if (fromBottomMenuNav) {
        scrollToTopImmediate()
      }

      // Recalculate all scroll-trigger positions now that the transition is
      // complete and elements are in their final layout positions.
      requestAnimationFrame(() => ScrollTrigger.refresh())
      window.dispatchEvent(new CustomEvent(PAGE_TRANSITION_COMPLETE_EVENT, {
        detail: { fromBottomMenuNav },
      }))

      // Slide the incoming header in from above.
      if (realHeader) {
        gsap.to(realHeader, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'all' })
      }

      snapshotRef.current = null
      altTransitionRef.current = null
      hasCapturedRef.current = false
    }

    let nextTitleEl = null
    let workSectionEl = null
    let serviceCardEl = null
    let prefixSectionEls = []
    let dockPollTimeoutId = 0
    let dockPollCancelled = false
    const tl = gsap.timeline({ onComplete: done })

    if (bottomMenuClone) {
      tl.to(bottomMenuClone, {
        y: 50,
        autoAlpha: 0,
        duration: 0.75,
        ease: 'power4.inOut',
        onComplete: () => bottomMenuClone.remove(),
      }, 0)
    }

    if (altClone) {
      // Scroll to 0 before reading dock coordinates. getBoundingClientRect() is
      // viewport-relative, so if the user scrolled down on the outgoing page the
      // featured-image rect.top would be (offsetTop − scrollY) which can be
      // negative, sending the clone off-screen. This runs in useLayoutEffect
      // (before paint) so there is no visible jump.
      scrollToTopImmediate()

      // For non-90% source cards (WorkCard at 64%, mobile at 65%), override the
      // padding-top ratio trick so the picture fills the altClone's animated box.
      const isMobile = window.matchMedia('(max-width: 767.9px)').matches
      const sourceAspectRatio = altTransition?.sourceAspectRatio
      const shouldFlattenCloneRatio = Boolean(
        sourceAspectRatio && sourceAspectRatio !== '90%',
      ) || (isMobile && (isWorkCard || isWorkNext))

      if (shouldFlattenCloneRatio) {
        const clonePicture = altClone.matches?.('.ratio')
          ? altClone
          : altClone.querySelector('.ratio')
        if (clonePicture) {
          Object.assign(clonePicture.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            paddingTop: '0',
          })
        }
      }

      const altCloneMedia = altClone.querySelector(altTransition?.mediaSelector || 'img, canvas, video')
      if (altCloneMedia) {
        gsap.set(altCloneMedia, { scale: 1, clearProps: 'transform' })
      }
      const resolveDockMedia = (target = null) => {
        const dockTarget = target || resolveDockTarget(dockSelector)
        if (!dockTarget) return null
        if (dockTarget.matches?.('img, canvas, video')) return dockTarget

        return dockTarget.querySelector('img, canvas, video')
      }
      const getDockMediaScale = (target = null) => {
        const dockMedia = resolveDockMedia(target)
        if (!dockMedia) return 1

        const transform = getComputedStyle(dockMedia).transform
        if (!transform || transform === 'none') return 1

        const matrix3dMatch = transform.match(/^matrix3d\((.+)\)$/)
        if (matrix3dMatch) {
          const values = matrix3dMatch[1].split(',').map((v) => Number.parseFloat(v.trim()))
          const sx = values[0]
          return Number.isFinite(sx) && sx > 0 ? sx : 1
        }

        const matrixMatch = transform.match(/^matrix\((.+)\)$/)
        if (matrixMatch) {
          const values = matrixMatch[1].split(',').map((v) => Number.parseFloat(v.trim()))
          const sx = values[0]
          return Number.isFinite(sx) && sx > 0 ? sx : 1
        }

        return 1
      }
      const dockSelector = altTransition?.dockSelector || null
      const dock = getDockRect(dockSelector)
      const hasTargetAtStart = Boolean(dock)
      const isVideoTransition = altTransition?.mediaKind === 'video'
      const smoothEase = 'power3.inOut'
      const expandDuration = 0.75
      const pauseDuration = 0
      const dockDuration = 1.15
      const dockStart = expandDuration + pauseDuration
      const width = window.innerWidth * 1.1
      // Mobile (< md): height-driven expansion so the clone fills the viewport height.
      const useHeightDrivenExpand = isMobile && !isServiceDockTransition

      const servicesSourceAspectRatio = altTransition?.width && altTransition?.height
        ? altTransition.width / altTransition.height
        : 16 / 9

      // Aspect ratio of the source card (width / height). Used for height-driven
      // sizing on mobile so the expanded clone fills the full viewport height
      // with the correct proportional width.
      const cardAspectRatio = altTransition?.width && altTransition?.height
        ? altTransition.width / altTransition.height
        : 1 / 0.9

      // For services, expand to a centered cover box that fills at least the
      // viewport height and width while preserving the source media ratio.
      // For mobile work cards, expand height to 100vh and derive width from
      // the captured card aspect ratio.
      const expandedWidth = isServiceDockTransition
        ? Math.max(width, window.innerHeight * servicesSourceAspectRatio)
        : useHeightDrivenExpand
          ? window.innerHeight * 1.2 * cardAspectRatio
          : width
      const expandedHeight = isServiceDockTransition
        ? expandedWidth / servicesSourceAspectRatio
        : useHeightDrivenExpand
          ? window.innerHeight * 1.2
          : width * 0.9
      const expandedTop = isServiceDockTransition
        ? (window.innerHeight - expandedHeight) / 2
        : useHeightDrivenExpand
          ? 0
          : '-30%'
      const expandedLeft = isServiceDockTransition
        ? (window.innerWidth - expandedWidth) / 2
        : useHeightDrivenExpand
          ? (window.innerWidth - expandedWidth) / 2
          : 0

      const crossfadeToTarget = (target) => {
        gsap.set(target, { autoAlpha: 1 })
        gsap.to(altClone, {
          autoAlpha: 0,
          delay: 0.1,
          duration: 0.25,
          ease: 'none',
        })
      }

      tl.to(altClone, {
        top: expandedTop,
        left: expandedLeft,
        //filter: 'blur(10px)',
        width: expandedWidth,
        height: expandedHeight,
        borderRadius: 0,
        duration: expandDuration,
        ease: smoothEase,
      }, 0)

      // Case studies keep the page snapshot visible; slide it out with the expand.
      if (altTransition?.isCaseStudy && snapshot && !hideSnapshotForAltClone) {
        tl.to(content, {
          y: -72,
          autoAlpha: 0,
          duration: expandDuration * 0.7,
          ease: 'power2.in',
        }, 0)
      }

      // For work-next: animate the captured 'Next Case Study' title clone upward
      // so it swipes off-screen with the transition rather than snapping away.
      if (isWorkNext && altTransition.nextTitleClone) {
        nextTitleEl = altTransition.nextTitleClone
        const titleTop = altTransition.nextTitleTop
        const titleHeight = altTransition.nextTitleHeight
        Object.assign(nextTitleEl.style, {
          position: 'fixed',
          top: `${titleTop}px`,
          left: '0',
          width: '100%',
          height: `${titleHeight}px`,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: '10000',
          margin: '0',
        })
        document.body.appendChild(nextTitleEl)
        // Translate up until bottom edge clears the viewport top, then fade.
        tl.to(nextTitleEl, {
          y: -(titleTop + titleHeight + 20),
          autoAlpha: 0,
          duration: expandDuration * 0.7,
          ease: smoothEase,
        }, 0)
      }

      // For work-card: animate the captured work section clone upward so the
      // grid of cards exits smoothly rather than snapping away instantly.
      if (isWorkCard && altTransition.prefixSectionClones?.length) {
        prefixSectionEls = altTransition.prefixSectionClones.map((entry) => {
          const el = mountFixedSectionClone(entry)
          tl.to(el, {
            y: -80,
            autoAlpha: 0,
            duration: expandDuration * 0.6,
            ease: 'power2.in',
          }, 0)
          return el
        })
      }

      if (isWorkCard && altTransition.workSectionClone) {
        workSectionEl = altTransition.workSectionClone
        const sRect = altTransition.workSectionRect
        Object.assign(workSectionEl.style, {
          position: 'fixed',
          top: `${sRect.top}px`,
          left: `${sRect.left}px`,
          width: `${sRect.width}px`,
          pointerEvents: 'none',
          zIndex: '10000',
          margin: '0',
        })
        document.body.appendChild(workSectionEl)
        tl.to(workSectionEl, {
          y: -80,
          autoAlpha: 0,
          duration: expandDuration * 0.6,
          ease: 'power2.in',
        }, 0)
      }

      // For service-card: animate the captured service card upward so the
      // outgoing page has the same subtle Y exit feel as work transitions.
      if (isServiceCard && altTransition.serviceCardClone) {
        serviceCardEl = altTransition.serviceCardClone
        const sRect = altTransition.serviceCardRect
        Object.assign(serviceCardEl.style, {
          position: 'fixed',
          top: `${sRect.top}px`,
          left: `${sRect.left}px`,
          width: `${sRect.width}px`,
          pointerEvents: 'none',
          zIndex: '10000',
          margin: '0',
        })
        document.body.appendChild(serviceCardEl)
        tl.to(serviceCardEl, {
          y: -52,
          autoAlpha: 0,
          duration: expandDuration * 0.78,
          ease: 'power2.inOut',
        }, 0)
      }

      /*tl.to(altClone, {
        x: -30,
        duration: 0.35,
        ease: smoothEase,
      }, 0.65)
      */

      // Hold the full-screen state briefly before docking back down.
     
      tl.to({}, { duration: pauseDuration }, expandDuration)

      if (dock) {
        const dockMediaScale = getDockMediaScale(dock.target)
        const peakMediaScale = Math.max(dockMediaScale + 0.08, 1.12)

        if (altCloneMedia) {
          const dockMedia = resolveDockMedia(dock.target)
          if (dockMedia) {
            const dockMediaStyle = getComputedStyle(dockMedia)
            altCloneMedia.style.objectFit = dockMediaStyle.objectFit
            altCloneMedia.style.objectPosition = dockMediaStyle.objectPosition
          }

          tl.to(altCloneMedia, {
            scale: peakMediaScale,
            transformOrigin: '50% 50%',
            duration: expandDuration,
            ease: smoothEase,
          }, 0)

          tl.to(altCloneMedia, {
            scale: dockMediaScale,
            transformOrigin: '50% 50%',
            duration: dockDuration,
            ease: smoothEase,
          }, dockStart)
        }

        tl.to(altClone, {
          //filter: 'blur(0px)',
          top: dock.rect.top,
          left: dock.rect.left,
          width: dock.rect.width,
          height: dock.rect.height,
          rotate: 0,
          borderRadius: getComputedStyle(dock.target).borderRadius || altTransition.borderRadius,
          duration: dockDuration,
          ease: smoothEase,
          onComplete: () => {
            const finalDock = getDockRect(dockSelector)
            if (!finalDock) {
              crossfadeToTarget(dock.target)
              return
            }

            gsap.set(altClone, {
              top: finalDock.rect.top,
              left: finalDock.rect.left,
              width: finalDock.rect.width,
              height: finalDock.rect.height,
              borderRadius: getComputedStyle(finalDock.target).borderRadius || altTransition.borderRadius,
            })
            crossfadeToTarget(finalDock.target)
          },
        }, dockStart)
      }

      // Fade the snapshot wrapper as soon as the dock animation begins so the
      // real incoming page is revealed while the clone is still shrinking.
      const wrapperFadeStart = isVideoTransition ? dockStart + dockDuration * 0.4 : dockStart
      tl.to(wrapper, {
        autoAlpha: 0,
        duration: 0.3,
        ease: 'power4.out',
      }, wrapperFadeStart)

      if (!hasTargetAtStart) {
        tl.to({}, { duration: (ALT_DOCK_MAX_WAIT_MS + 900) / 1000 }, dockStart)

        tl.add(() => {
          const start = performance.now()
          const poll = () => {
            if (dockPollCancelled) return

            const lateDock = getDockRect(dockSelector)

            if (lateDock) {
              if (altCloneMedia) {
                const lateDockMedia = resolveDockMedia(lateDock.target)
                const lateDockMediaScale = getDockMediaScale(lateDock.target)
                const latePeakMediaScale = Math.max(lateDockMediaScale + 0.08, 1.12)
                if (lateDockMedia) {
                  const lateDockMediaStyle = getComputedStyle(lateDockMedia)
                  altCloneMedia.style.objectFit = lateDockMediaStyle.objectFit
                  altCloneMedia.style.objectPosition = lateDockMediaStyle.objectPosition
                }
                gsap.to(altCloneMedia, {
                  scale: latePeakMediaScale,
                  transformOrigin: '50% 50%',
                  duration: Math.max(0.25, expandDuration * 0.6),
                  ease: smoothEase,
                })
                gsap.to(altCloneMedia, {
                  scale: lateDockMediaScale,
                  transformOrigin: '50% 50%',
                  delay: Math.max(0.08, pauseDuration * 0.5),
                  duration: dockDuration,
                  ease: smoothEase,
                })
              }

              gsap.to(altClone, {
                top: lateDock.rect.top,
                left: lateDock.rect.left,
                width: lateDock.rect.width,
                height: lateDock.rect.height,
                borderRadius: getComputedStyle(lateDock.target).borderRadius || altTransition.borderRadius,
                duration: dockDuration,
                ease: smoothEase,
                onComplete: () => {
                  const finalLateDock = getDockRect(dockSelector) || lateDock
                  gsap.set(altClone, {
                    top: finalLateDock.rect.top,
                    left: finalLateDock.rect.left,
                    width: finalLateDock.rect.width,
                    height: finalLateDock.rect.height,
                    borderRadius: getComputedStyle(finalLateDock.target).borderRadius || altTransition.borderRadius,
                  })
                  crossfadeToTarget(finalLateDock.target)
                },
              })
              return
            }

            if (performance.now() - start < ALT_DOCK_MAX_WAIT_MS) {
              dockPollTimeoutId = window.setTimeout(poll, ALT_DOCK_POLL_MS)
            }
          }

          poll()
        }, dockStart)
      }
    } else {
      tl.to(content, { scale: 0.9, duration: 0.5, ease: 'power4.in', transformOrigin: '50% 50%' }, 0)
      tl.to(wrapper, { y: -window.innerHeight * 1.5, duration: 1, ease: 'power4.in' }, 0.1)
      tl.to(el, { y: 0, duration: 1, ease: 'power4.out' }, 0.5)
      tl.to(el, { scale: 1, duration: 0.75, ease: 'power4.out', clearProps: 'all' }, 1)
    }

    return () => {
      if (transitionFinished) return

      dockPollCancelled = true
      window.clearTimeout(dockPollTimeoutId)
      tl.kill()
      if (altClone) {
        gsap.killTweensOf(altClone)
        altClone.querySelectorAll('img, canvas, video, .thumb-primary, .thumb-secondary').forEach((node) => {
          gsap.killTweensOf(node)
        })
        altClone.remove()
      }
      wrapper.remove()
      if (compactLogoClone) {
        gsap.killTweensOf(compactLogoClone)
        compactLogoClone.remove()
      }
      if (headerClone) {
        gsap.killTweensOf(headerClone)
        headerClone.remove()
      }
      if (bottomMenuClone) {
        gsap.killTweensOf(bottomMenuClone)
        bottomMenuClone.remove()
      }
      if (nextTitleEl) {
        gsap.killTweensOf(nextTitleEl)
        nextTitleEl.remove()
      }
      if (workSectionEl) {
        gsap.killTweensOf(workSectionEl)
        workSectionEl.remove()
      }
      prefixSectionEls.forEach((el) => {
        gsap.killTweensOf(el)
        el.remove()
      })
      if (serviceCardEl) {
        gsap.killTweensOf(serviceCardEl)
        serviceCardEl.remove()
      }
      document.documentElement.classList.remove('page-transitioning')
      document.documentElement.style.overflowX = ''
      gsap.killTweensOf(el)
      gsap.set(el, { clearProps: 'transform,opacity,visibility' })
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
    let cleanup = null
    const handler = () => {
      if (location.pathname === '/') return
      cleanup = createSurfaceColorTransitions(ref.current)
    }
    window.addEventListener(PAGE_TRANSITION_COMPLETE_EVENT, handler, { once: true })
    return () => {
      window.removeEventListener(PAGE_TRANSITION_COMPLETE_EVENT, handler)
      cleanup?.()
    }
  }, [location.pathname])

  useEffect(() => {
    let cleanup = null
    const handler = () => {
      if (location.pathname === '/') return
      cleanup = createSlideUpAnimations(ref.current)
    }
    window.addEventListener(PAGE_TRANSITION_COMPLETE_EVENT, handler, { once: true })
    return () => {
      window.removeEventListener(PAGE_TRANSITION_COMPLETE_EVENT, handler)
      cleanup?.()
    }
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