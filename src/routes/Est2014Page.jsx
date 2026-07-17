import { useEffect, useRef, useState } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import Seo from '../components/Seo.jsx'
import { buildStaticPageSeo } from '../lib/page-seo.js'
import { createSplitTextAnimation, createBtnHoverAnimation } from '../lib/animations/index.js'
import PictureImg from '../components/PictureImg.jsx'

function getNumCols() {
  const w = window.innerWidth
  if (w >= 1280) return 4
  if (w >= 900) return 3
  if (w >= 640) return 2
  return 1
}

function getThumbnail(acfFeaturedThumbnail, preferredSize = 'medium_large', fallbackSize = 'medium') {
  const thumbnailNode = acfFeaturedThumbnail?.node
  const sizes = thumbnailNode?.mediaDetails?.sizes ?? []
  return (
    sizes.find((s) => s.name === preferredSize)?.sourceUrl ??
    sizes.find((s) => s.name === fallbackSize)?.sourceUrl ??
    thumbnailNode?.guid ??
    ''
  )
}

export default function Est2014Page() {
  const { beyondItems = [], page } = useLoaderData() ?? {}
  const seo = buildStaticPageSeo('est2014', page)
  const btnRef = useRef(null)
  const galleryRef = useRef(null)
  const [videoRatios, setVideoRatios] = useState({})
  const [numCols, setNumCols] = useState(getNumCols)

  const columns = Array.from({ length: numCols }, (_, colIndex) =>
    beyondItems
      .map((item, i) => ({ item, globalIndex: i }))
      .filter(({ globalIndex }) => globalIndex % numCols === colIndex)
  )

  useEffect(() => {
    const update = () => setNumCols(getNumCols())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => createSplitTextAnimation(), [])
  useEffect(() => {
    if (btnRef.current) return createBtnHoverAnimation(btnRef.current)
  }, [])

  // Fade items in as they scroll into view
  useEffect(() => {
    const gallery = galleryRef.current
    if (!gallery) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px 60px 0px', threshold: 0.05 }
    )

    gallery.querySelectorAll('.beyond-masonry__item').forEach((item) => observer.observe(item))

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <Seo {...seo} />

      <section className="page-hero px-5 py-5 md:py-20 bg-coffee section-dark md:min-h-[75vh] flex flex-col md:items-end">
        <div className="grid grid-cols-12 w-full grid-rows-[30px_auto]">
          <div className="col-span-12 change-logo-back " />
          <div className="col-span-12 lg:col-span-9 text-white change-logo mt-50 mb-5 md:mt-40 md:mb-0 max-w-[115ch]">
            <div className="eyebrow">Beyond the work</div>
            <h1 className="hero-title">Simplr has never <span>just been about the work.</span> It&apos;s about the people, <span><i>the energy,</i></span> and the <span>shared ambition behind it.</span> Not everything we do is visible in the outcome - <span><i>some of it lives here.</i></span></h1>
          </div>
          <div className="col-start-1 md:col-start-10 col-span-12 md:col-span-3 text-white flex justify-end items-end">
            <Link 
              to="/about#our-people"
              ref={btnRef}
              className="btn alt relative bg-white text-coffee md:absolute md:right-[1.25rem] md:bottom-[5rem] ms-5 md:ms-0 mt-10 md:mt-0"
            >
              <span>Join our team</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="beyond-section px-5 pb-5 pt-20 bg-coffee section-dark change-logo">
        {beyondItems.length ? (
          <div ref={galleryRef} className="beyond-masonry">
            {columns.map((colItems, colIndex) => (
              <div key={colIndex} className="beyond-masonry__col">
                {colItems.map(({ item }) => {
                  const ratio = item.type === 'video'
                    ? videoRatios[item.id] ?? item.width / item.height
                    : item.width / item.height

                  const imgLoaderSrc = getThumbnail(item.source, 'loader')
                  const imgMobileSrc = getThumbnail(item.source, 'medium')
                  const imgDesktopSrc = getThumbnail(item.source, 'medium_large')

                  return (
                    <figure key={item.id} className="beyond-masonry__item">
                      {item.type === 'video' ? (
                        <video
                          src={item.source}
                          muted
                          playsInline
                          autoPlay
                          loop
                          controls={false}
                          style={{ aspectRatio: ratio || '16/9' }}
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
                          pictureClass="beyond-masonry__picture"
                          imgClass="beyond-masonry__img"
                          altText={item.caption}
                        />
                      )}
                      {item.caption ? <figcaption className="beyond-card__caption">{item.caption}</figcaption> : null}
                    </figure>
                  )
                })}
              </div>
            ))}
          </div>
        ) : null}
      </section>

    </>
  )
}
