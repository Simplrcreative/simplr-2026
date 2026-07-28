import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import Seo from '../components/Seo.jsx'
import { buildStaticPageSeo } from '../lib/page-seo.js'
import { createSplitTextAnimation, createBtnHoverAnimation, refreshScrollTriggers } from '../lib/animations/index.js'
import PictureImg from '../components/PictureImg.jsx'

const FALLBACK_RATIO = { image: 4 / 3, video: 16 / 9 }

// Rough per-item allowance for the vertical gap between stacked items, in the
// same relative units as 1/ratio (item height for a column of unit width).
const GAP_ESTIMATE = 0.12

function getNumCols() {
  const w = window.innerWidth
  if (w >= 1280) return 4
  if (w >= 900) return 3
  if (w >= 640) return 2
  return 2
}

function getItemRatio(item) {
  return item.ratio
    ?? (item.width && item.height ? item.width / item.height : null)
    ?? FALLBACK_RATIO[item.type]
    ?? 1
}

// Round-robin (index % numCols) only balances item *count* per column, not
// height — since items have varying aspect ratios, one column can drift
// taller than another, and by the tail of a long list that drift becomes a
// visible gap where shorter columns run out of content first. Bin-packing
// each item into whichever column is currently shortest (using the aspect
// ratio we already know from WP media data) keeps columns level throughout.
function distributeIntoColumns(items, numCols) {
  const heights = new Array(numCols).fill(0)
  const cols = Array.from({ length: numCols }, () => [])

  items.forEach((item) => {
    let shortest = 0
    for (let i = 1; i < numCols; i += 1) {
      if (heights[i] < heights[shortest]) shortest = i
    }

    cols[shortest].push(item)
    heights[shortest] += 1 / getItemRatio(item) + GAP_ESTIMATE
  })

  return cols
}

function getThumbnail(acfFeaturedThumbnail, preferredSize, fallbackSize = 'medium') {
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

  const columns = useMemo(
    () => distributeIntoColumns(beyondItems, numCols),
    [beyondItems, numCols]
  )

  // Most items already know their aspect ratio (WP media dimensions), so their
  // box height is reserved up front and never shifts. A few may be missing
  // that data and fall back to an estimated ratio instead — once those settle
  // (load or error) we refresh ScrollTrigger once so any downstream triggers
  // (e.g. the footer/logo section below) recalculate against the corrected
  // page height instead of the guessed one.
  const pendingUnknownRatioRef = useRef(
    beyondItems.filter((item) => !item.width || !item.height).length
  )

  const handleUnknownRatioSettled = () => {
    pendingUnknownRatioRef.current -= 1
    if (pendingUnknownRatioRef.current <= 0) {
      refreshScrollTriggers()
    }
  }

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

      <section className="page-hero px-3 md:px-5 py-5 md:py-20 bg-coffee relative section-dark md:min-h-[75vh] flex flex-col md:items-end">
        <div className="grid grid-cols-12 w-full grid-rows-[30px_auto]">
          <div className="col-span-12 change-logo-back " />
          <div className="col-span-12 lg:col-span-9 text-white change-logo mt-30 mb-5 md:mt-40 md:mb-0 max-w-[115ch]">
            <div className="eyebrow">Beyond the work</div>
            <h1 className="hero-title">Simplr has never <span>just been about the work.</span> It&apos;s about the people, <span><i>the energy,</i></span> and the <span>shared ambition behind it.</span> Not everything we do is visible in the outcome - <span><i>some of it lives here.</i></span></h1>
          </div>
          <div className="col-start-1 md:col-start-10 col-span-12 md:col-span-3 text-white flex justify-end items-end">
            <Link 
              to="/about"
              ref={btnRef}
              className="btn alt relative bg-white text-coffee md:absolute md:right-[1.25rem] md:bottom-[5rem] ms-5 md:ms-0 mt-10 md:mt-0"
            >
              <span>Join our team</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="beyond-section px-3 md:px-5 pb-5 pt-20 bg-coffee section-dark change-logo">
        {beyondItems.length ? (
          <div ref={galleryRef} className="beyond-masonry">
            {columns.map((colItems, colIndex) => (
              <div key={colIndex} className="beyond-masonry__col">
                {colItems.map((item) => {
                  // Known media dimensions (from WP) reserve the exact box up front —
                  // no waiting on the asset itself to know how tall this item is.
                  const knownRatio = item.ratio ?? (item.width && item.height ? item.width / item.height : null)
                  const hasKnownRatio = Boolean(knownRatio)
                  const ratio = item.type === 'video'
                    ? videoRatios[item.id] ?? knownRatio
                    : knownRatio

                  const imgLoaderSrc = getThumbnail(item.source, 'loader')
                  const imgMobileSrc = getThumbnail(item.source, 'small')
                  const imgDesktopSrc = getThumbnail(item.source, 'medium')

                  return (
                    <figure
                      key={item.id}
                      className="beyond-masonry__item"
                      style={{ aspectRatio: ratio || FALLBACK_RATIO[item.type] }}
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
                            if (!hasKnownRatio) handleUnknownRatioSettled()
                          }}
                          onError={() => {
                            if (!hasKnownRatio) handleUnknownRatioSettled()
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
                          width={item.width || undefined}
                          height={item.height || undefined}
                          onSettled={hasKnownRatio ? undefined : handleUnknownRatioSettled}
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
