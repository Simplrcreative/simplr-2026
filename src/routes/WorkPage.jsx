import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Seo from '../components/Seo.jsx'
import CategoryBadge, { slugify } from '../components/CategoryBadge.jsx'
import { breadcrumbSchema, webPageSchema } from '../lib/seo.js'
import { createSplitTextAnimation } from '../lib/animations/index.js'

gsap.registerPlugin(ScrollTrigger)

const FILTERS = [
  { id: 'all',                    label: 'All',                      bg: 'var(--color-coffee)',                 text: '#fff' },
  { id: 'strategy',               label: 'Strategy',                 bg: 'var(--color-strategy)',               text: 'var(--color-coffee)' },
  { id: 'branding-design',        label: 'Branding & Design',        bg: 'var(--color-branding-design)',        text: '#fff' },
  { id: 'web-design-development', label: 'Web Design & Development', bg: 'var(--color-web-design-development)', text: 'var(--color-coffee)' },
  { id: 'motion',                 label: 'Motion',                   bg: 'var(--color-motion)',                 text: '#fff' },
  { id: 'templates',              label: 'Templates',                bg: 'var(--color-templates)',              text: '#fff' },
]

function getThumbnail(acfFeaturedThumbnail, preferredSize = 'large') {
  const sizes = acfFeaturedThumbnail?.node?.mediaDetails?.sizes
  if (!sizes?.length) return ''
  return (
    sizes.find((s) => s.name === preferredSize)?.sourceUrl ??
    sizes[sizes.length - 1]?.sourceUrl ??
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
 * Groups works into layout sections. Each group contains:
 * - featured: work with acfFeaturedWork=true (or null)
 * - gridItems: up to 4 (featured) or 8 (no featured) remaining works;
 *              the testimonial work always goes first in the grid
 * - testimonialWork: the grid item with acfTestimonial (or null)
 *
 * Priority per group: latest featured → latest w/ testimonial → others
 */
function groupWorks(works) {
  const used = new Set()
  const groups = []
  const avail = () => works.filter((w) => !used.has(w.databaseId))

  while (avail().length > 0) {
    const pool = avail()
    const featured = pool.find((w) => w.acfWorkBuilder?.acfFeaturedWork)

    if (featured) {
      used.add(featured.databaseId)

      const testimonialWork = avail().find(
        (w) => w.acfWorkBuilder?.acfTestimonial?.nodes?.length > 0,
      )
      const gridItems = []
      if (testimonialWork) {
        used.add(testimonialWork.databaseId)
        gridItems.push(testimonialWork)
      }
      avail().slice(0, 4 - gridItems.length).forEach((w) => {
        used.add(w.databaseId)
        gridItems.push(w)
      })

      groups.push({ featured, gridItems, testimonialWork: testimonialWork ?? null })
    } else {
      const testimonialWork = pool.find(
        (w) => w.acfWorkBuilder?.acfTestimonial?.nodes?.length > 0,
      )
      const gridItems = []
      if (testimonialWork) {
        used.add(testimonialWork.databaseId)
        gridItems.push(testimonialWork)
      }
      avail().slice(0, 8 - gridItems.length).forEach((w) => {
        used.add(w.databaseId)
        gridItems.push(w)
      })

      groups.push({ featured: null, gridItems, testimonialWork: testimonialWork ?? null })
    }
  }

  return groups
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
  const thumb = getThumbnail(builder.acfFeaturedThumbnail)
  const categories = builder.acfCategory?.nodes ?? []
  const clients = builder.acfClient?.nodes ?? []

  return (
    <Link to={`/work/${work.slug}`} className="work-card block" data-card-key={cardKey}>
      <picture
        className="ratio overflow-hidden rounded-[10px] block"
        style={{ '--aspect-ratio-desktop': aspectRatio, '--aspect-ratio-mobile': aspectRatio }}
      >
        {thumb && <img src={thumb} alt={work.title} />}
      </picture>
      <div className="work-card__meta mt-3">
        <h3 className="work-card__title">{clients[0].name}</h3>
        {categories.length > 0 && (
          <div className="work-card__categories mt-3 flex flex-wrap gap-2">
            {categories.map(({ name }) => <CategoryBadge key={name} name={name} />)}
          </div>
        )}
      </div>
    </Link>
  )
}

function WorkFeatured({ work, cardKey }) {
  const builder = work.acfWorkBuilder ?? {}
  const thumb = getThumbnail(builder.acfFeaturedThumbnail)
  const categories = builder.acfCategory?.nodes ?? []
  const clients = builder.acfClient?.nodes ?? []

  return (
    <Link
      to={`/work/${work.slug}`}
      className="work-featured col-start-1 col-span-6 block"
      data-card-key={cardKey}
    >
      <picture
        className="ratio overflow-hidden rounded-[10px] block"
        style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '90%' }}
      >
        {thumb && <img src={thumb} alt={work.title} />}
      </picture>
      <div className="work-featured__meta mt-3">
        <h3 className="work-card__title">{clients[0].name}</h3>
        {categories.length > 0 && (
          <div className="work-card__categories mt-3 flex flex-wrap gap-2">
            {categories.map(({ name }) => <CategoryBadge key={name} name={name} />)}
          </div>
        )}
      </div>
    </Link>
  )
}

