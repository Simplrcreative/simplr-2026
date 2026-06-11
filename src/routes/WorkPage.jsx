import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Seo from '../components/Seo.jsx'
import CategoryBadge, { slugify } from '../components/CategoryBadge.jsx'
import PictureImg from '../components/PictureImg.jsx'
import { breadcrumbSchema, webPageSchema } from '../lib/seo.js'
import { createSplitTextAnimation, refreshScrollTriggers, createSlideUpAnimations, createWorkThumbHoverAnimation } from '../lib/animations/index.js'
import { fetchTestimonialData, fetchWorksData } from '../lib/wp-api.js'

gsap.registerPlugin(ScrollTrigger)

const WORK_BATCH_SIZE = 6

const FILTERS = [
  { id: 'all',                    label: 'All',                      bg: 'var(--color-coffee)',                 text: '#fff' },
  { id: 'strategy',               label: 'Strategy',                 bg: 'var(--color-strategy)',               text: 'var(--color-coffee)' },
  { id: 'branding-design',        label: 'Branding & Design',        bg: 'var(--color-branding-design)',        text: '#fff' },
  { id: 'web-design-development', label: 'Web Design & Development', bg: 'var(--color-web-design-development)', text: 'var(--color-coffee)' },
  { id: 'motion',                 label: 'Motion',                   bg: 'var(--color-motion)',                 text: '#fff' },
  { id: 'templates',              label: 'Templates',                bg: 'var(--color-templates)',              text: '#fff' },
]

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

function workMatchesFilter(work, filter) {
  if (filter === 'all') return true
  return (work.acfWorkBuilder?.acfCategory?.nodes ?? []).some(
    ({ name }) => slugify(name) === filter,
  )
}

/**
 * Groups works chronologically into 6-item layout sections.
 * In each full group:
 * - item 1 is always featured
 * - items 2-5 are always small work cards
 * - item 6 is always the testimonial work
 *
 * Final partial groups still keep item 1 as featured and render remaining
 * items as small cards.
 */
function groupWorks(works) {
  const groups = []
  for (let i = 0; i < works.length; i += 6) {
    const chunk = works.slice(i, i + 6)
    if (!chunk.length) continue

    groups.push({
      featured: chunk[0] ?? null,
      gridItems: chunk.length === 6 ? chunk.slice(1, 5) : chunk.slice(1),
      testimonialWork: chunk.length === 6 ? chunk[5] : null,
    })
  }

  return groups
}

const FallbackTesitmonials = [
  {
    author: 'John Maeda',
    role: 'Artist',
    quote: '"Simplicity is about subtracting the obvious and adding the meaningful."',
  },
   {
    author: 'Steve Jobs',
    role: 'Business Leader',
    quote: '"Design is not just what it looks like and feels like. Design is how it works."',
  },
  {
    author: 'Leo Tolstoy',
    role: 'Author',
    quote: '"There is no greatness where there is not simplicity, goodness, and truth."',
  },
  {
    author: 'Charles Bukowski',
    role: 'Author',
    quote: '"Genius might be the ability to say a profound thing in a simple way."',
  },
  {
    author: 'Frederick Maitland',
    role: 'Historian',
    quote: '"Simplicity is the end result of long, hard work, not the starting point."',
  },
  {
    author: 'Charles Eames',
    role: 'Designer',
    quote: '"The details are not the details. They make the design."',
  },
  {
    author: 'Beth Comstock',
    role: 'Business Leader',
    quote: '"You have to tell a story before you can sell a story."',
  },
  {
    author: 'Coco Chanel',
    role: 'Designer',
    quote: '"Simplicity is the keynote of all true elegance."',
  },
  {
    author: 'Nick Thackray',
    role: 'Business Leader',
    quote: '"Branding is the gravity of your business - unseen, yet holding everything in place."',
  },
  {
    author: 'Scott Cook',
    role: 'Business Leader',
    quote: '"A brand is no longer what we tell the consumer it is - it is what consumers tell each other it is."',
  },
  {
    author: 'Amanda Gorman',
    role: 'Poet and Activist',
    quote: '"There is always light, if only we\'re brave enough to see it. If only we\'re brave enough to be it."',
  },
  {
    author: 'Audrey Hepburn',
    role: 'Actress',
    quote: '"Nothing is impossible. The word itself says, I\'m possible!"'
  }
]

