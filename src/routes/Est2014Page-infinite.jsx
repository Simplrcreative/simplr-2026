import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Seo from '../components/Seo.jsx'
import { webPageSchema } from '../lib/seo.js'
import { InfiniteCanvasScene } from '../infinite-canvas/scene.jsx'
import { scheduleInfiniteCanvasResize } from '../infinite-canvas/resize.js'
import { getTexture, getMediaLoadProgress } from '../infinite-canvas/texture-manager.js'
import { resetInfiniteCanvas } from '../infinite-canvas/reset.js'
import { PageLoader } from '../loader/index.jsx'
import { createSplitTextAnimation, createBtnHoverAnimation, createEst2014HeroScrollAnimation, lockScroll, unlockScroll } from '../lib/animations/index.js'

function getImageUrl(item) {
  const sizes = item.source?.node?.mediaDetails?.sizes ?? []
  return (
    sizes.find((s) => s.name === 'large')?.sourceUrl ??
    sizes.find((s) => s.name === 'full')?.sourceUrl ??
    item.source?.node?.guid ??
    ''
  )
}

function mapBeyondItemsToMedia(beyondItems) {
  return beyondItems
    .map((item) => {
      if (item.type === 'video') {
        const url = typeof item.source === 'string' ? item.source : ''
        if (!url) return null
        return {
          type: 'video',
          url,
          width: item.width ?? 1920,
          height: item.height ?? 1080,
        }
      }

      if (item.type === 'image') {
        const url = getImageUrl(item)
        if (!url) return null
        return {
          type: 'image',
          url,
          width: item.width ?? item.source?.node?.mediaDetails?.width ?? 512,
          height: item.height ?? item.source?.node?.mediaDetails?.height ?? 512,
        }
      }

      return null
    })
    .filter(Boolean)
}

const LOADER_SESSION_KEY = 'est2014-canvas-ready'
const PAGE_TRANSITION_COMPLETE_EVENT = 'page-transition:complete'

export default function Est2014PageInfinite() {
  const btnRef = useRef(null)
  const sceneRef = useRef(null)
  const canvasLayerRef = useRef(null)
  const travelXRef = useRef(null)
  const travelYRef = useRef(null)
  const travelZRef = useRef(null)
  const canPlayAnimationRef = useRef(false)
  const isReturnVisit = useRef(sessionStorage.getItem(LOADER_SESSION_KEY) === '1')
  const { beyondItems = [], page, siteSettings } = useLoaderData() ?? {}
  const [textureProgress, setTextureProgress] = useState(0)
  const [showCanvas, setShowCanvas] = useState(false)
  const media = mapBeyondItemsToMedia(beyondItems)

  useLayoutEffect(() => {
    media.forEach((item) => getTexture(item))
  }, [media])

  useEffect(() => {
    if (!media.length) {
      setTextureProgress(100)
      return undefined
    }

    const update = () => setTextureProgress(getMediaLoadProgress(media))
    update()
    const id = window.setInterval(update, 100)
    return () => window.clearInterval(id)
  }, [media])

  useEffect(() => createSplitTextAnimation(), [])
  useEffect(() => {
    if (btnRef.current) return createBtnHoverAnimation(btnRef.current)
  }, [])

  useEffect(() => {
    canPlayAnimationRef.current = false
    lockScroll('est2014-loader')

    return () => {
      unlockScroll('est2014-loader')
      resetInfiniteCanvas()
    }
  }, [])

  useEffect(() => {
    if (!showCanvas) return undefined

    const syncCanvasSize = () => {
      scheduleInfiniteCanvasResize(() => ScrollTrigger.refresh())
    }

    window.addEventListener(PAGE_TRANSITION_COMPLETE_EVENT, syncCanvasSize)

    return () => window.removeEventListener(PAGE_TRANSITION_COMPLETE_EVENT, syncCanvasSize)
  }, [showCanvas])

  useEffect(() => {
    if (!showCanvas) return undefined

    const destroyAnimation = createEst2014HeroScrollAnimation(sceneRef.current, {
      canPlay: () => canPlayAnimationRef.current,
      canvasLayer: canvasLayerRef.current,
    })

    scheduleInfiniteCanvasResize(() => ScrollTrigger.refresh())

    return () => destroyAnimation?.()
  }, [showCanvas])

  const handleLoaderComplete = () => {
    canPlayAnimationRef.current = true
    sessionStorage.setItem(LOADER_SESSION_KEY, '1')
    unlockScroll('est2014-loader')
    setShowCanvas(true)
  }

  const handleTravelUpdate = useCallback(({ x, y, z }) => {
    if (travelXRef.current) travelXRef.current.textContent = x.toFixed(1)
    if (travelYRef.current) travelYRef.current.textContent = y.toFixed(1)
    if (travelZRef.current) travelZRef.current.textContent = z.toFixed(1)
  }, [])

  return (
    <>
      <Seo
        title={page?.title ?? 'Est. 2014'}
        description={page?.intro ?? ''}
        pathname="/est-2014/"
        schema={[webPageSchema({ pathname: '/est-2014/', title: page?.title ?? 'Est. 2014', description: page?.intro ?? '', type: 'WorkPage' })]}
      />
      <section ref={sceneRef} className="est2014-scene min-h-screen">
        
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          <div className="hero est2014-hero px-5 relative z-2 min-h-[80vh] flex md:items-end">
            <div className="grid grid-cols-12 w-full grid-rows-[30px_auto]">
              <div className="col-span-12 change-logo-back" aria-hidden="true" />
              <div className="col-start-1 col-span-12 md:col-span-9 text-coffee mt-40 max-w-[115ch] ">
                <div className="eyebrow">Beyond the work</div>
                <h1 className="hero-title">Simplr has never <span>just been about the work.</span> It&apos;s about the people, <span><i>the energy,</i></span> and the <span>shared ambition behind it.</span> Not everything we do is visible in the outcome - <span><i>some of it lives here.</i></span></h1>
              </div>
              <div className="col-start-1 md:col-start-10 col-span-12 md:col-span-3 text-coffee flex md:justify-end items-end mt-5 md:mt-0">
                <Link 
                  to="/about#our-people"
                  ref={btnRef}
                  className="btn relative bg-white text-coffee md:absolute md:right-[1.25rem] md:bottom-0"
                >
                  <span className="btn-fill" aria-hidden="true" />
                  <span className="btn-inner">
                    <span className="btn-text text-coffee">Join our team</span>
                    Join our team
                  </span>
                </Link>
              </div>
            </div>
          </div>
          <PageLoader
            progress={textureProgress}
            onComplete={handleLoaderComplete}
            minVisibleMs={isReturnVisit.current ? 0 : 1500}
            staticHint={isReturnVisit.current}
            hintText="Start scrolling to explore."
          />
          {showCanvas && (
            <div ref={canvasLayerRef} className="est2014-canvas-layer">
              <InfiniteCanvasScene
                media={media}
                backgroundColor="#FFF"
                fogColor="#FFF"
                showControls
                onTravelUpdate={handleTravelUpdate}
              />
              <div
                className="est2014-widget fixed z-1000 bottom-[1.25rem] right-[1.25rem] bg-white text-coffee leading-none px-5 py-2 rounded-full flex items-center gap-3 tabular-nums"
                aria-live="polite"
                aria-label="Canvas travel distance"
              >
                <span ref={travelXRef}>0.0</span>
                <span ref={travelYRef}>0.0</span>
                <span ref={travelZRef}>0.0</span>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