function TestimonialSection({ work, testimonialData, index, cardKey }) {
  const builder = work.acfWorkBuilder ?? {}
  const thumb = getThumbnail(builder.acfFeaturedThumbnail)
  const categories = builder.acfCategory?.nodes ?? []
  const quote = testimonialData?.acfTestimonials?.acfTestimonial ?? ''
  const role = testimonialData?.acfTestimonials?.acfRole ?? ''
  const client = testimonialData?.acfClients?.nodes?.[0]?.name
    ?? builder.acfClient?.nodes?.[0]?.name
    ?? ''

  return (
    <section id={`testimonial-${index}`} className="testimonial px-5 py-20 bg-white section-light">
      <div className="grid grid-cols-12">
        <div className="col-start-2 col-span-4 flex flex-col items-center justify-center trigger-split-text-coffee">
          <div className="testimonial lead max-w-[38ch]">
            <div className="split-text-coffee">
              {quote && <div className="mb-20" dangerouslySetInnerHTML={{ __html: `${quote}` }} />}
              <div>
                {client && <b>{client}</b>}
                {role && <>{client ? <br /> : null}{role}</>}
              </div>
            </div>
          </div>
        </div>
        <div className="col-start-7 col-span-6 slide-up-from-left">
          <Link to={`/work/${work.slug}`} className="client-work block" data-card-key={cardKey}>
            <picture
              className="ratio overflow-hidden rounded-[10px] block"
              style={{ '--aspect-ratio-desktop': '90%', '--aspect-ratio-mobile': '90%' }}
            >
              {thumb && <img src={thumb} alt={work.title} title={client} />}
            </picture>
            <div className="mt-3 flex">{client || work.title}</div>
            {categories.length > 0 && (
              <div className="categories mt-3 flex flex-wrap gap-2">
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
  const { works = [], testimonials = {} } = useLoaderData() ?? {}
  const [activeFilter, setActiveFilter] = useState('all')
  const [displayedFilter, setDisplayedFilter] = useState('all')
  const [isFilterAnimating, setIsFilterAnimating] = useState(false)
  const workResultsRef = useRef(null)
  const pendingAddedCardKeysRef = useRef(new Set())

  const filteredWorks = useMemo(
    () => works.filter((w) => workMatchesFilter(w, displayedFilter)),
    [works, displayedFilter],
  )

  const groups = useMemo(() => groupWorks(filteredWorks), [filteredWorks])

  useEffect(() => {
    createSplitTextAnimation()
  })

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

      <section className="page-hero px-5 pb-40 bg-white section-light min-h-screen flex items-end">
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
          const hasFeatured = !!group.featured
          const gridCols = hasFeatured ? 'col-start-7 col-span-6' : 'col-start-1 col-span-12'
          const rowCols = hasFeatured ? 2 : 4
          const rowStyle = { '--work-row-cols': rowCols }
          const testimonialId = group.testimonialWork
            ?.acfWorkBuilder?.acfTestimonial?.nodes?.[0]?.databaseId
          const testimonialData = testimonialId ? testimonials[testimonialId] : null

          return (
            <div key={group.featured?.databaseId ?? `group-${n}`}>
              <section id={`work-${n}`} className="work px-5 pb-20 bg-white section-light">
                <div className="work-section grid grid-cols-12 gap-5">

                  {hasFeatured && (
                    <WorkFeatured
                      work={group.featured}
                      cardKey={`featured-${group.featured.databaseId}`}
                    />
                  )}

                  <div id={`work-grid-${n}`} className={`work-grid ${gridCols} flex flex-col justify-between`}>
                    <div className="work-cards-top work-cards-row flex justify-between" style={rowStyle}>
                      {group.gridItems.slice(0, hasFeatured ? 2 : 4).map((work) => (
                        <WorkCard
                          key={work.databaseId}
                          work={work}
                          cardKey={`work-${work.databaseId}`}
                        />
                      ))}
                    </div>
                    <div className="work-cards-bottom work-cards-row flex justify-between" style={rowStyle}>
                      {group.gridItems.slice(hasFeatured ? 2 : 4, hasFeatured ? 4 : 8).map((work) => (
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
                  index={n}
                  cardKey={`testimonial-${group.testimonialWork.databaseId}`}
                />
              )}
            </div>
          )
        })}

        <section className="bg-white py-20 relative z-3" />
      </div>
    </>
  )
}