function pickFallbackTesitmonial(work) {
  if (!FallbackTesitmonials.length) return null

  const seed = Number(work?.databaseId) || 1
  const index = Math.abs((seed * 9301 + 49297) % 233280) % FallbackTesitmonials.length
  return FallbackTesitmonials[index] ?? null
}

function collectCardKeys(groups) {
  const keys = new Set()

  groups.forEach((group) => {
    if (group.featured?.databaseId) {
      keys.add(`featured-${group.featured.databaseId}`)
    }

    group.gridItems.forEach((work) => {
      keys.add(`work-${work.databaseId}`)
    })

    if (group.testimonialWork?.databaseId) {
      keys.add(`testimonial-${group.testimonialWork.databaseId}`)
    }
  })

  return keys
}

function WorkCard({ work, aspectRatio = '64%', cardKey }) {
  const builder = work.acfWorkBuilder ?? {}
  //const thumb = getThumbnail(builder.acfFeaturedThumbnail)
  //const thumb2 = getThumbnail(builder.acfSecondaryThumbnail) || thumb
  //NEW SOURCES
  const featuredThumbnail = builder.acfFeaturedThumbnail
  const loaderSrc = getThumbnail(featuredThumbnail, 'loader')
  const mobileSrc = getThumbnail(featuredThumbnail, 'medium')
  const desktopSrc = getThumbnail(featuredThumbnail, 'large')
  const secondaryThumbnail = builder.acfSecondaryThumbnail || featuredThumbnail
  const secondaryLoaderSrc = getThumbnail(secondaryThumbnail, 'loader')
  const secondaryMobileSrc = getThumbnail(secondaryThumbnail, 'medium')
  const secondaryDesktopSrc = getThumbnail(secondaryThumbnail, 'large')
  //END NEW SOURCES
  const thumbAlt = builder.acfFeaturedThumbnail?.node?.altText || work.title
  const categories = builder.acfCategory?.nodes ?? []
  const clients = builder.acfClient?.nodes ?? []

  return (
    <div className="work-card mb-5 md:mb-0">
    <Link 
      to={`/work/${work.slug}`} 
      className="block alt-transition-img thumb-swap-trigger" 
      data-card-key={cardKey} 
      data-transition-source="media"
      data-transition-variant="work-card"
      data-transition-snapshot-state="hover"
    >
      <div
        className="ratio overflow-hidden rounded-[10px] block thumb-swap"
        style={{ '--aspect-ratio-desktop': aspectRatio, '--aspect-ratio-mobile': aspectRatio }}
      >
        
        <PictureImg
          loaderSrc = {loaderSrc + '.webp'}
          mobileSrc = {mobileSrc + '.webp'}
          desktopSrc = {desktopSrc + '.webp'}
          imgClass = 'thumb-primary rounded-[10px]'
          altText = {thumbAlt}
        />
        <PictureImg
          loaderSrc = {secondaryLoaderSrc + '.webp'}
          mobileSrc = {secondaryMobileSrc + '.webp'}
          desktopSrc = {secondaryDesktopSrc + '.webp'}
          imgClass = 'thumb-secondary rounded-[10px]'
          altText = ''
        />
        
        {/*{thumb && <img className="thumb-primary rounded-[10px]" src={thumb + '.webp'} alt={thumbAlt} />}
        {thumb2 && <img className="thumb-secondary rounded-[10px]" src={thumb2 + '.webp'} alt='' aria-hidden="true" />}
        */}
      </div>
      
    </Link>
    <div className="work-card__meta mt-3">
      <h3 className="work-card__title">{clients[0].name}</h3>
      {categories.length > 0 && (
        <div className="work-card__categories mt-3 flex flex-wrap">
          {categories.map(({ name }) => <CategoryBadge key={name} name={name} />)}
        </div>
      )}
    </div>
    </div>
  )
}

