import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const SCROLL_HEIGHT_FIRST_CHANGE = window.innerHeight * 0.35
const SCROLL_HEIGHT_PER_CLIENT = window.innerHeight * 0.85
const WORK_MASK_RADIUS = '10px'
const PAGE_TRANSITION_PREPARE_CAPTURE_EVENT = 'page-transition:prepare-capture'

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

export function createCaseStudiesScrollAnimation(scope) {
  if (!scope) return () => undefined

  registerPlugins()

  const media = gsap.matchMedia()

  media.add('(prefers-reduced-motion: no-preference)', () => {
    const section = scope.matches?.('.case-studies') ? scope : scope.querySelector('.case-studies')

    if (!section) return undefined

    const clientNames = Array.from(section.querySelectorAll('.client-name'))
    const clientWorkList = section.querySelector('.client-work-list')
    const clientWorks = Array.from(section.querySelectorAll('.client-work'))
    const clientDetails = clientNames.map((name) => name.querySelector('.client-detail'))
    const clientWorksById = new Map(clientWorks.map((work) => [work.id, work]))
    const cleanupHoverListeners = []

    if (!clientNames.length) return undefined

    let currentIndex = -1
    let ro

    const syncHeightForIndex = (index) => {
      const activeWork = clientWorks[index]
      if (!activeWork || !clientWorkList) return

      const height = activeWork.getBoundingClientRect().height
      if (height > 0) gsap.set(clientWorkList, { minHeight: height })
    }

    const observeWork = (index) => {
      ro?.disconnect()

      const activeWork = clientWorks[index]
      if (!activeWork) return

      ro = new ResizeObserver(() => syncHeightForIndex(index))
      ro.observe(activeWork)
      syncHeightForIndex(index)
    }

    // Stack works absolutely so they crossfade without collapsing the container
    gsap.set(clientWorkList, { position: 'relative' })
    clientWorks.forEach((work) => {
      const mediaFrame = work.querySelector('.client-work-img .ratio')

      gsap.set(work, { position: 'absolute', top: 0, left: 0, width: '100%', opacity: 0, zIndex: 0 })
      if (mediaFrame) {
        gsap.set(mediaFrame, {
          y: 100,
          '--aspect-ratio-desktop': '90%',
          '--aspect-ratio-mobile': '90%',
          clipPath: createWorkMaskClip('87%', '0%'),
          transformOrigin: 'bottom center',
        })
      }
    })

    // Clip details to zero height — no display toggling, no layout jump
    clientDetails.forEach((detail) => {
      if (detail) gsap.set(detail, { height: 0, opacity: 0, overflow: 'hidden'})
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
      if (index === currentIndex) return

      const previousIndex = currentIndex
      currentIndex = index
      const travelDirection = direction >= 0 ? 1 : -1
      const enteringStartClip = travelDirection > 0 ? createWorkMaskClip('87%', '0%') : createWorkMaskClip('0%', '87%')
      const exitingEndClip = travelDirection > 0 ? createWorkMaskClip('0%', '87%') : createWorkMaskClip('87%', '0%')
      const fullyOpenClip = createWorkMaskClip('0%', '0%')

      observeWork(index)

      const nextName = clientNames[index]
      const previousName = previousIndex >= 0 ? clientNames[previousIndex] : null
      const nextWork = nextName ? clientWorksById.get(nextName.dataset.client) : null
      const previousWork = previousName ? clientWorksById.get(previousName.dataset.client) : null

      clientNames.forEach((name, i) => {
        const detail = clientDetails[i]
        const isActive = i === index

        name.classList.toggle('active', isActive)

        if (detail) {
          gsap.killTweensOf(detail)
          if (isActive) {
            gsap.to(detail, { height: 'auto', opacity: 1, duration: 0.45, ease: 'none' })
          } else {
            gsap.to(detail, { height: 0, opacity: 0, duration: 0.3, ease: 'none' })
          }
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
          ease: 'none',
          onStart: () => {
            if (previousCategories) gsap.set(previousCategories, { opacity: 0 })
          },
          onComplete: () => {
            gsap.set(previousWork, { zIndex: 0 })
          }
        })
        if (previousMediaFrame) {
          gsap.to(previousMediaFrame, {
            y: -300 * travelDirection,
            clipPath: exitingEndClip,
            transformOrigin: 'bottom center',
            duration: 0.5,
            delay: 0.1,
            ease: 'none',
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
              duration: 0.5,
              ease: 'none',
            },
          )
        }
      }
    }

    // Show the first client immediately
    setActiveClient(0)

    // Links are only interactive once the section is pinned at the viewport top.
    // Before that, .alt-transition-img / .alt-transition-text get pointer-events:none via CSS.
    section.classList.add('case-studies--unpinned')

    const totalScrollLength = SCROLL_HEIGHT_FIRST_CHANGE + (clientNames.length - 1) * SCROLL_HEIGHT_PER_CLIENT

    function resolveIndexFromScroll(scrolled) {
      if (scrolled < SCROLL_HEIGHT_FIRST_CHANGE) {
        return 0
      }

      return 1 + Math.min(
        Math.floor((scrolled - SCROLL_HEIGHT_FIRST_CHANGE) / SCROLL_HEIGHT_PER_CLIENT),
        clientNames.length - 2,
      )
    }

    const onPrepareCapture = (event) => {
      const sourceKey = event?.detail?.caseStudySourceKey
        || clientNames[currentIndex]?.dataset?.client
      const targetWork = sourceKey
        ? (clientWorksById.get(sourceKey) || document.getElementById(sourceKey))
        : clientWorks[currentIndex]
      const fullyOpenClip = createWorkMaskClip('0%', '0%')
      const closedClip = createWorkMaskClip('87%', '0%')

      clientWorks.forEach((work) => {
        const mediaFrame = work.querySelector('.client-work-img .ratio')
        const targets = [work, mediaFrame].filter(Boolean)
        const isTarget = targetWork ? work === targetWork : false

        gsap.killTweensOf(targets)

        if (isTarget) {
          gsap.set(work, { opacity: 1, zIndex: 2 })
          if (mediaFrame) {
            gsap.set(mediaFrame, { clearProps: 'transform' })
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

    window.addEventListener(PAGE_TRANSITION_PREPARE_CAPTURE_EVENT, onPrepareCapture)

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: `+=${totalScrollLength}`,
      pin: true,
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
      trigger.kill(true)
      gsap.set(section, { clearProps: 'transform,top,left,width,maxWidth,maxHeight,padding,margin' })
      section.classList.remove('case-studies--unpinned')
      ro?.disconnect()
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
      if (clientWorkList) gsap.set(clientWorkList, { clearProps: 'minHeight,position' })
    }
  })

  return () => {
    media.revert()
  }
}
