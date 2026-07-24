import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const WORK_MASK_RADIUS = '10px'
const PAGE_TRANSITION_PREPARE_CAPTURE_EVENT = 'page-transition:prepare-capture'
const PAGE_TRANSITION_CAPTURE_COMPLETE_EVENT = 'page-transition:capture-complete'

const DESKTOP_CONFIG = {
  firstChangeRatio: 0.35,
  perClientRatio: 0.8,
  detailDuration: 0.35,
  mediaDuration: 0.35,
  ease: 'power2.inOut',
}

const MOBILE_CONFIG = {
  firstChangeRatio: 0.35,
  perClientRatio: 0.5,
  detailDuration: 0.35,
  mediaDuration: 0.35,
  ease: 'power2.inOut',
}

function createWorkMaskClip(topInset, bottomInset) {
  return `inset(${topInset} 0% ${bottomInset} 0% round ${WORK_MASK_RADIUS})`
}

let pluginsRegistered = false

function registerPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger)
    pluginsRegistered = true
  }
}

function setupCaseStudies(scope, config) {
  const section = scope.matches?.('.case-studies') ? scope : scope.querySelector('.case-studies')

  if (!section) return undefined

  const clientNames = Array.from(section.querySelectorAll('.client-name'))
  const clientWorkList = section.querySelector('.client-work-list')
  const clientWorks = Array.from(section.querySelectorAll('.client-work'))
  const clientDetails = clientNames.map((name) => name.querySelector('.client-detail'))
  const clientWorksById = new Map(clientWorks.map((work) => [work.id, work]))
  const cleanupHoverListeners = []

  if (!clientNames.length) return undefined

  const scrollHeightFirstChange = window.innerHeight * config.firstChangeRatio
  const scrollHeightPerClient = window.innerHeight * config.perClientRatio
  const { detailDuration, mediaDuration, ease } = config

  let currentIndex = -1
  let isCapturing = false

  // Lock the section to the viewport height BEFORE creating the pin.
  // Expanding client-details used to grow the section while pinned, which
  // corrupts ScrollTrigger's pin-spacer and shifts the block on reverse scroll.
  const lockPinViewport = () => {
    const vh = window.innerHeight
    section.classList.add('case-studies--pin-locked')
    gsap.set(section, {
      height: vh,
      maxHeight: vh,
      overflow: 'hidden',
      boxSizing: 'border-box',
    })
  }

  lockPinViewport()

  // Kill any scrubbed slide-up on the inner grid — its y-transform reverses
  // while the section is pinned and drops the content on scroll-up.
  const pinGrid = section.querySelector(':scope > .grid')
  if (pinGrid) {
    ScrollTrigger.getAll().forEach((st) => {
      if (st.trigger === pinGrid) st.kill()
    })
    gsap.killTweensOf(pinGrid)
    gsap.set(pinGrid, { clearProps: 'transform,translate,y,opacity,willChange' })
  }

  // Stack works absolutely so they crossfade without collapsing the container.
  // Reserve list height from the active work so mobile flow doesn't overlap names.
  const syncWorkListHeight = (index, animate = false) => {
    const activeWork = clientWorks[index]
    if (!activeWork || !clientWorkList) return

    const nextHeight = activeWork.getBoundingClientRect().height
    if (nextHeight <= 0) return

    if (animate) {
      gsap.to(clientWorkList, {
        height: nextHeight,
        duration: mediaDuration,
        ease,
        overwrite: 'auto',
      })
      return
    }

    gsap.set(clientWorkList, { height: nextHeight })
  }

  gsap.set(clientWorkList, { position: 'relative' })
  clientWorks.forEach((work) => {
    const mediaFrame = work.querySelector('.client-work-img .ratio')

    gsap.set(work, { position: 'absolute', top: 0, left: 0, width: '100%', opacity: 0, zIndex: 0 })
    if (mediaFrame) {
      gsap.set(mediaFrame, {
        y: 100,
        clipPath: createWorkMaskClip('87%', '0%'),
        transformOrigin: 'bottom center',
      })
    }
  })

  // Clip details to zero height — no display toggling, no layout jump
  clientDetails.forEach((detail) => {
    if (detail) gsap.set(detail, { height: 0, opacity: 0, overflow: 'hidden' })
  })

  clientNames.forEach((name) => name.classList.remove('active'))

  function setHoverStateByIndex(index, isHovered) {
    const name = clientNames[index]
    if (!name) return

    const detail = clientDetails[index]
    const work = clientWorksById.get(name.dataset.client)
    const workImage = work?.querySelector('.client-work-img')

    workImage?.classList.toggle('hover-active', isHovered)
    detail?.classList.toggle('hover-active', isHovered)
  }

  // Keep hover states in sync between the left client list and right work images.
  clientNames.forEach((name, index) => {
    const handleNameEnter = () => setHoverStateByIndex(index, true)
    const handleNameLeave = () => setHoverStateByIndex(index, false)

    name.addEventListener('mouseenter', handleNameEnter)
    name.addEventListener('mouseleave', handleNameLeave)

    cleanupHoverListeners.push(() => {
      name.removeEventListener('mouseenter', handleNameEnter)
      name.removeEventListener('mouseleave', handleNameLeave)
    })
  })

  clientWorks.forEach((work) => {
    const workImage = work.querySelector('.client-work-img')
    if (!workImage) return

    const index = clientNames.findIndex((name) => name.dataset.client === work.id)
    if (index < 0) return

    const handleImageEnter = () => setHoverStateByIndex(index, true)
    const handleImageLeave = () => setHoverStateByIndex(index, false)

    workImage.addEventListener('mouseenter', handleImageEnter)
    workImage.addEventListener('mouseleave', handleImageLeave)

    cleanupHoverListeners.push(() => {
      workImage.removeEventListener('mouseenter', handleImageEnter)
      workImage.removeEventListener('mouseleave', handleImageLeave)
    })
  })

  function setActiveClient(index, direction = 1) {
    if (isCapturing) return
    if (index === currentIndex) return

    const previousIndex = currentIndex
    currentIndex = index
    const travelDirection = direction >= 0 ? 1 : -1
    const enteringStartClip = travelDirection > 0 ? createWorkMaskClip('87%', '0%') : createWorkMaskClip('0%', '87%')
    const exitingEndClip = travelDirection > 0 ? createWorkMaskClip('0%', '87%') : createWorkMaskClip('87%', '0%')
    const fullyOpenClip = createWorkMaskClip('0%', '0%')

    const nextName = clientNames[index]
    const previousName = previousIndex >= 0 ? clientNames[previousIndex] : null
    const nextWork = nextName ? clientWorksById.get(nextName.dataset.client) : null
    const previousWork = previousName ? clientWorksById.get(previousName.dataset.client) : null

    syncWorkListHeight(index, previousIndex >= 0)

    clientNames.forEach((name, i) => {
      const detail = clientDetails[i]
      const isActive = i === index

      name.classList.toggle('active', isActive)

      if (!detail) return

      gsap.killTweensOf(detail)

      if (isActive) {
        // Incoming: expand from 0 → auto (smooth)
        gsap.fromTo(
          detail,
          { height: 0, opacity: 0 },
          {
            height: 'auto',
            opacity: 1,
            duration: detailDuration,
            ease: ease === 'none' ? 'power2.out' : ease,
            overwrite: 'auto',
          },
        )
        return
      }

      // Outgoing: lock current pixel height first, then collapse.
      // Animating height:auto → 0 without this often snaps.
      const currentHeight = detail.offsetHeight
      if (currentHeight > 0) {
        gsap.set(detail, { height: currentHeight })
        gsap.to(detail, {
          height: 0,
          opacity: 0,
          duration: detailDuration,
          ease: ease === 'none' ? 'power2.in' : ease,
          overwrite: 'auto',
        })
      } else {
        gsap.set(detail, { height: 0, opacity: 0 })
      }
    })

    if (previousWork && previousWork !== nextWork) {
      const previousMediaFrame = previousWork.querySelector('.client-work-img .ratio')
      const previousCategories = previousWork.querySelector('.categories')

      gsap.killTweensOf(previousWork)

      if (previousMediaFrame) gsap.killTweensOf(previousMediaFrame)
      if (previousCategories) gsap.killTweensOf(previousCategories)

      gsap.set(previousWork, { opacity: 1, zIndex: 1 })
      gsap.to(previousWork, {
        duration: mediaDuration,
        ease,
        onStart: () => {
          if (previousCategories) gsap.set(previousCategories, { opacity: 0 })
        },
        onComplete: () => {
          gsap.set(previousWork, { zIndex: 0 })
        },
      })
      if (previousMediaFrame) {
        gsap.to(previousMediaFrame, {
          y: -300 * travelDirection,
          clipPath: exitingEndClip,
          transformOrigin: 'bottom center',
          duration: mediaDuration,
          ease: ease === 'none' ? 'power2.in' : ease,
          overwrite: 'auto',
        })
      }
    }

    if (nextWork) {
      const nextMediaFrame = nextWork.querySelector('.client-work-img .ratio')
      const nextCategories = nextWork.querySelector('.categories')

      gsap.killTweensOf(nextWork)

      if (nextMediaFrame) gsap.killTweensOf(nextMediaFrame)
      if (nextCategories) gsap.killTweensOf(nextCategories)

      if (previousIndex < 0) {
        gsap.set(nextWork, { opacity: 1, zIndex: 2 })
        if (nextCategories) gsap.set(nextCategories, { opacity: 1 })
        if (nextMediaFrame) {
          gsap.set(nextMediaFrame, {
            y: 0,
            clipPath: fullyOpenClip,
            transformOrigin: 'top center',
          })
        }
        syncWorkListHeight(index, false)
        return
      }

      gsap.set(nextWork, { opacity: 1, zIndex: 2 })
      if (nextCategories) gsap.set(nextCategories, { opacity: 1 })

      if (nextMediaFrame) {
        gsap.fromTo(
          nextMediaFrame,
          {
            y: 300 * travelDirection,
            clipPath: enteringStartClip,
          },
          {
            y: 0,
            clipPath: fullyOpenClip,
            duration: mediaDuration,
            ease: ease === 'none' ? 'power2.out' : ease,
            overwrite: 'auto',
          },
        )
      }
    }
  }

  // Show the first client immediately
  setActiveClient(0)
  // Remeasure after layout/paint — absolute works can report 0 height on first tick.
  requestAnimationFrame(() => syncWorkListHeight(0, false))

  // Links are only interactive once the section is pinned at the viewport top.
  // Before that, .alt-transition-img / .alt-transition-text get pointer-events:none via CSS.
  section.classList.add('case-studies--unpinned')

  const totalScrollLength = scrollHeightFirstChange + (clientNames.length - 1) * scrollHeightPerClient

  function resolveIndexFromScroll(scrolled) {
    if (scrolled < scrollHeightFirstChange) {
      return 0
    }

    return 1 + Math.min(
      Math.floor((scrolled - scrollHeightFirstChange) / scrollHeightPerClient),
      clientNames.length - 2,
    )
  }

  const onPrepareCapture = (event) => {
    isCapturing = true
    trigger.disable(false, false)

    const sourceKey = event?.detail?.caseStudySourceKey
      || clientNames[currentIndex]?.dataset?.client
    const targetWork = sourceKey
      ? (clientWorksById.get(sourceKey) || document.getElementById(sourceKey))
      : clientWorks[currentIndex >= 0 ? currentIndex : 0]
    const targetIndex = targetWork ? clientWorks.indexOf(targetWork) : currentIndex
    const fullyOpenClip = createWorkMaskClip('0%', '0%')
    const closedClip = createWorkMaskClip('87%', '0%')

    if (targetIndex >= 0) {
      currentIndex = targetIndex
    }

    clientNames.forEach((name, index) => {
      const detail = clientDetails[index]
      const isActive = clientWorks[index] === targetWork

      name.classList.toggle('active', isActive)

      if (detail) {
        gsap.killTweensOf(detail)
        gsap.set(detail, isActive
          ? { height: 'auto', opacity: 1, overflow: 'hidden' }
          : { height: 0, opacity: 0, overflow: 'hidden' },
        )
      }
    })

    clientWorks.forEach((work) => {
      const mediaFrame = work.querySelector('.client-work-img .ratio')
      const mediaNodes = mediaFrame
        ? [mediaFrame, ...Array.from(mediaFrame.querySelectorAll('picture, img'))]
        : []
      const targets = [work, ...mediaNodes].filter(Boolean)
      const isTarget = targetWork ? work === targetWork : false

      gsap.killTweensOf(targets)

      if (isTarget) {
        gsap.set(work, { opacity: 1, zIndex: 2 })
        if (mediaFrame) {
          gsap.set(mediaFrame, { clearProps: 'transform,clipPath,y' })
          gsap.set(mediaFrame, {
            y: 0,
            clipPath: fullyOpenClip,
            transformOrigin: 'bottom center',
          })
        }
        return
      }

      gsap.set(work, { opacity: 0, zIndex: 0 })
      if (mediaFrame) {
        gsap.set(mediaFrame, {
          y: 100,
          clipPath: closedClip,
          transformOrigin: 'bottom center',
        })
      }
    })
  }

  const onCaptureComplete = () => {
    isCapturing = false
    trigger.enable(false, false)
  }

  window.addEventListener(PAGE_TRANSITION_PREPARE_CAPTURE_EVENT, onPrepareCapture)
  window.addEventListener(PAGE_TRANSITION_CAPTURE_COMPLETE_EVENT, onCaptureComplete)

  const trigger = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: `+=${totalScrollLength}`,
    pin: true,
    anticipatePin: 1,
    refreshPriority: -2,
    invalidateOnRefresh: true,
    onEnter: () => section.classList.remove('case-studies--unpinned'),
    onLeaveBack: () => section.classList.add('case-studies--unpinned'),
    onUpdate: (self) => {
      const scrolled = self.progress * totalScrollLength
      setActiveClient(resolveIndexFromScroll(scrolled), self.direction)
    },
  })

  requestAnimationFrame(() => {
    trigger.refresh()
    if (trigger.progress > 0) {
      setActiveClient(resolveIndexFromScroll(trigger.progress * totalScrollLength), 1)
    }
  })

  return () => {
    window.removeEventListener(PAGE_TRANSITION_PREPARE_CAPTURE_EVENT, onPrepareCapture)
    window.removeEventListener(PAGE_TRANSITION_CAPTURE_COMPLETE_EVENT, onCaptureComplete)
    trigger.kill(true)
    section.classList.remove('case-studies--pin-locked', 'case-studies--unpinned')
    gsap.set(section, { clearProps: 'transform,top,left,width,maxWidth,maxHeight,height,overflow,padding,margin,boxSizing' })
    cleanupHoverListeners.forEach((cleanup) => cleanup())
    clientNames.forEach((name) => name.classList.remove('active'))
    clientWorks.forEach((work) => {
      const mediaFrame = work.querySelector('.client-work-img .ratio')
      const workImage = work.querySelector('.client-work-img')
      const targets = [work, mediaFrame, workImage].filter(Boolean)

      gsap.killTweensOf(targets)
      gsap.set(work, { clearProps: 'opacity,zIndex,position,top,left,width,transform' })
      if (mediaFrame) gsap.set(mediaFrame, { clearProps: 'transform,clipPath,y' })
      workImage?.classList.remove('hover-active')
    })
    clientDetails.forEach((detail) => {
      detail?.classList.remove('hover-active')
      if (detail) gsap.set(detail, { clearProps: 'height,opacity,overflow' })
    })
    if (clientWorkList) gsap.set(clientWorkList, { clearProps: 'minHeight,position,height' })
  }
}

export function createCaseStudiesScrollAnimation(scope) {
  if (!scope) return () => undefined

  registerPlugins()

  const media = gsap.matchMedia()

  media.add(
    '(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)',
    () => setupCaseStudies(scope, MOBILE_CONFIG),
  )

  media.add(
    '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
    () => setupCaseStudies(scope, DESKTOP_CONFIG),
  )

  return () => {
    media.revert()
  }
}
