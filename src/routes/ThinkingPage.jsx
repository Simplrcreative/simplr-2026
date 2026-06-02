import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import { gsap } from 'gsap'
import Seo from '../components/Seo.jsx'
import { breadcrumbSchema, webPageSchema } from '../lib/seo.js'
import { createSplitTextAnimation } from '../lib/animations/index.js'
import { buildEntryPath, getThinkingTopicSlug } from '../lib/wp-api.js'

const FILTER_COLOR_MAP = {
  strategy: 'var(--color-strategy)',
  branding: 'var(--color-branding-design)',
  'branding-design': 'var(--color-branding-design)',
  web: 'var(--color-web-design-development)',
  'web-design-development': 'var(--color-web-design-development)',
  motion: 'var(--color-motion)',
  template: 'var(--color-templates)',
  templates: 'var(--color-templates)',
}

const LIGHT_BG_SLUGS = new Set(['strategy', 'web-design-development'])
const CARD_START_HEIGHT = 12

function getFilterColor(slug) {
  const entry = Object.entries(FILTER_COLOR_MAP).find(([key]) => slug.includes(key))
  return entry ? entry[1] : 'var(--color-coffee)'
}

function getThumbnail(featuredImage, preferredSize = 'large') {
  const sizes = featuredImage?.node?.mediaDetails?.sizes
  if (sizes?.length) {
    return (
      sizes.find((size) => size.name === preferredSize)?.sourceUrl
      ?? sizes[sizes.length - 1]?.sourceUrl
      ?? featuredImage?.node?.sourceUrl
      ?? ''
    )
  }

  return featuredImage?.node?.sourceUrl ?? ''
}

function postMatchesFilter(post, filterId) {
  if (filterId === 'all') return true
  const categories = post.topics?.nodes ?? []
  return categories.some((category) => category.slug === filterId)
}

export default function ThinkingPage() {
  const { posts = [] } = useLoaderData() ?? {}
  const [activeFilter, setActiveFilter] = useState('all')
  const postsResultsRef = useRef(null)

  const filters = useMemo(() => {
    const categoriesBySlug = new Map()

    posts.forEach((post) => {
      ;(post.topics?.nodes ?? []).forEach((category) => {
        if (!category?.slug) return
        if (!categoriesBySlug.has(category.slug)) {
          categoriesBySlug.set(category.slug, category)
        }
      })
    })

    return [
      {
        id: 'all',
        label: 'All',
        bg: 'var(--color-coffee)',
        text: '#fff',
      },
      ...Array.from(categoriesBySlug.values())
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
        .map((category) => {
          const bg = getFilterColor(category.slug)
          const text = LIGHT_BG_SLUGS.has(category.slug) ? 'var(--color-coffee)' : '#fff'

          return {
            id: category.slug,
            label: category.name ?? category.slug,
            bg,
            text,
          }
        }),
    ]
  }, [posts])

  const filteredPosts = useMemo(
    () => posts.filter((post) => postMatchesFilter(post, activeFilter)),
    [posts, activeFilter],
  )

  useEffect(() => createSplitTextAnimation(), [])

  useEffect(() => {
    const container = postsResultsRef.current
    if (!container) return

    const cards = Array.from(container.querySelectorAll('[data-post-card]'))
    if (!cards.length) return

    const context = gsap.context(() => {
      cards.forEach((card, index) => {
        const imageFrame = card.querySelector('[data-post-image-frame]')
        const title = card.querySelector('[data-post-title]')

        if (!imageFrame) return

        const finalHeight = imageFrame.getBoundingClientRect().height
        const startHeight = CARD_START_HEIGHT

        gsap.fromTo(
          imageFrame,
          { height: startHeight, autoAlpha: 0.8 },
          {
            height: finalHeight,
            autoAlpha: 1,
            duration: 0.9,
            delay: index * 0.06,
            ease: 'power3.out',
            clearProps: 'height,opacity,visibility',
          },
        )

        if (title) {
          gsap.fromTo(
            title,
            { autoAlpha: 0, y: 18 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.6,
              delay: 0.12 + index * 0.06,
              ease: 'power2.out',
              clearProps: 'opacity,visibility,transform',
            },
          )
        }
      })
    }, container)

    return () => context.revert()
  }, [filteredPosts])

  const pathname = '/thinking'
  const title = 'Thinking'
  const description = 'Thinking Page'

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
          <div className="col-span-12 md:col-span-9 text-coffee change-logo mt-40 max-w-[115ch]">
            <div className="eyebrow">Thinking</div>
            <h1 className="hero-title">Our latest thinking on <span>strategy, design, and building brands</span> that connect <span><i>purpose</i></span> with <span><i>performance.</i></span></h1>
          </div>
        </div>
      </section>

      <section className="post-filter px-5 py-8 bg-white section-light flex justify-end">
        <div className="flex flex-wrap gap-0">
          {filters.map(({ id, label, bg, text }) => {
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

      <section ref={postsResultsRef} className="posts-results px-5 pb-20 bg-white section-dark">
        <div className="thinking-posts-grid">
          {filteredPosts.map((post) => {
            const thumb = getThumbnail(post.acfPostBuilder?.acfFeaturedImage)
            const postTitle = post.title ?? 'Thinking post'

            return (
              <article key={post.databaseId ?? post.slug} className="thinking-post-card" data-post-card>
                <Link
                  to={buildEntryPath('thinking', post.slug, { topicSlug: getThinkingTopicSlug(post) })}
                  className="thinking-post-link"
                >
                  <picture className="thinking-post__image-frame" data-post-image-frame>
                    {thumb ? <img src={thumb + '.webp'} alt={post.featuredImage?.node?.altText || postTitle} /> : null}
                  </picture>
                  <h2 className="thinking-post__title pe-10" data-post-title>{postTitle}</h2>
                </Link>
              </article>
            )
          })}
        </div>
      </section>

    </>
  )
}
