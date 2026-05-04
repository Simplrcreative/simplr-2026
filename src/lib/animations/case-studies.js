import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const SCROLL_HEIGHT_FIRST_CHANGE = window.innerHeight * 0.35
const SCROLL_HEIGHT_PER_CLIENT = window.innerHeight * 0.85
const WORK_MASK_RADIUS = '10px'

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
      const picture = work.querySelector('.client-work-img picture')
      const img = work.querySelector('img')

      gsap.set(work, { position: 'absolute', top: 0, left: 0, width: '100%', opacity: 0, zIndex: 0 })
      if (picture) {
        gsap.set(picture, {
          y: 100,
          '--aspect-ratio-desktop': '90%',
          '--aspect-ratio-mobile': '90%',
          clipPath: createWorkMaskClip('87%', '0%'),
          transformOrigin: 'bottom center',
        })
      }
      if (img) gsap.set(img, { scale: 1 })
    })

    // Clip details to zero height — no display toggling, no layout jump
    clientDetails.forEach((detail) => {
      if (detail) gsap.set(detail, { height: 0, opacity: 0, overflow: 'hidden'})
    })

    clientNames.forEach((name) => name.classList.remove('active'))

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

        const previousPicture = previousWork.querySelector('.client-work-img picture')
        const previousImage = previousWork.querySelector('img')
        const previousCategories = previousWork.querySelector('.categories')

        gsap.killTweensOf(previousWork)

        if (previousPicture) gsap.killTweensOf(previousPicture)
        if (previousImage) gsap.killTweensOf(previousImage)
        if (previousCategories) gsap.killTweensOf(previousCategories)

        gsap.set(previousWork, { opacity: 1, zIndex: 1 })
        gsap.to(previousWork, {
          //opacity: 1,
          //duration: 0.1,
          ease: 'none',
          onStart: () => {
            if (previousCategories) gsap.set(previousCategories, { opacity: 0 })
          },
          onComplete: () => {
            gsap.set(previousWork, { zIndex: 0 })
          }
        })
        if (previousPicture) {
          gsap.to(previousPicture, {
            y: -300 * travelDirection,
            clipPath: exitingEndClip,
            transformOrigin: 'bottom center',
            duration: 0.5,
            delay: 0.1,
            ease: 'none',
          })
        }
        if (previousImage) {
          gsap.to(previousImage, { scale: 1, duration: 1, ease: 'none' })
        }
      }

      if (nextWork) {
        
        const nextPicture = nextWork.querySelector('.client-work-img picture')
        const nextImage = nextWork.querySelector('img')
        const nextCategories = nextWork.querySelector('.categories')

        gsap.killTweensOf(nextWork)

        if (nextPicture) gsap.killTweensOf(nextPicture)
        if (nextImage) gsap.killTweensOf(nextImage)
        if (nextCategories) gsap.killTweensOf(nextCategories)

        if (previousIndex < 0) {
          gsap.set(nextWork, { opacity: 1, zIndex: 2 })
          if (nextCategories) gsap.set(nextCategories, { opacity: 1 })
          if (nextPicture) {
            gsap.set(nextPicture, {
              y: 0,
              clipPath: fullyOpenClip,
              transformOrigin: 'top center',
            })
          }
          if (nextImage) gsap.set(nextImage, { scale: 1.2 })
          return
        }

        gsap.set(nextWork, { opacity: 1, zIndex: 2 })
        if (nextCategories) gsap.set(nextCategories, { opacity: 1 })

        if (nextPicture) {
          gsap.fromTo(
            nextPicture,
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
        if (nextImage) {
          gsap.fromTo(nextImage, { scale: 1 }, { scale: 1.2, dekay: 0.2, duration: 0.5, ease: 'none' })
        }
      }
    }

    // Show the first client immediately
    setActiveClient(0)

    const totalScrollLength = SCROLL_HEIGHT_FIRST_CHANGE + (clientNames.length - 1) * SCROLL_HEIGHT_PER_CLIENT

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: `+=${totalScrollLength}`,
      pin: true,
      refreshPriority: -2,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const scrolled = self.progress * totalScrollLength
        let index
        if (scrolled < SCROLL_HEIGHT_FIRST_CHANGE) {
          index = 0
        } else {
          index = 1 + Math.min(
            Math.floor((scrolled - SCROLL_HEIGHT_FIRST_CHANGE) / SCROLL_HEIGHT_PER_CLIENT),
            clientNames.length - 2,
          )
        }
        setActiveClient(index, self.direction)
      },
    })

    return () => {
      trigger.kill()
      ro?.disconnect()
    }
  })

  return () => {
    media.revert()
  }
}
