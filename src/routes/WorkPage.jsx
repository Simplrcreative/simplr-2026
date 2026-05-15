import { useEffect, useMemo, useState } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Seo from '../components/Seo.jsx'
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

const LIGHT_TEXT_SLUGS = new Set(['strategy', 'web-design-development'])

function slugify(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function CategoryBadge({ name }) {
  const slug = slugify(name)
  const textClass = LIGHT_TEXT_SLUGS.has(slug) ? 'text-coffee' : 'text-white'
  return (
    <span className={`category bg-${slug} ${textClass} text-leading-none font-medium rounded-full`}>
      {name}
    </span>
  )
}

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

function WorkCard({ work, aspectRatio = '64%' }) {
  const builder = work.acfWorkBuilder ?? {}
  const thumb = getThumbnail(builder.acfFeaturedThumbnail)
  const categories = builder.acfCategory?.nodes ?? []
  const clients = builder.acfClient?.nodes ?? []

  return (
    <Link to={`/work/${work.slug}`} className="work-card block">
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

function WorkFeatured({ work }) {
  const builder = work.acfWorkBuilder ?? {}
  const thumb = getThumbnail(builder.acfFeaturedThumbnail)
  const categories = builder.acfCategory?.nodes ?? []
  const clients = builder.acfClient?.nodes ?? []

  return (
    <Link to={`/work/${work.slug}`} className="work-featured col-start-1 col-span-6 block">
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

function TestimonialSection({ work, testimonialData, index }) {
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
          <Link to={`/work/${work.slug}`} className="client-work block">
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

  const filteredWorks = useMemo(
    () => works.filter((w) => workMatchesFilter(w, activeFilter)),
    [works, activeFilter],
  )

  const groups = useMemo(() => groupWorks(filteredWorks), [filteredWorks])

  useEffect(() => {
    createSplitTextAnimation()
  })

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
                onClick={() => setActiveFilter(id)}
                className="work-filter-btn"
                data-active={isActive}
                style={isActive ? { backgroundColor: bg, color: text, borderColor: bg } : undefined}
              >
                {label}
              </button>
            )
          })}
        </div>
      </section>

      {groups.map((group, i) => {
        const n = i + 1
        const hasFeatured = !!group.featured
        const gridCols = hasFeatured ? 'col-start-7 col-span-6' : 'col-start-1 col-span-12'
        const testimonialId = group.testimonialWork
          ?.acfWorkBuilder?.acfTestimonial?.nodes?.[0]?.databaseId
        const testimonialData = testimonialId ? testimonials[testimonialId] : null

        return (
          <div key={group.featured?.databaseId ?? `group-${n}`}>
            <section id={`work-${n}`} className="work px-5 pb-20 bg-white section-light">
              <div className="work-section grid grid-cols-12 gap-5">

                {hasFeatured && <WorkFeatured work={group.featured} />}

                <div id={`work-grid-${n}`} className={`work-grid ${gridCols} flex flex-col justify-between`}>
                  <div className="work-cards-top flex gap-5 justify-between">
                    {group.gridItems.slice(0, hasFeatured ? 2 : 4).map((work) => (
                      <WorkCard key={work.databaseId} work={work} />
                    ))}
                  </div>
                  <div className="work-cards-bottom flex gap-5 justify-between">
                    {group.gridItems.slice(hasFeatured ? 2 : 4, hasFeatured ? 4 : 8).map((work) => (
                      <WorkCard key={work.databaseId} work={work} />
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
              />
            )}
          </div>
        )
      })}

      <section className="bg-white py-20 relative z-3" />
    </>
  )
}
