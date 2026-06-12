import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Seo from '../components/Seo.jsx'
import { breadcrumbSchema, webPageSchema } from '../lib/seo.js'
import { createSplitTextAnimation, createBtnHoverAnimation } from '../lib/animations/index.js'
import PictureImg from '../components/PictureImg.jsx'

function getThumbnail(acfFeaturedThumbnail, preferredSize = 'large', fallbackSize = 'medium_large') {
  const thumbnailNode = acfFeaturedThumbnail?.node
  const sizes = thumbnailNode?.mediaDetails?.sizes ?? []
  return (
    sizes.find((s) => s.name === preferredSize)?.sourceUrl ??
    sizes.find((s) => s.name === fallbackSize)?.sourceUrl ??
    thumbnailNode?.guid ??
    ''
  )
}

gsap.registerPlugin(ScrollTrigger)

function initSpotlightAnimations() {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill())

  const images = document.querySelectorAll(".img")
  if (!images.length) return

  const scatterDirections = [
    { x: 1.3, y: 0.7 },
    { x: -1.5, y: 1.0 },
    { x: 1.1, y: -1.3 },
    { x: -1.7, y: -0.8 },
    { x: -1.0, y: -1.4 },
    { x: 1.6, y: 0.3 },
    { x: -0.7, y: 1.7 },
    { x: 1.2, y: -1.6 },
    { x: -1.4, y: 0.9 },
    { x: 1.8, y: -0.5 },
    { x: -1.1, y: -1.8 },
    { x: 0.9, y: 1.8 },
    { x: -1.9, y: 0.4 },
    { x: 1.0, y: -1.9 },
    { x: -0.8, y: 1.9 },
    { x: 1.7, y: -1.0 },
    { x: -1.3, y: -1.2 },
    { x: 0.7, y: 2.0 },
    { x: 1.2, y: -0.2 },
    { x: 1.6, y: -0.9 },
  ]

  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  const isMobile = screenWidth < 768
  const scatterMultiplier = isMobile ? 2.5 : 0.65
  const startPositions = Array.from(images).map(() => ({
    x: -200,
    y: -200,
    z: -2000,
    scale: 0
  }))
  const endPositions = Array.from(images).map((_, index) => {
    const dir = scatterDirections[index % scatterDirections.length]
    return {
      x: dir.x * screenWidth * scatterMultiplier,
      y: dir.y * screenHeight * scatterMultiplier,
      z: 2000,
      scale: 1
    }
  })

  images.forEach((img, index) => {
    gsap.set(img, startPositions[index])
  })

  const animationMultiplier = isMobile ? 4 : 4

  ScrollTrigger.create({
    trigger: ".spotlight",
    start: "top 0%",
    end: `+=${window.innerHeight * 10}px`,
    pin: true,
    pinSpacing: true,
    scrub: 2,
    onUpdate: (self) => {
      const progress = self.progress
      images.forEach((img, index) => {
        const staggerDelay = index * 0.05
        const scaleMultiplier = isMobile ? 4 : 4
        let imageProgress = Math.max(0, (progress - staggerDelay) * animationMultiplier)
        const start = startPositions[index]
        const end = endPositions[index]
        const scaleValue = gsap.utils.interpolate(
          start.scale,
          end.scale,
          imageProgress * scaleMultiplier
        )
        const xValue = gsap.utils.interpolate(
          start.x,
          end.x,
          imageProgress
        )
        const yValue = gsap.utils.interpolate(
          start.y,
          end.y,
          imageProgress
        )
        const zValue = gsap.utils.interpolate(
          start.z, 
          end.z, 
          imageProgress
        )
        gsap.set(img, {
          scale: scaleValue,
          x: xValue,
          y: yValue,
          z: zValue
        })
      })
    }
  })
}