function WorkFeatured({ work, cardKey }) {
  const builder = work.acfWorkBuilder ?? {}
  //const thumb = getThumbnail(builder.acfFeaturedThumbnail)
  //const thumb2 = getThumbnail(builder.acfSecondaryThumbnail) || thumb
  //NEW SOURCES
  const featuredThumbnail = builder.acfFeaturedThumbnail
  const loaderSrc = getThumbnail(featuredThumbnail, 'loader')
  const mobileSrc = getThumbnail(featuredThumbnail, 'medium')
  const desktopSrc = getThumbnail(featuredThumbnail, 'large')
  const secondaryThumbnail = builder.acfSecondaryThumbnail || featuredThumbnail
  const secondaryLoaderSrc = getThumbnail(secondaryThumbnail, 'loader')
  const secondaryMobileSrc = getThumbnail(secondaryThumbnail, 'medium')
  const secondaryDesktopSrc = getThumbnail(secondaryThumbnail, 'large')
  //END NEW SOURCES
  const thumbAlt = builder.acfFeaturedThumbnail?.node?.altText || work.title
  const categories = builder.acfCategory?.nodes ?? []
  const clients = builder.acfClient?.nodes ?? []

  return (
    <Link
      to={`/work/${work.slug}`}
      className="work-featured col-start-1 col-span-12 md:col-span-6 block alt-transition-img thumb-swap-trigger"
      data-card-key={cardKey}
      data-transition-source="media"
      data-transition-variant="work-card"
      data-transition-snapshot-state="hover"
    >
      <div
        className="ratio overflow-hidden rounded-[10px] block thumb-swap"
        style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '64%' }}
      >
        <PictureImg
          loaderSrc = {loaderSrc + '.webp'}
          mobileSrc = {mobileSrc + '.webp'}
          desktopSrc = {desktopSrc + '.webp'}
          imgClass = 'thumb-primary rounded-[10px]'
          altText = {thumbAlt}
        />
        <PictureImg
          loaderSrc = {secondaryLoaderSrc + '.webp'}
          mobileSrc = {secondaryMobileSrc + '.webp'}
          desktopSrc = {secondaryDesktopSrc + '.webp'}
          imgClass = 'thumb-secondary rounded-[10px]'
          altText = ''
        />
        {/*
        {thumb && <img className="thumb-primary rounded-[10px]" src={thumb + '.webp'} alt={thumbAlt} />}
        {thumb2 && <img className="thumb-secondary rounded-[10px]" src={thumb2 + '.webp'} alt='' aria-hidden="true" />}
        */}
      </div>
      <div className="work-featured__meta mt-3">
        <h3 className="work-card__title">{clients[0].name}</h3>
        {categories.length > 0 && (
          <div className="work-card__categories mt-3 flex flex-wrap">
            {categories.map(({ name }) => <CategoryBadge key={name} name={name} />)}
          </div>
        )}
      </div>
    </Link>
  )
}

