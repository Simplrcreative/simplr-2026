import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Seo from '../components/Seo.jsx'
import { breadcrumbSchema, webPageSchema } from '../lib/seo.js'
import { createSplitTextAnimation, createBtnHoverAnimation, createSlideUpAnimations } from '../lib/animations/index.js'


gsap.registerPlugin(ScrollTrigger)

function getGalleryGap(width) {
  if (width >= 1024) return 14
  if (width >= 768) return 12
  return 10
}

function getTargetRowHeight(width) {
  if (width >= 1400) return 340
  if (width >= 1200) return 320
  if (width >= 1024) return 290
  if (width >= 768) return 230
  return 180
}

function getPreferredCardWidth(width) {
  if (width >= 1400) return 500
  if (width >= 1200) return 460
  if (width >= 1024) return 380
  if (width >= 768) return 280
  return 180
}

function buildJustifiedRows(items, containerWidth) {
  if (!items.length || !containerWidth) return []

  const gap = getGalleryGap(containerWidth)
  const targetRowHeight = getTargetRowHeight(containerWidth)
  const preferredCardWidth = getPreferredCardWidth(containerWidth)
  const maxItemsPerRow = Math.max(
    1,
    Math.floor((containerWidth + gap) / (preferredCardWidth + gap)),
  )
  const rows = []
  let row = []
  let ratioSum = 0

  const flushRow = (forceNaturalHeight = false) => {
    if (!row.length) return

    const rowGapTotal = gap * (row.length - 1)
    const justifiedHeight = (containerWidth - rowGapTotal) / Math.max(ratioSum, 0.001)
    const naturalHeight = targetRowHeight
    const baseHeight = forceNaturalHeight ? naturalHeight : justifiedHeight
    const height = Math.max(150, Math.min(420, baseHeight))

    rows.push({
      id: `row-${rows.length}`,
      height,
      items: row.map((item) => ({
        ...item,
        width: height * item.ratio,
      })),
    })

    row = []
    ratioSum = 0
  }

  items.forEach((item) => {
    row.push(item)
    ratioSum += item.ratio
    const projectedWidth = ratioSum * targetRowHeight + gap * (row.length - 1)
    if (projectedWidth >= containerWidth || row.length >= maxItemsPerRow) {
      flushRow(false)
    }
  })

  if (row.length) {
    const naturalWidth = ratioSum * targetRowHeight + gap * (row.length - 1)
    flushRow(naturalWidth < containerWidth * 0.8)
  }

  return rows
}

export default function Est2014Page() {
  const { beyondItems = [] } = useLoaderData() ?? {}
  const btnRef = useRef(null)
  const galleryRef = useRef(null)
  const [measuredRatios, setMeasuredRatios] = useState({})
  const [galleryWidth, setGalleryWidth] = useState(0)
  useEffect(() => createSplitTextAnimation(), [])
  useEffect(() => createSlideUpAnimations(document.body), [])
  useEffect(() => {
    if (btnRef.current) return createBtnHoverAnimation(btnRef.current)
  }, [])

  useEffect(() => {
    if (!galleryRef.current) return

    const node = galleryRef.current
    const updateWidth = () => setGalleryWidth(node.clientWidth || 0)
    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  const galleryItems = useMemo(() => (
    beyondItems.map((item) => ({
      ...item,
      ratio: measuredRatios[item.id] ?? item.ratio ?? 1,
    }))
  ), [beyondItems, measuredRatios])

  const galleryRows = useMemo(
    () => buildJustifiedRows(galleryItems, galleryWidth),
    [galleryItems, galleryWidth],
  )

  const setMeasuredRatio = (id, width, height) => {
    if (!width || !height) return
    const nextRatio = width / height

    setMeasuredRatios((prev) => {
      const current = prev[id]
      if (current && Math.abs(current - nextRatio) < 0.01) return prev
      return { ...prev, [id]: nextRatio }
    })
  }

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

      <section className="page-hero px-5 pb-40 bg-coffee section-dark min-h-screen flex items-end relative">
        <div className="grid grid-cols-12 w-full">
          <div className="col-span-12 change-logo-back" />
          <div className="col-span-9 text-white change-logo mt-40 max-w-[115ch]">
            <div className="eyebrow">Beyond the work</div>
            <h1 className="hero-title">Simplr has never <span>just been about the work.</span> It&apos;s about the people, <span><i>the energy,</i></span> and the <span>shared ambition behind it.</span> Not everything we do is visible in the outcome - <span><i>some of it lives here.</i></span></h1>
          </div>
          <div className="col-start-10 col-span-3 text-white flex justify-end items-end">
            <Link 
              to="/about"
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

      <section className="beyond-items px-5 bg-coffee change-logo pb-5">
        {galleryItems.length ? (
          <div ref={galleryRef} className="beyond-grid ">
            {galleryRows.map((row) => (
              <div key={row.id} className="beyond-row slide-up-subtle" style={{ '--beyond-row-height': `${row.height}px` }}>
                {row.items.map((item) => (
                  <figure key={item.id} className="beyond-card" style={{ width: `${item.width}px` }}>
                    {item.type === 'video' ? (
                      <video
                        className="beyond-card__media"
                        src={item.source}
                        muted
                        loop
                        playsInline
                        autoPlay
                        preload="metadata"
                        onLoadedMetadata={(event) => {
                          setMeasuredRatio(item.id, event.currentTarget.videoWidth, event.currentTarget.videoHeight)
                        }}
                      />
                    ) : (
                      <img
                        className="beyond-card__media"
                        src={item.source}
                        alt={item.caption || 'Beyond item'}
                        loading="lazy"
                        onLoad={(event) => {
                          setMeasuredRatio(item.id, event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)
                        }}
                      />
                    )}
                    {item.caption ? <figcaption className="beyond-card__caption">{item.caption}</figcaption> : null}
                  </figure>
                ))}
              </div>
            ))}
          </div>
        ) : null}
      </section>

    </>
  )
}