export default function Est2014Page() {
  const { beyondItems = [] } = useLoaderData() ?? {}
  const btnRef = useRef(null)
  const galleryRef = useRef(null)
  const [videoRatios, setVideoRatios] = useState({})
  useEffect(() => createSplitTextAnimation(), [])
  useEffect(() => {
    if (btnRef.current) return createBtnHoverAnimation(btnRef.current)
  }, [])

  useEffect(() => {
    initSpotlightAnimations()
    window.addEventListener('resize', initSpotlightAnimations)
    return () => {
      window.removeEventListener('resize', initSpotlightAnimations)
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [beyondItems.length])

  useEffect(() => {
    const muteAndPauseAllGalleryVideos = () => {
      const videos = Array.from(galleryRef.current?.querySelectorAll('video') ?? [])
      videos.forEach((video) => {
        video.muted = true
        video.defaultMuted = true
        video.volume = 0
        video.pause()
      })
    }
  }, [])

  const pathname = '/est-2014'
  const title = 'Est 2014'
  const description = 'Est 2014 Page'

  return (
    <>
      <Seo
        title={title}
        description={description}
        pathname={pathname}
        schema={[
          webPageSchema({ pathname, title, description, type: 'WorkPage' }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: title, path: pathname },
          ]),
        ]}
      />

      <section className="page-hero px-5 bg-coffee section-dark min-h-[80vh] flex items-end relative">
        <div className="grid grid-cols-12 w-full">
          <div className="col-span-12 change-logo-back " />
          <div className="col-span-9 text-white change-logo mt-40 max-w-[115ch] ">
            <div className="eyebrow">Beyond the work</div>
            <h1 className="hero-title">Simplr has never <span>just been about the work.</span> It&apos;s about the people, <span><i>the energy,</i></span> and the <span>shared ambition behind it.</span> Not everything we do is visible in the outcome - <span><i>some of it lives here.</i></span></h1>
          </div>
          <div className="col-start-10 col-span-3 text-white flex justify-end items-end">
            <Link 
              to="/about#our-people"
              ref={btnRef}
              className="btn relative bg-white text-coffee md:absolute md:right-[1.25rem] md:bottom-[5rem] ms-5 md:ms-0 mt-10 md:mt-0"
            >
              <span className="btn-fill" aria-hidden="true" />
              <span className="btn-inner">
                <span className="btn-text text-coffee">Join our team</span>
                Join our team
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="spotlight bg-coffee section-dark change-logo min-h-screen relative">
        {beyondItems.length ? (
          <div ref={galleryRef} className="spotlight-images">
            {beyondItems.map((item) => {
              const ratio = item.type === 'video'
                ? videoRatios[item.id] ?? item.width / item.height
                : item.width / item.height

              const imgLoaderSrc = getThumbnail(item.source, 'loader')
              const imgMobileSrc = getThumbnail(item.source, 'medium')
              const imgDesktopSrc = getThumbnail(item.source, 'large')

              return (
                <figure
                  key={item.id}
                  className="img"
                  style={{ width: '400px', aspectRatio: ratio }}
                >
                  {item.type === 'video' ? (
                    <video
                      src={item.source}
                      muted
                      playsInline
                      autoPlay
                      loop
                      controls={false}
                      onLoadedMetadata={(event) => {
                        const width = event.currentTarget.videoWidth
                        const height = event.currentTarget.videoHeight
                        if (width && height) {
                          setVideoRatios((prev) => ({
                            ...prev,
                            [item.id]: width / height,
                          }))
                        }
                      }}
                    />
                  ) : (
                    <PictureImg
                      loaderSrc={imgLoaderSrc + '.webp'}
                      mobileSrc={imgMobileSrc + '.webp'}
                      desktopSrc={imgDesktopSrc + '.webp'}
                      pictureClass="w-full h-full block"
                      imgClass="beyond-card__media"
                      altText={item.caption}
                    />
                  )}
                  {item.caption ? <figcaption className="beyond-card__caption">{item.caption}</figcaption> : null}
                </figure>
              )
            })}
          </div>
        ) : null}
        <div className="spotlight-background"></div>
      </section>

    </>
  )
}