function TestimonialSection({ work, testimonialData, fallbackTestimonial, index, cardKey }) {
  const builder = work.acfWorkBuilder ?? {}
  //const thumb = getThumbnail(builder.acfFeaturedThumbnail)
  //const thumb2 = getThumbnail(builder.acfSecondaryThumbnail) || thumb
  //NEW SOURCES
  const featuredThumbnail = builder.acfFeaturedThumbnail
  const loaderSrc = getThumbnail(featuredThumbnail, 'loader')
  const mobileSrc = getThumbnail(featuredThumbnail, 'medium')
  const desktopSrc = getThumbnail(featuredThumbnail, 'large')
  const secondaryThumbnail = builder.acfSecondaryThumbnail || featuredThumbnail
  const secondaryLoaderSrc = getThumbnail(secondaryThumbnail, 'loader')
  const secondaryMobileSrc = getThumbnail(secondaryThumbnail, 'medium')
  const secondaryDesktopSrc = getThumbnail(secondaryThumbnail, 'large')
  //END NEW SOURCES
  const thumbAlt = builder.acfFeaturedThumbnail?.node?.altText || work.title
  const categories = builder.acfCategory?.nodes ?? []
  const quote = testimonialData?.acfTestimonials?.acfTestimonial ?? fallbackTestimonial?.quote ?? ''
  const role = testimonialData?.acfTestimonials?.acfRole ?? fallbackTestimonial?.role ?? ''
  const author = testimonialData?.title
    ?? fallbackTestimonial?.author
    ?? ''
  const client = testimonialData?.acfClients?.nodes?.[0]?.name
    ?? builder.acfClient?.nodes?.[0]?.name
    ?? ''

  return (
    <section id={`testimonial-${index}`} className="testimonial px-5 py-20 bg-white section-light">
      <div className="grid grid-cols-12 w-full">
        <div className="col-start-1 md:col-start-2 col-span-12 md:col-span-4 flex flex-col items-center justify-center trigger-split-text-coffee">
          <div className="testimonial lead max-w-[38ch]">
            <div className="split-text-coffee trigger-split-text-coffee">
              {quote && <div className="mb-20" dangerouslySetInnerHTML={{ __html: `${quote}` }} />}
              <div>
                {author && <b>{author}</b>}
                {role && <>{author ? <br /> : null}{role}</>}
              </div>
            </div>
          </div>
        </div>
        <div className="col-start-1 md:col-start-7 col-span-12 md:col-span-6">
          <Link 
            to={`/work/${work.slug}`} 
            className="client-work block alt-transition-img thumb-swap-trigger" 
            data-card-key={cardKey}
            data-transition-source="media"
            data-transition-variant="work-card"
            data-transition-snapshot-state="hover"
          >
            <div
              className="ratio overflow-hidden rounded-[10px] block thumb-swap"
              style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '64%' }}
            >
              <PictureImg
                loaderSrc = {loaderSrc + '.webp'}
                mobileSrc = {mobileSrc + '.webp'}
                desktopSrc = {desktopSrc + '.webp'}
                imgClass = 'thumb-primary rounded-[10px]'
                altText = {thumbAlt}
              />
              <PictureImg
                loaderSrc = {secondaryLoaderSrc + '.webp'}
                mobileSrc = {secondaryMobileSrc + '.webp'}
                desktopSrc = {secondaryDesktopSrc + '.webp'}
                imgClass = 'thumb-secondary rounded-[10px]'
                altText = ''
              />
              {/*
              {thumb && <img className="thumb-primary rounded-[10px]" src={thumb + '.webp'} alt={thumbAlt} />}
              {thumb2 && <img className="thumb-secondary rounded-[10px]" src={thumb2 + '.webp'} alt='' aria-hidden="true" />}
              */}
            </div>
            <div className="mt-3 flex">{client || work.title}</div>
            {categories.length > 0 && (
              <div className="categories mt-3 flex flex-wrap">
                {categories.map(({ name }) => <CategoryBadge key={name} name={name} />)}
              </div>
            )}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function WorkPage() {
  const pageRef = useRef(null)
  const { works: initialWorks = [], testimonials: initialTestimonials = {} } = useLoaderData() ?? {}
  const [activeFilter, setActiveFilter] = useState('all')
  const [displayedFilter, setDisplayedFilter] = useState('all')
  const [isFilterAnimating, setIsFilterAnimating] = useState(false)
  const [works, setWorks] = useState(initialWorks)
  const [testimonials, setTestimonials] = useState(initialTestimonials)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreWorks, setHasMoreWorks] = useState(true)
  const workResultsRef = useRef(null)
  const loadSentinelRef = useRef(null)
  const pendingAddedCardKeysRef = useRef(new Set())

  useEffect(() => {
    setWorks(initialWorks)
    setTestimonials(initialTestimonials)
    setHasMoreWorks(initialWorks.length >= WORK_BATCH_SIZE)
    setIsLoadingMore(false)
  }, [initialTestimonials, initialWorks])

  const filteredWorks = useMemo(
    () => works.filter((w) => workMatchesFilter(w, displayedFilter)),
    [works, displayedFilter],
  )

  const groups = useMemo(() => groupWorks(filteredWorks), [filteredWorks])

  const loadNextBatch = useCallback(async () => {
    if (isLoadingMore || !hasMoreWorks) {
      return
    }

    setIsLoadingMore(true)
    const nextFirst = Math.max(works.length + WORK_BATCH_SIZE, WORK_BATCH_SIZE)

    try {
      const { works: nextWorks = [] } = await fetchWorksData({ first: nextFirst })

      if (!Array.isArray(nextWorks) || !nextWorks.length) {
        setHasMoreWorks(false)
        return
      }

      const previousLength = works.length
      const hasNewWorks = nextWorks.length > previousLength

      if (!hasNewWorks) {
        setHasMoreWorks(false)
        return
      }

      setWorks(nextWorks)

      const testimonialIds = [
        ...new Set(
          nextWorks
            .flatMap((work) => work.acfWorkBuilder?.acfTestimonial?.nodes?.map((n) => n.databaseId) ?? [])
            .filter(Boolean),
        ),
      ]

      const uncachedTestimonialIds = testimonialIds.filter((id) => testimonials[id] === undefined)

      if (uncachedTestimonialIds.length) {
        const entries = await Promise.all(
          uncachedTestimonialIds.map(async (id) => [id, await fetchTestimonialData(id)]),
        )

        setTestimonials((prev) => ({
          ...prev,
          ...Object.fromEntries(entries),
        }))
      }
    } catch {
      setHasMoreWorks(false)
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMoreWorks, isLoadingMore, testimonials, works.length])

  useEffect(() => {
    const sentinel = loadSentinelRef.current

    if (!sentinel || !hasMoreWorks) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadNextBatch()
        }
      },
      {
        root: null,
        rootMargin: '0px 0px 420px 0px',
        threshold: 0,
      },
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [hasMoreWorks, loadNextBatch])

  useEffect(() => {
    const cleanupSlideUpAnimations = createSlideUpAnimations(pageRef.current)

    return () => {
      cleanupSlideUpAnimations?.()
    }
  }, [])

  useEffect(() => {
    const cleanupSplitText = createSplitTextAnimation()
    const rafId = requestAnimationFrame(() => {
      refreshScrollTriggers()
    })

    return () => {
      cancelAnimationFrame(rafId)
      cleanupSplitText?.()
    }
  }, [displayedFilter, groups.length])

  useEffect(() => {
    const cleanupWorkThumbHover = createWorkThumbHoverAnimation(workResultsRef.current)

    return () => {
      cleanupWorkThumbHover?.()
    }
  }, [displayedFilter, groups.length])

  useEffect(() => {
    if (!isFilterAnimating) return

    // Wait until the new filtered DOM has rendered before selecting incoming cards.
    if (activeFilter !== displayedFilter) return

    const container = workResultsRef.current
    if (!container) {
      setIsFilterAnimating(false)
      return
    }

    const cards = gsap.utils
      .toArray(container.querySelectorAll('[data-card-key]'))
      .filter((card) => pendingAddedCardKeysRef.current.has(card.dataset.cardKey))

    if (!cards.length) {
      pendingAddedCardKeysRef.current.clear()
      setIsFilterAnimating(false)
      return
    }

    gsap.fromTo(
      cards,
      { autoAlpha: 0, x: 0 },
      {
        autoAlpha: 1,
        x: 0,
        delay: 0.5,
        duration: 1,
        stagger: 0.05,
        ease: 'sine.inOut',
        clearProps: 'opacity,visibility,transform',
        onComplete: () => {
          pendingAddedCardKeysRef.current.clear()
          setIsFilterAnimating(false)
        },
      },
    )
  }, [activeFilter, displayedFilter, isFilterAnimating])

  function handleFilterChange(nextFilter) {
    if (nextFilter === activeFilter || isFilterAnimating) return

    setActiveFilter(nextFilter)

    const nextFilteredWorks = works.filter((w) => workMatchesFilter(w, nextFilter))
    const nextGroups = groupWorks(nextFilteredWorks)
    const nextKeys = collectCardKeys(nextGroups)

    const container = workResultsRef.current
    if (!container) {
      setDisplayedFilter(nextFilter)
      return
    }

    const cards = gsap.utils.toArray(container.querySelectorAll('[data-card-key]'))
    const currentKeys = new Set(cards.map((card) => card.dataset.cardKey).filter(Boolean))

    const removedCards = cards.filter((card) => !nextKeys.has(card.dataset.cardKey))
    const addedKeys = new Set([...nextKeys].filter((key) => !currentKeys.has(key)))
    pendingAddedCardKeysRef.current = addedKeys

    if (!removedCards.length && addedKeys.size === 0) {
      pendingAddedCardKeysRef.current.clear()
      setDisplayedFilter(nextFilter)
      return
    }

    setIsFilterAnimating(true)

    if (!removedCards.length) {
      setDisplayedFilter(nextFilter)
      return
    }

    gsap.to(removedCards, {
      autoAlpha: 0,
      x: 0,
      duration: 0.25,
      stagger: 0.025,
      ease: 'sine.inOut',
      onComplete: () => {
        setDisplayedFilter(nextFilter)
      },
    })
  }

  const pathname = '/work'
  const title = 'Work'
  const description = 'Work Page'

  return (
    <div ref={pageRef}>
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

      <section className="page-hero px-5 py-20 bg-white section-light min-h-[80vh] flex items-end">
        <div className="grid grid-cols-12">
          <div className="col-span-12 change-logo-back" />
          <div className="col-span-9 text-coffee change-logo mt-40 max-w-[115ch]">
            <div className="eyebrow">Explore our work</div>
            <h1 className="hero-title">Simplr&apos;s work is a reflection of <span>passion, dedication and craft,</span> spanning numerous industries both <span><i>locally and internationally.</i></span> See how our work has transformed businesses and partnerships.</h1>
          </div>
        </div>
      </section>

      <section className="work-filter px-5 py-8 bg-white section-light flex justify-end">
        <div className="flex flex-wrap gap-0">
          {FILTERS.map(({ id, label, bg, text }) => {
            const isActive = activeFilter === id
            return (
              <button
                key={id}
                onClick={() => handleFilterChange(id)}
                className="work-filter-btn"
                data-active={isActive}
                disabled={isFilterAnimating}
                style={isActive ? { backgroundColor: bg, color: text, borderColor: bg } : undefined}
              >
                {label}
              </button>
            )
          })}
        </div>
      </section>

      <div ref={workResultsRef} className="work-results">
        {groups.map((group, i) => {
          const n = i + 1
          const rowStyle = { '--work-row-cols': 2 }
          const linkedTestimonialId = group.testimonialWork
            ?.acfWorkBuilder?.acfTestimonial?.nodes?.[0]?.databaseId
          const linkedTestimonialData = linkedTestimonialId ? testimonials[linkedTestimonialId] : null
          const hasLinkedTestimonialQuote = Boolean(
            linkedTestimonialData?.acfTestimonials?.acfTestimonial,
          )
          const testimonialData = hasLinkedTestimonialQuote ? linkedTestimonialData : null
          const fallbackTestimonial = hasLinkedTestimonialQuote
            ? null
            : pickFallbackTesitmonial(group.testimonialWork)

          return (
            <div key={group.featured?.databaseId ?? `group-${n}`}>
              <section id={`work-${n}`} className="work px-5 pb-20 bg-white section-light">
                <div className="work-section grid grid-cols-12 gap-5">

                  {group.featured && (
                    <WorkFeatured
                      work={group.featured}
                      cardKey={`featured-${group.featured.databaseId}`}
                    />
                  )}

                  <div id={`work-grid-${n}`} className="work-grid col-start-1 md:col-start-7 col-span-12 md:col-span-6 flex flex-col justify-between">
                    <div className="work-cards-top work-cards-row md:flex justify-between mb-20" style={rowStyle}>
                      {group.gridItems.slice(0, 2).map((work) => (
                        <WorkCard
                          key={work.databaseId}
                          work={work}
                          cardKey={`work-${work.databaseId}`}
                        />
                      ))}
                    </div>
                    <div className="work-cards-bottom work-cards-row md:flex justify-between" style={rowStyle}>
                      {group.gridItems.slice(2, 4).map((work) => (
                        <WorkCard
                          key={work.databaseId}
                          work={work}
                          cardKey={`work-${work.databaseId}`}
                        />
                      ))}
                    </div>
                  </div>

                </div>
              </section>

              {group.testimonialWork && (
                <TestimonialSection
                  work={group.testimonialWork}
                  testimonialData={testimonialData}
                  fallbackTestimonial={fallbackTestimonial}
                  index={n}
                  cardKey={`testimonial-${group.testimonialWork.databaseId}`}
                />
              )}
            </div>
          )
        })}

        {hasMoreWorks && (
          <section className="bg-white px-5 pt-10">
            <div ref={loadSentinelRef} className="w-full h-px" aria-hidden="true" />
            {isLoadingMore ? (
              <div className="flex justify-center" aria-label="Loading more work">
                <div className="boot-dots" aria-hidden="true">
                  <span className="boot-dot-top"></span>
                  <span className="boot-dot-mask"></span>
                  <span className="boot-dot boot-dot-1"></span>
                  <span className="boot-dot boot-dot-2"></span>
                  <span className="boot-dot boot-dot-3"></span>
                  <span className="boot-dot boot-dot-4"></span>
                  <span className="boot-dot boot-dot-5"></span>
                </div>
              </div>
            ) : null}
          </section>
        )}
      </div>
    </div>
  )
}
